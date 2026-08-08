# Security Audit — FDM Backend

**Repo:** `PT-IMM-FDM/backend_app` · **Tanggal:** 8 Agustus 2026
**Sifat data:** data kesehatan karyawan (kelayakan kerja, gejala, catatan medis, lampiran PDF medis) + PII (nama, nomor HP, tanggal lahir, penempatan organisasi)

**Metode.** 6 auditor paralel membaca seluruh codebase. Setiap temuan lalu dikirim ke agent verifikator terpisah yang tugasnya **membantah** klaim tersebut dan default-nya menolak apa pun yang tidak bisa ia buktikan sendiri dari file. 48 temuan dikirim ke verifikasi; **48 lolos, 0 dibantah** (23 dikonfirmasi apa adanya, 25 dikonfirmasi dengan koreksi detail yang sudah dimasukkan ke laporan ini).

> **Peringatan.** Beberapa temuan di bawah bersifat exploitable tanpa akun sama sekali. Sebelum sistem ini jalan di jaringan yang bisa diakses selain localhost, item **C-1 sampai C-6** harus ditutup. Lima dari enam adalah perbaikan trivial atau kecil.

---

## Ringkasan

| Severity | Jumlah |
|---|---|
| 🔴 Critical | **6** |
| 🟠 High | **14** |
| 🟡 Medium | **20** |
| ⚪ Low | **8** |

**Postur keamanan: 2.5 / 10.**

Kerangkanya benar — setiap route non-static memakai `verifyToken`, role diambil ulang dari database dan bukan dipercaya dari klaim token, bcrypt dipakai dengan benar, tidak ada raw SQL, dan tidak ada mass assignment. Yang jebol adalah batas-batasnya: dua endpoint mengambil `user_id` dari body/params tanpa cek kepemilikan, direktori berisi export PII di-serve tanpa autentikasi, dan `JWT_SECRET` produksi panjangnya 3 karakter.

---

## Rantai serangan utama

Temuan-temuan ini tidak berdiri sendiri. Digabung, ada jalur dari **nol akses** ke **takeover akun siapa pun**:

```
1. Tanpa akun, tanpa token:
   GET /Kumpulan%20Data%20Karyawan.xlsx                          [C-3]
   → nama lengkap + nomor HP + tanggal lahir SEMUA karyawan

2. Password awal & reset = firstname + DDMMYYYY                  [H-3]
   → file di langkah 1 berisi persis nama depan + tanggal lahir
   → satu password kandidat untuk setiap karyawan

3. POST /auth/login tanpa rate limit, tanpa lockout              [H-2]
   → coba semuanya, gratis. is_active tidak dicek [H-1],
     jadi akun yang "dinonaktifkan" admin tetap bisa login

4. Dengan token karyawan biasa:
   GET /fdm/response/<uuid>/<id>                                 [C-1]
   → seluruh riwayat kesehatan karyawan lain
   POST /fdm/response/create dengan user_id orang lain           [C-2]
   → palsukan deklarasi FIT/UNFIT atas nama orang lain

5. Atau lewati semuanya:
   JWT_SECRET = 3 huruf kecil → 17.576 kemungkinan               [C-6]
   → pecahkan dari satu token apa pun, forge token Admin
     dengan masa berlaku 99 tahun
```

Tidak satu pun langkah di atas butuh keahlian penyerang. Langkah 5 selesai dalam hitungan milidetik.

---

## 🔴 Critical

### C-1 · IDOR: riwayat kesehatan karyawan mana pun terbuka untuk semua user login

**File:** [src/features/fitDailyMonitoring/responseUser/responseUserRoute.ts:12](src/features/fitDailyMonitoring/responseUser/responseUserRoute.ts#L12) · **Verdict:** CONFIRMED · **Effort:** kecil

```ts
responseUserRoute.get("/:user_id/:attandance_health_result_id", [
  JwtMiddleware.verifyToken,          // ← cuma cek "punya token?"
  ResponseUserController.getResponseUserById,
]);
```

`user_id` diambil dari path param dan langsung dipakai sebagai filter query di [responseUserService.ts:196](src/features/fitDailyMonitoring/responseUser/responseUserService.ts#L196). Tidak ada pengecekan bahwa pemanggil adalah pemilik record itu, dan tidak ada `adminOnly`/`adminOrViewer`.

**Yang dikembalikan:** nama lengkap, nomor HP, email, tanggal lahir, department, company, employment status, job position, status kelayakan (FIT/UNFIT), **setiap jawaban gejala**, rekomendasi, catatan privat perawat Occupational Health, dan URL lampiran PDF medis.

**Skenario.** Karyawan biasa (role `User`) login, ambil tokennya, lalu `GET /fdm/response/<uuid_korban>/1`. Karena `attendance_health_result_id` adalah `Int` autoincrement, id 1..N bisa dienumerasi untuk menarik seluruh riwayat kesehatan korban. Tidak ada rate limit yang memperlambat sweep.

> **Catatan akurasi:** UUID korban tidak dibagikan bebas — endpoint daftar user adalah `POST /user` dan dijaga `adminOrViewer`. Jadi penyerang butuh UUID dulu. Tapi lewat rantai di atas (roster publik → password default → login sebagai korban) UUID itu bisa didapat dari `GET /fdm/me` milik korban. Ini menaikkan biaya serangan satu langkah, tidak menghilangkannya.

**Fix.** Scope query ke pemanggil kecuali pemanggil adalah staf:

```ts
// controller
const caller = res.locals.user as UserToken;
await ResponseUserService.getResponseUserById({ ...params, callerId: caller.user_id });

// service, sebelum findMany
if (data.callerId !== data.user_id) {
  const caller = await prisma.user.findFirst({
    where: { user_id: data.callerId, deleted_at: null, is_active: true },
    select: { role: { select: { name: true } }, department_id: true },
  });
  const staff = caller && ["Admin", "Full Viewer", "Viewer"].includes(caller.role.name);
  if (!staff) throw new ErrorResponse("Forbidden", 403, ["user_id"], "FORBIDDEN");
  // Viewer di-scope per department di fdmService.ts:59-83 — terapkan aturan yang sama di sini
}
```

Kalau frontend sebenarnya hanya pernah mengambil record milik sendiri, opsi termurah: hapus `:user_id` dari path dan baca dari `res.locals.user`.

---

### C-2 · Deklarasi kelayakan kerja bisa dipalsukan atas nama orang lain

**File:** [src/features/fitDailyMonitoring/responseUser/responseUserController.ts:11](src/features/fitDailyMonitoring/responseUser/responseUserController.ts#L11) · **Verdict:** CONFIRMED · **Effort:** trivial

```ts
const { user_id, question_id, question_answer_id, ... } = req.body;
const createResponseUser = await ResponseUserService.createResponseUser({
  user_id,          // ← dari body, res.locals.user tidak pernah disentuh
```

Ini sistem **fatigue & driver fitness**. Record yang ditulis endpoint ini menentukan apakah seseorang boleh mengemudikan kendaraan tambang.

**Skenario A — pelecehan / mengganggu pekerjaan.** Karyawan A POST dengan `user_id` milik B dan `question_answer_id` yang value-nya 3. Service menghitung `result = "UNFIT"` ([responseUserService.ts:67-69](src/features/fitDailyMonitoring/responseUser/responseUserService.ts#L67-L69)), menyimpannya atas nama B, lalu mengirim WhatsApp ke Occupational Health dan kepala department B berisi nama, nomor HP, jabatan B, dan gejala yang dikarang. B dilarang masuk kerja.

**Skenario B — bypass kontrol keselamatan, lebih berbahaya.** B benar-benar tidak fit dan akan mengemudi. Rekannya POST set jawaban all-value-1 atas nama B. `result = "FIT"`. Lalu [questionController.ts:50-66](src/features/fitDailyMonitoring/question/questionController.ts#L50-L66) (`isFilled`) akan men-short-circuit form B sendiri — B tercatat lolos kelayakan mengemudi **tanpa pernah menjawab satu pun pertanyaan fatigue**.

**Fix (satu baris):**

```ts
const { user_id } = res.locals.user as UserToken;   // bukan dari req.body
```

Lalu hapus `user_id` dari `ResponseUserValidation.CREATE_RESPONSE_USER` di [responseUserValidation.ts:5](src/features/fitDailyMonitoring/responseUser/responseUserValidation.ts#L5) supaya field liar di body tidak bisa memunculkannya lagi. Kalau admin memang perlu mengisikan untuk orang lain, buat route terpisah ber-`adminOnly`.

---

### C-3 · Export seluruh data karyawan ditulis ke direktori yang di-serve publik

**File:** [src/features/documentTransfer/documentService.ts:138](src/features/documentTransfer/documentService.ts#L138) · **Verdict:** CONFIRMED · **Effort:** kecil

```ts
const file_name = "Kumpulan Data Karyawan.xlsx";   // nama TETAP
const filePath1 = path.join("./public", file_name);
await workbook.xlsx.writeFile(filePath1);
```

Dan di [app.ts:23](src/app.ts#L23):
```ts
app.use(express.static("public"));                             // dari root situs
app.use("/public", express.static(path.join(__dirname, "../public")));  // dan dari /public
```

Kedua mount berdiri **sebelum** semua route guard. `express.static` tidak tahu apa-apa soal JWT.

**Skenario — tanpa akun sama sekali:**
```bash
curl -o roster.xlsx 'https://<api-host>/Kumpulan%20Data%20Karyawan.xlsx'
```
Kalau admin pernah sekali saja menekan tombol export (`GET /document/list-users`), file itu ada di sana selamanya. Isinya: **nama lengkap, nomor HP, dan tanggal lahir setiap karyawan.**

Export data kesehatan pakai nama berstempel menit — `Export_Data_FDM_08-08-2026_14-32.xlsx` — keyspace 1.440 per hari, dan tidak ada rate limit:
```bash
for h in {00..23}; do for m in {00..59}; do
  curl -sf -o "$h$m.xlsx" "https://<host>/public/Export_Data_FDM_08-08-2026_${h}-${m}.xlsx"
done; done
```

File template (`Template Import Data Karyawan.xlsx`) juga bernama tetap dan membocorkan seluruh daftar company, department, job position, dan employment status internal.

**Fix — jangan simpan ke disk sama sekali.** Stream langsung ke response:

```ts
res.setHeader("Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
res.setHeader("Content-Disposition",
  'attachment; filename="Kumpulan Data Karyawan.xlsx"');
await workbook.xlsx.write(res);
res.end();
```

Satu perubahan ini menutup tiga masalah sekaligus: kebocoran publik, tabrakan nama file antar-admin (lihat M-4), dan hilangnya file saat container di-redeploy.

---

### C-4 · Lampiran PDF medis bisa diunduh tanpa token

**File:** [src/app.ts:23](src/app.ts#L23) · **Verdict:** CONFIRMED · **Effort:** sedang

Sumbernya sama dengan C-3: `express.static` berdiri di depan semua guard. Yang bocor di sini adalah lampiran medis yang diunggah lewat `POST /fdm/addAttachment/:id`.

```bash
curl https://<host>/uploads/fdm_attachment_file/hasil_lab-1723101234567.pdf
# 200 OK. Tidak ada 401.
```

URL lengkapnya dibagikan luas: `file_url` dikembalikan ke setiap admin dan viewer lewat `GET /fdm` ([fdmService.ts:106,127](src/features/fitDailyMonitoring/fdmService.ts#L106) `attachment_health_file: true`), dicatat `logger.info`, dan bisa dibocorkan lewat screenshot, chat, atau access log. Siapa pun yang melihat URL-nya bisa meneruskannya ke pihak yang **tidak punya akun sama sekali**.

Verifikator menemukan ini lebih buruk dari klaim awal: file roster yang di-upload ke `public/uploads/users_file/` **tidak pernah dihapus** — `importFileListUsers` tidak punya panggilan unlink sama sekali. Jadi ini bukan jendela waktu, ini permanen.

**Fix.** Hapus kedua mount static untuk pohon uploads, serve lewat router yang sudah tahu siapa pemanggilnya:

```ts
fdmRoute.get("/attachment/:id", [
  JwtMiddleware.verifyToken, JwtMiddleware.adminOnly,
  async (req, res, next) => {
    const a = await prisma.attendanceHealthFileAttachment.findUnique({
      where: { attendance_health_file_attachment_id: +req.params.id },
    });
    if (!a) return next(new ErrorResponse("File not found", 404, ["file"], "FILE_NOT_FOUND"));
    res.download(path.resolve("public/uploads/fdm_attachment_file",
                              path.basename(a.file_name)));   // basename wajib
  },
]);
```

`path.basename` di situ menahan beban — tanpanya, `:id` jadi path traversal.

---

### C-5 · Kredensial admin default ter-commit ke GitHub, dan seed jalan tiap container start

**File:** [prisma/seed/adminDefault.ts:5](prisma/seed/adminDefault.ts#L5) · **Verdict:** CONFIRMED (dengan koreksi) · **Effort:** trivial

```ts
export const adminDefault = [{
  full_name: "Admin",
  phone_number: "00000",
  password: "@dmin123",     // ← role_id 1 = Admin
  ...
}];
```

Terverifikasi: file ini **git-tracked**, remote-nya `https://github.com/PT-IMM-FDM/backend_app.git`. Duplikat basi dari literal yang sama juga ter-commit di [prisma/seed/adminDefault.js:8](prisma/seed/adminDefault.js#L8).

Kredensialnya langsung bisa dipakai: [auth-service.ts:26-43](src/features/auth/auth-service.ts#L26-L43) mencocokkan `phone_number` OR `email`, tidak ada rate limit, tidak ada pemaksaan ganti password. Guard admin cuma mengecek `role.name === "Admin"`.

**Yang membuatnya jauh lebih parah:** [docker-compose.yml:19](docker-compose.yml#L19) menjalankan `npx prisma db seed` di **setiap** container start, dan [prisma/seed/index.ts:15-30](prisma/seed/index.ts#L15-L30) melakukan:

```ts
await tx.user.deleteMany({});     // SEMUA user dihapus
await tx.user.createMany({ ...adminDefault });   // lalu admin default dibuat ulang
```

Jadi setiap restart container: seluruh tabel user hilang, dan akun admin berpassword publik muncul kembali. Mekanisme `init.lock` yang dimaksudkan untuk mencegah ini tidak bekerja — lihat H-8.

**Fix.**
1. Ganti password admin di produksi **sekarang**, sebelum apa pun.
2. Buang literal password dari repo; baca dari env: `password: process.env.SEED_ADMIN_PASSWORD`, dan gagalkan seed kalau tidak diset.
3. Ubah seed jadi idempoten — pakai `upsert`, hapus semua `deleteMany({})`.
4. Hapus 8 file `.js` hasil kompilasi dari `prisma/seed/`, tambahkan `*.js` ke `.gitignore` di direktori itu.
5. Karena sudah ada di history GitHub, anggap password `@dmin123` bocor permanen — rotasi, bukan sekadar hapus.

---

### C-6 · `JWT_SECRET` produksi panjangnya 3 karakter

**File:** `.env` (tidak ter-commit; nilai tidak ditampilkan di sini) · **Verdict:** CONFIRMED · **Effort:** trivial

Diukur langsung, tanpa mencetak nilainya: **panjang 3, seluruhnya huruf kecil a–z.** Ruang kunci = 26³ = **17.576 kemungkinan**.

**Skenario.**
1. Penyerang mendapat satu JWT — valid atau sudah expired, tidak masalah untuk pemulihan kunci.
2. `hashcat -m 16500 token.txt -a 3 ?l?l?l` menghabiskan seluruh ruang kunci dalam milidetik dan mencetak secret-nya.
3. `jwt.sign({ user_id: <uuid_admin>, role_id: 1 }, secret, { expiresIn: '99y' })`.
4. Kirim sebagai `Authorization: Bearer <forged>`. `verifyToken` menerimanya, `adminOnly` melihat role Admin, dan penyerang punya akses baca/tulis penuh ke seluruh user, seluruh data kesehatan, dan seluruh dokumen.

Semua kontrol lain di sistem ini menjadi tidak relevan begitu langkah 2 selesai.

**Kabar baiknya:** `.env` **tidak pernah ter-commit**. Saya verifikasi ke seluruh git history (`git log --all --diff-filter=A --name-only`), bukan sekadar melihat `.gitignore`. Paparannya terbatas pada siapa pun yang memegang server atau image — tapi lihat H-6: tanpa `.dockerignore`, `.env` ini ikut terpanggang ke dalam layer image.

**Fix — rotasi sekarang, lalu pasang fail-fast:**

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

```ts
// src/index.ts — paling atas, SEBELUM import ./app
import 'dotenv/config';
const { JWT_SECRET, DATABASE_URL, PORT } = process.env;
if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error('JWT_SECRET missing or < 32 chars');
if (!DATABASE_URL) throw new Error('DATABASE_URL missing');
if (!PORT) throw new Error('PORT missing');
```

Enam baris, dan sekaligus menutup H-9 (tidak ada validasi env saat startup) dan M-15 (`PORT` undefined → bind ke port acak). Tidak perlu library env-schema untuk empat key.

Rotasi secret akan menginvalidasi semua token yang beredar — itu justru yang diinginkan di sini.

---

## 🟠 High

### H-1 · `is_active` adalah kontrol keamanan yang tidak menjalankan apa pun
[src/features/auth/auth-service.ts:26](src/features/auth/auth-service.ts#L26) · CONFIRMED · trivial

Admin bisa mengatur `is_active`, UI menampilkannya, `updateUser` menulisnya. Login **tidak pernah mengeceknya** — query hanya menyaring `deleted_at: null`. Tidak ada guard yang mengeceknya juga. Menonaktifkan karyawan yang keluar kerja tidak melakukan apa-apa: dia tetap bisa login dan mengakses semuanya.

**Fix:** tambahkan `is_active: true` ke `where` di login, dan ke lookup di `adminOnly`/`adminOrViewer`.

### H-2 · Tidak ada rate limit, lockout, atau throttling di seluruh repo
[src/features/auth/auth-route.ts:7](src/features/auth/auth-route.ts#L7) · CONFIRMED · trivial

Grep seluruh codebase: tidak ada `express-rate-limit` maupun mekanisme throttle apa pun. `POST /auth/login` menerima percobaan tak terbatas. Digabung H-3 (password deterministik), ini bukan brute-force — ini tinggal mengetik.

**Fix:**
```ts
import rateLimit from "express-rate-limit";
authRoute.post("/login",
  rateLimit({ windowMs: 15*60*1000, max: 10 }),
  AuthController.login);
```

### H-3 · Password awal dan reset = `namadepan` + `DDMMYYYY`
[src/utils/format.ts:19](src/utils/format.ts#L19) · CONFIRMED · sedang

```ts
export const password_generator = (name: string, birth_date: Date) => {
  const first_name = name.split(" ")[0].toLowerCase();
  ...
  return `${first_name}${dateDay}${dateMonth}${dateFullYear}`;
}
```

Dipakai di `createUser`, `resetPassword`, dan import Excel massal. Tidak ada pemaksaan ganti password di login pertama. Nama depan dan tanggal lahir adalah tepat dua kolom yang dibocorkan roster publik di C-3.

**Fix:** generate acak (`crypto.randomBytes(9).toString('base64url')`), sampaikan lewat kanal yang sudah ada (WhatsApp), tambahkan flag `must_change_password` yang memblokir semua route selain `updatePassword` sampai diganti.

### H-4 · Guard `adminOnly` / `adminOrViewer` ditulis fail-open
[src/middlewares/jwt_middleware.ts:26](src/middlewares/jwt_middleware.ts#L26) · CONFIRMED · kecil

```ts
const { user_id } = res.locals.user as UserToken;
if (user_id) {                                  // ← kalau falsy, langsung next()
  const userData = await prisma.user.findFirst({ where: { user_id }, ... });
  if (userData && userData.role.name !== "Admin") {   // ← kalau userData null, langsung next()
    throw new ErrorResponse("Only be accessed by Admin.", 403, ...);
  }
}
next();
```

`throw` bersarang di dalam dua pengecekan truthiness. Kalau klaim `user_id` hilang, atau baris user tidak ditemukan (user dihapus, DB ganti), guard-nya **meneruskan request**. Default sebuah kontrol otorisasi harus menolak, bukan meloloskan.

Lookup-nya juga tidak menyaring `deleted_at` maupun `is_active` — jadi admin yang sudah di-soft-delete tetap lolos selama tokennya belum expired.

**Fix:**
```ts
const user = await prisma.user.findFirst({
  where: { user_id, deleted_at: null, is_active: true },
  select: { role: { select: { name: true } } },
});
if (!user || user.role.name !== "Admin") {
  return next(new ErrorResponse("Only be accessed by Admin.", 403, ["ADMIN_ONLY"], "ADMIN_ONLY"));
}
next();
```

### H-5 · `email` dan `phone_number` adalah identitas login tanpa unique constraint
[prisma/schema.prisma:13](prisma/schema.prisma#L13) · CONFIRMED · kecil

Login mencari dengan `findFirst({ where: { OR: [{email}, {phone_number}] } })` — tanpa `orderBy`, jadi baris mana yang menang tidak deterministik. Schema tidak punya satu pun `@unique`.

Admin bisa membuat user kedua dengan email yang sama lewat endpoint create biasa (`createUser` hanya mengecek duplikasi `phone_number`, tidak `email`). Setelah itu, siapa yang login saat email tersebut dipakai ditentukan oleh urutan baris di Postgres.

**Fix:** `@unique` pada `phone_number`, `@unique` pada `email` (nullable unique aman di Postgres — banyak NULL diizinkan). Bersihkan duplikat yang sudah ada dulu.

### H-6 · Tidak ada `.dockerignore` — `.env` asli ikut terpanggang ke image
[Dockerfile:41](Dockerfile#L41) · CONFIRMED · trivial

`COPY . .` tanpa `.dockerignore` menyalin `.env` (berisi `DATABASE_URL` dan `JWT_SECRET` produksi), seluruh history `.git`, dan `node_modules` ke dalam layer image. Siapa pun yang bisa menarik image itu bisa membaca secret-nya — `docker history` cukup, tidak perlu menjalankan containernya.

**Fix:** buat `.dockerignore`:
```
node_modules
.git
.env
.env.*
*.log
public
.wwebjs_auth
build
dist
```

### H-7 · `db push --force-reset` dan seed dijalankan saat BUILD
[Dockerfile:45](Dockerfile#L45) · CONFIRMED · trivial

```dockerfile
RUN npx prisma db push --force-reset    # DROP seluruh schema
RUN npm run build
RUN npm run seed                        # deleteMany semua tabel, isi ulang
```

`--force-reset` menghapus database. Kalau build ini pernah dijalankan dengan `DATABASE_URL` yang menunjuk ke DB produksi, DB itu hilang. Dalam praktiknya build-nya gagal (tidak ada DB saat build time), yang berarti image ini kemungkinan tidak pernah berhasil dibangun sejak baris tersebut ditambahkan.

**Fix:** hapus ketiganya dari Dockerfile. Migrasi dan seed adalah langkah *deploy*, bukan langkah *build*. Jalankan `npx prisma migrate deploy` sekali saat rilis.

### H-8 · Perintah compose: pada boot pertama API tidak pernah start; lock-nya juga tidak bekerja
[docker-compose.yml:19](docker-compose.yml#L19) · CONFIRMED · kecil

```sh
[ ! -f /app/.docker-data/init.lock ] && npx prisma db push && npx prisma db seed \
  && touch /app/.docker-data/init.lock || node build/index.js
```

Saya jalankan logikanya:

| Kondisi | Yang terjadi |
|---|---|
| Lock **tidak ada** (boot pertama) | Rantai `&&` sukses → cabang `\|\|` **tidak pernah jalan** → seed selesai, container **exit**. API tidak pernah hidup. |
| Lock **ada** | `node build/index.js` jalan. |

Dan lock-nya sendiri tidak pernah terbaca: volume di-mount ke `/app`, sementara `touch` menulis ke `/app/.docker-data/init.lock` — path yang tidak ada di dalam volume tersebut. Jadi setiap boot dianggap boot pertama → **seed jalan tiap start → semua user terhapus tiap restart** (lihat C-5).

**Fix:** hentikan pemakaian shell one-liner untuk ini. Jalankan `prisma migrate deploy` sebagai langkah rilis terpisah, dan jadikan `command:` cuma `node build/index.js`.

### H-9 · Tidak ada validasi env saat startup
[src/features/auth/auth-service.ts:73](src/features/auth/auth-service.ts#L73) · CONFIRMED · trivial

`process.env.JWT_SECRET!` — non-null assertion pada nilai yang tidak pernah dicek. Kalau `JWT_SECRET` hilang, aplikasi tetap boot normal dan baru gagal saat request login pertama. Ditutup oleh snippet 6 baris di C-6.

### H-10 · 24 kerentanan diketahui di dependency produksi
[package.json](package.json) · CONFIRMED (dengan koreksi) · kecil

`npm audit --omit=dev` terhadap lockfile yang ter-commit: **24 kerentanan (1 critical, 14 high, 5 moderate, 4 low)** di 314 paket produksi. Lockfile-nya berumur ~18 bulan.

| Paket | Versi terkunci | Masalah |
|---|---|---|
| `tar` (via `bcrypt` → `@mapbox/node-pre-gyp`) | 6.2.1 | **Critical** |
| `puppeteer` (via `whatsapp-web.js`) | 18.2.1 | Chromium ~Okt 2022, CVE menumpuk |
| `multer` | 1.4.5-lts.1 | 1.x deprecated, DoS |
| `tar-fs` | 2.1.1 | Path traversal |
| `ws` | 8.9.0 | DoS |
| `express` | 4.19.2 | Perbaikan ada di 4.21.x |
| `body-parser` | 1.20.2 | DoS, perbaikan di 1.20.3 |
| `path-to-regexp` | 0.1.7 | ReDoS |
| `jws` (via `jsonwebtoken`) | 3.2.2 | — |

**Fix:** `npm audit fix` dulu (menyelesaikan sebagian besar tanpa breaking change), lalu naikkan `multer` ke 2.x secara sadar. `puppeteer` terikat versi `whatsapp-web.js` — kalau tidak bisa dinaikkan, isolasi worker WhatsApp dari API (lihat H-13).

### H-11 · Satu salt bcrypt dipakai untuk semua password
[src/utils/hash.ts:3](src/utils/hash.ts#L3) · CONFIRMED · trivial

`const genSalt = bcrypt.genSaltSync(10);` dihitung sekali saat module load. Dua user berpassword sama akan punya hash identik, yang membocorkan informasi dari dump database dan meniadakan seluruh tujuan salt.

**Fix:** `return bcrypt.hash(password, 10);` — bcrypt akan generate salt per-password sendiri.

### H-12 · Endpoint export mengabaikan role dan department pemanggil
[src/features/documentTransfer/documentController.ts:21](src/features/documentTransfer/documentController.ts#L21) · CONFIRMED · kecil

`/user` dan `/fdm` menerapkan scoping department untuk role Viewer ([fdmService.ts:59-83](src/features/fitDailyMonitoring/fdmService.ts#L59-L83)). Route `/document/*` yang dijaga `adminOrViewer` **tidak** — `exportFileListUsers` dan `exportDataFdm` tidak pernah membaca `res.locals.user`. Seorang Viewer yang seharusnya hanya melihat departmentnya sendiri bisa mengekspor seluruh organisasi lewat endpoint export.

### H-13 · Klien WhatsApp/Puppeteer di-initialize saat import module
[src/app.ts:18](src/app.ts#L18) · CONFIRMED · sedang

```ts
const whatsapp = clientWhatsapp.initialize()   // tidak di-await, tidak di-catch
```

Meng-import `app` = men-spawn Chromium. Setiap proses jadi browser host. Promise-nya melayang tanpa catch, jadi kegagalan auth WhatsApp bisa membawa turun API. Session `.wwebjs_auth` tidak di-mount ke volume mana pun, jadi setiap recreate container butuh scan QR ulang — dan QR-nya muncul di log container.

**Fix:** pisahkan pengiriman notifikasi ke proses worker terpisah. API tidak boleh punya dependency runtime ke browser.

### H-14 · Login membocorkan keberadaan akun
[src/features/auth/auth-service.ts:45](src/features/auth/auth-service.ts#L45) · CONFIRMED · trivial

`"Invalid Email or Phone Number"` untuk identitas tidak dikenal vs `"Invalid Password"` untuk password salah. Enumerasi akun gratis, tanpa rate limit. Kembalikan satu pesan identik untuk kedua kasus.

---

## 🟡 Medium

| # | Temuan | File |
|---|---|---|
| M-1 | Stack trace bocor di **semua** environment — `NODE_ENV` dibaca tapi tidak pernah di-set di Dockerfile, compose, atau `.env` | [error_middleware.ts:42,50](src/middlewares/error_middleware.ts#L42) |
| M-2 | `jwt.verify` dipanggil tanpa opsi: `algorithms`, `issuer`, `audience` tidak dibatasi *(catatan: jsonwebtoken 9.x sudah menolak `alg:none` secara default, jadi ini defense-in-depth, bukan bypass aktif)* | [jwt_middleware.ts:14](src/middlewares/jwt_middleware.ts#L14) |
| M-3 | multer tanpa `fileFilter` dan tanpa `limits` — MIME apa pun, ukuran apa pun, ditulis ke direktori yang di-serve web | [multer.ts:31](src/middlewares/multer.ts#L31) |
| M-4 | Dua admin export bersamaan saling menimpa file dan mengunduh dataset yang salah (nama file tetap) | [documentService.ts:138](src/features/documentTransfer/documentService.ts#L138) |
| M-5 | `deleteFile` menyusun path unlink dengan `split("uploads")[1]` lalu `decodeURIComponent` — primitif traversal tanpa containment check | [delete_file.ts:4](src/utils/delete_file.ts#L4) |
| M-6 | Tidak ada helmet, tidak ada `Content-Disposition`, tidak ada hardening `serve-static` | [app.ts:20](src/app.ts#L20) |
| M-7 | Tidak ada logout, tidak ada revocation, tidak ada refresh — token 15 menit tidak bisa dibatalkan dan expiry tidak punya jalur pemulihan | [auth-route.ts:5](src/features/auth/auth-route.ts#L5) |
| M-8 | Pagination tak dibatasi: tanpa `?page=` seluruh tabel dikembalikan; `page` negatif menghasilkan 500 | [fdmService.ts:109](src/features/fitDailyMonitoring/fdmService.ts#L109) |
| M-9 | User yang di-soft-delete masih lolos role middleware, masih bisa ganti password, masih bisa submit FDM | [jwt_middleware.ts:27](src/middlewares/jwt_middleware.ts#L27) |
| M-10 | Panggilan WhatsApp dilakukan di dalam transaction Prisma, tanpa `await` — alert bisa terkirim untuk submission yang di-rollback | [responseUserService.ts:170](src/features/fitDailyMonitoring/responseUser/responseUserService.ts#L170) |
| M-11 | `WORKDIR /` menaruh seluruh aplikasi di root filesystem dan berjalan sebagai **root** | [Dockerfile:33](Dockerfile#L33) |
| M-12 | Log winston ditulis ke filesystem container tanpa rotasi dan tanpa volume — hilang tiap restart | [logging.ts:8](src/applications/logging.ts#L8) |
| M-13 | Tidak ada handler SIGTERM — `docker stop` memutus request berjalan dan membocorkan pool Prisma serta browser Puppeteer | [index.ts:4](src/index.ts#L4) |
| M-14 | Tidak ada `restart` policy, `healthcheck`, atau process manager — crash berarti layanan mati sampai ada manusia yang sadar | [docker-compose.yml:12](docker-compose.yml#L12) |
| M-15 | `app.listen(process.env.PORT)` tanpa fallback — kalau `PORT` kosong, bind ke port acak dari OS | [index.ts:4](src/index.ts#L4) |
| M-16 | Tidak ada volume untuk `public/` — semua upload dan export hilang tiap redeploy | [docker-compose.yml:8](docker-compose.yml#L8) |
| M-17 | Import Excel menghapus **seluruh direktori upload bersama** (`rmSync recursive`) di dalam loop per-baris | [documentService.ts:253](src/features/documentTransfer/documentService.ts#L253) |
| M-18 | Lookup master-data by name mengabaikan `deleted_at`, dan tidak ada unique constraint pada nama apa pun | [userService.ts:160](src/features/user-management/userService.ts#L160) |
| M-19 | State global mutable `adminDefault` dibagi antar request — filter penyembunyian admin gagal tergantung urutan panggilan | [fdmService.ts:31](src/features/fitDailyMonitoring/fdmService.ts#L31) |
| M-20 | Tidak ada body size limit eksplisit, tidak ada compression, tidak ada request id / correlation | [app.ts:20](src/app.ts#L20) |

---

## ⚪ Low

- **Otorisasi membandingkan nama role sebagai teks bebas** terhadap tabel yang bisa diedit dan tanpa unique constraint — mengganti nama role `"Admin"` di DB akan mematikan seluruh akses admin. [jwt_middleware.ts:73](src/middlewares/jwt_middleware.ts#L73)
- **`cors()` tanpa konfigurasi** → `Access-Control-Allow-Origin: *`. Risikonya **terbatas** di sini karena auth-nya bearer token di header, bukan cookie — situs pihak ketiga tidak bisa membaca token korban dari localStorage aplikasi. Tetap sebaiknya dibatasi ke origin frontend. [app.ts:20](src/app.ts#L20)
- **Import xlsx mempercayai header `Content-Type` dari klien**, tidak pernah memeriksa magic bytes. [documentService.ts:151](src/features/documentTransfer/documentService.ts#L151)
- **`MulterError` jatuh ke handler 500 generik** yang membocorkan stack trace. [error_middleware.ts:44](src/middlewares/error_middleware.ts#L44)
- **Derivasi nama file `split(".")`** membuang ekstensi majemuk (`a.tar.gz` → `a.gz`), mengarang ekstensi untuk file tanpa ekstensi, dan bertabrakan pada upload di milidetik yang sama. *(Tidak bisa menghasilkan `..` — itu tertahan, meski secara kebetulan.)* [multer.ts:21](src/middlewares/multer.ts#L21)
- **`UserToken` mendeklarasikan `company_id`** yang tidak pernah di-sign ke token. TypeScript akan meloloskan `res.locals.user.company_id` sebagai `string` padahal runtime-nya `undefined` — jebakan untuk perubahan scoping berikutnya. [token_model.ts:3](src/models/token_model.ts#L3)
- **8 file `.js` seed ter-commit** berdampingan dengan sumber `.ts`, menciptakan tempat kedua penyimpanan kredensial yang bisa basi. [prisma/seed/adminDefault.js:8](prisma/seed/adminDefault.js#L8)
- **Nol test yang menguji guard otorisasi**, dan tidak ada audit log untuk event autentikasi.

---

## Yang sudah benar

Supaya seimbang — ini bukan kode yang ceroboh soal keamanan, ini kode yang benar di lapisan dalam dan bocor di batasnya.

- **`.env` tidak pernah ter-commit.** Diverifikasi ke seluruh git history, bukan asumsi dari `.gitignore`.
- **`verifyToken` menutupi 100% permukaan API.** Sembilan file route, satu-satunya pengecualian adalah `POST /auth/login` — memang seharusnya begitu. Tidak ada route yang terlupa terbuka.
- **Role diambil ulang dari database tiap request**, bukan dipercaya dari klaim JWT. Pencabutan hak berlaku instan.
- **Nol raw SQL.** Tidak ada `$queryRaw`/`$executeRawUnsafe` di codebase. SQL injection tidak mungkin lewat jalur ini.
- **Nol mass assignment.** Tidak ada `prisma.create({ data: req.body })`. Zod membuang key tak dideklarasi, dan `updateMe` menyusun objeknya field-by-field sehingga `role_id`/`is_active` tidak bisa diselundupkan.
- **Import massal tidak bisa dipakai naik hak.** [documentService.ts:176,244](src/features/documentTransfer/documentService.ts#L176) meng-hardcode `role.name === "User"` alih-alih membaca kolom role dari spreadsheet yang diunggah.
- **Login menyaring `deleted_at: null`** — user yang di-soft-delete tidak bisa mendapat token baru.
- **bcrypt dipakai dengan benar** (cost 10, `compareSync`) — tidak ada hashing buatan sendiri, tidak ada plaintext, tidak ada `===` pada hash.
- **Batas ukuran dan jumlah lampiran benar-benar ditegakkan** di [fdmService.ts:445-470](src/features/fitDailyMonitoring/fdmService.ts#L445-L470) (5MB, maks 3 file).
- **Tidak ada secret atau token yang ter-log.**

---

## Urutan pengerjaan

**Hari ini, sebelum apa pun jalan di jaringan:**
1. Rotasi `JWT_SECRET` (C-6) — 1 perintah
2. Ganti password admin produksi (C-5) — 1 query
3. `user_id` dari token, bukan dari body (C-2) — 1 baris
4. Buat `.dockerignore` (H-6) — 1 file
5. Hapus `--force-reset` dan `seed` dari Dockerfile (H-7) — hapus 3 baris

**Minggu ini:**
6. Stream export, jangan tulis ke `public/` (C-3) — ~10 baris
7. Cek kepemilikan di `GET /fdm/response/:user_id/:id` (C-1)
8. Serve lampiran lewat route ber-auth, hapus mount static (C-4)
9. Guard fail-closed + cek `is_active` (H-4, H-1)
10. Rate limit di login (H-2)
11. `npm audit fix` (H-10)
12. Salt bcrypt per-password (H-11)

**Sebelum dianggap layak produksi:**
13. Password acak + pemaksaan ganti (H-3)
14. Unique constraint pada `phone_number` dan `email` (H-5)
15. Set `NODE_ENV=production` (M-1) dan helmet (M-6)
16. Batasi pagination (M-8)
17. Perbaiki jalur deploy (H-8) dan pisahkan worker WhatsApp (H-13)

Rencana lengkap dengan estimasi ada di [IMPROVEMENTS.md](IMPROVEMENTS.md).
