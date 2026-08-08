# Improvement Plan — FDM Backend

Pendamping [CODE_REVIEW.md](CODE_REVIEW.md) dan [SECURITY_AUDIT.md](SECURITY_AUDIT.md).
Diurutkan berdasarkan **dampak dibagi usaha**, bukan berdasarkan kerapian.

**Prinsipnya:** semua yang di bawah ini adalah pengurangan atau perbaikan satu baris. Tidak ada rewrite, tidak ada framework baru, tidak ada abstraksi baru. Arsitektur yang ada sudah benar — yang perlu ditutup adalah lubang di batasnya.

---

## Fase 0 — Hari ini (± 2 jam, blocker deploy)

Lima perubahan. Empat di antaranya satu baris atau satu file.

### 0.1 Rotasi `JWT_SECRET`
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
# masukkan ke .env, restart
```
Secret sekarang panjangnya 3 karakter. Semua token yang beredar akan invalid setelah rotasi — memang itu yang diinginkan.

### 0.2 Fail-fast untuk env
```ts
// src/index.ts — paling atas, SEBELUM import ./app
import 'dotenv/config';
const { JWT_SECRET, DATABASE_URL, PORT } = process.env;
if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error('JWT_SECRET missing or < 32 chars');
if (!DATABASE_URL) throw new Error('DATABASE_URL missing');
if (!PORT) throw new Error('PORT missing');
```
Enam baris menutup tiga temuan sekaligus: secret lemah, tidak ada validasi env, `PORT` undefined. **Lewati library env-schema** — empat key tidak butuh schema.

### 0.3 `user_id` dari token, bukan dari body
```ts
// src/features/fitDailyMonitoring/responseUser/responseUserController.ts:11
- const { user_id, question_id, ... } = req.body;
+ const { user_id } = res.locals.user as UserToken;
+ const { question_id, ... } = req.body;
```
Lalu hapus `user_id` dari `ResponseUserValidation.CREATE_RESPONSE_USER`, supaya field liar di body tidak bisa memunculkannya lagi.

### 0.4 Ganti password admin default
```sql
-- ganti hash-nya langsung di produksi
UPDATE users SET password = '<bcrypt hash baru>' WHERE phone_number = '00000';
```
Lalu di repo: hapus literal `"@dmin123"` dari [prisma/seed/adminDefault.ts](prisma/seed/adminDefault.ts), baca dari `process.env.SEED_ADMIN_PASSWORD`, dan `git rm` delapan file `.js` di `prisma/seed/`.

Password lama sudah ada di history GitHub publik — anggap bocor permanen.

### 0.5 `.dockerignore`
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
Tanpa ini, `COPY . .` memanggang `.env` produksi ke dalam layer image.

---

## Fase 1 — Minggu ini (± 1 hari)

### 1.1 Berhenti menulis data sensitif ke direktori yang di-serve publik

Perubahan tunggal dengan hasil terbesar di seluruh dokumen ini. Alih-alih menulis workbook ke `./public/` lalu mengembalikan URL-nya, stream langsung ke response:

```ts
// documentController.exportFileListUsers — dan dua export lainnya
res.setHeader("Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
res.setHeader("Content-Disposition",
  'attachment; filename="Kumpulan Data Karyawan.xlsx"');
await workbook.xlsx.write(res);
res.end();
```

Sekali ubah, empat masalah hilang:
- kebocoran roster PII tanpa autentikasi
- kebocoran export data kesehatan tanpa autentikasi
- tabrakan nama file saat dua admin export bersamaan
- file export hilang saat container redeploy (jadi tidak relevan lagi)

Sekaligus **hapus** `app.use(express.static("public"))` di [app.ts:23](src/app.ts#L23) — mount duplikat yang menyajikan seluruh pohon dari root situs.

### 1.2 Lampiran medis lewat route ber-auth

```ts
fdmRoute.get("/attachment/:id", [
  JwtMiddleware.verifyToken, JwtMiddleware.adminOnly,
  async (req, res, next) => {
    const a = await prisma.attendanceHealthFileAttachment.findUnique({
      where: { attendance_health_file_attachment_id: +req.params.id },
    });
    if (!a) return next(new ErrorResponse("File not found", 404, ["file"], "FILE_NOT_FOUND"));
    res.download(path.resolve("public/uploads/fdm_attachment_file",
                              path.basename(a.file_name)));
  },
]);
```
`path.basename` menahan beban di sini — tanpanya, `:id` menjadi path traversal.

### 1.3 Guard fail-closed

```ts
// jwt_middleware.ts — pola yang sama untuk adminOnly dan adminOrViewer
static async adminOnly(req: Request, res: Response, next: NextFunction) {
  try {
    const { user_id } = res.locals.user as UserToken;
    const user = await prisma.user.findFirst({
      where: { user_id, deleted_at: null, is_active: true },
      select: { role: { select: { name: true } } },
    });
    if (!user || user.role.name !== "Admin") {
      throw new ErrorResponse("Only be accessed by Admin.", 403, ["ADMIN_ONLY"], "ADMIN_ONLY");
    }
    next();
  } catch (error) { next(error); }
}
```
Perhatikan `deleted_at: null, is_active: true` — ini juga yang membuat `is_active` akhirnya benar-benar berfungsi. Tambahkan keduanya ke `where` di login juga.

### 1.4 Cek kepemilikan di `GET /fdm/response/:user_id/:id`

Detail lengkap di [SECURITY_AUDIT.md § C-1](SECURITY_AUDIT.md). Kalau frontend sebenarnya hanya pernah mengambil record milik sendiri, opsi termurah adalah **menghapus `:user_id` dari path** dan membacanya dari `res.locals.user`.

### 1.5 Rate limit di login
```ts
import rateLimit from "express-rate-limit";
authRoute.post("/login",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  AuthController.login);
```
Satu dependency, dua baris. Terapkan hanya di login — jangan seluruh aplikasi.

### 1.6 Salt bcrypt per-password
```ts
// src/utils/hash.ts
- const genSalt = bcrypt.genSaltSync(10);
- export const hashPassword = (p: string) => bcrypt.hashSync(p, genSalt);
+ export const hashPassword = (p: string) => bcrypt.hash(p, 10);
```
Ini juga membuatnya async dan berhenti memblokir event loop. Pemanggil sudah `await`, jadi tidak ada perubahan lain.

### 1.7 `npm audit fix` dan set `NODE_ENV`
```bash
npm audit fix        # menyelesaikan sebagian besar dari 24 kerentanan tanpa breaking change
```
Lalu di compose: `environment: [NODE_ENV=production, TZ=Asia/Makassar]`. Tanpa `NODE_ENV`, stack trace bocor di semua environment.

---

## Fase 2 — Perbaiki jalur deploy (± 4 jam)

Jalur deploy yang terdokumentasi rusak di empat titik independen. Sekarang tidak ada yang bisa menjalankan project ini dari nol tanpa membaca kodenya.

### 2.1 Makefile
[Makefile](Makefile) memakai **spasi**, bukan tab, plus line ending CRLF. `make up` menjawab `*** missing separator. Stop.` Konversi indentasi ke tab dan line ending ke LF.

### 2.2 Dockerfile
```dockerfile
- WORKDIR /
+ WORKDIR /app

- RUN npm install
+ RUN npm ci

- RUN npx prisma db push --force-reset      # HAPUS — ini men-drop database
- RUN npm run seed                          # HAPUS — bukan langkah build
+ RUN npx prisma generate

+ USER node                                 # jangan jalan sebagai root
```
Migrasi dan seed adalah langkah **deploy**, bukan langkah **build**.

### 2.3 docker-compose
```yaml
services:
  fdm-backend-service:
    command: node build/index.js        # bukan one-liner shell
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - TZ=Asia/Makassar
    volumes:
      - ./storage:/app/storage          # upload persisten
      - ./.wwebjs_auth:/app/.wwebjs_auth  # session WhatsApp persisten
```
Rantai `[ ! -f lock ] && ... || node build/index.js` yang lama tidak pernah menjalankan API pada boot pertama, dan lock-nya berada di luar volume sehingga seed jalan tiap start — menghapus seluruh tabel user setiap restart.

Jalankan migrasi sekali per rilis: `docker compose run --rm app npx prisma migrate deploy`.

### 2.4 Hapus stage `production` yang tidak ada
`docker-compose.prod.yml` menargetkan `target: production`; Dockerfile hanya mendefinisikan `base`. Entah tulis stage-nya, atau hapus `target`-nya.

### 2.5 Perbaiki `npm start`
```json
- "start": "node dist/index.js"
+ "start": "node build/index.js"
```
`tsconfig` meng-emit ke `build/`. Script ini tidak pernah bekerja.

---

## Fase 3 — Korektness (± 1 hari)

### 3.1 Timezone, sekali dan selesai

Tiga belas commit sudah dihabiskan untuk gejala masalah ini. Akarnya: `setHours()` beroperasi di timezone lokal proses, `TZ` tidak pernah di-set (jadi container jalan di UTC), sementara site-nya WITA (UTC+8).

1. Set `TZ=Asia/Makassar` di compose (sudah masuk di 2.3).
2. Hapus offset hardcode `+ 8` di [documentService.ts:486](src/features/documentTransfer/documentService.ts#L486).
3. Pusatkan **semua** perhitungan batas hari di [src/utils/date.ts](src/utils/date.ts). Pola `setHours(0,0,0,0)` sekarang di-copy inline ke [questionService.ts:82-86](src/features/fitDailyMonitoring/question/questionService.ts#L82-L86), [responseUserService.ts:120-121](src/features/fitDailyMonitoring/responseUser/responseUserService.ts#L120-L121), dan dua controller — memperbaiki `date.ts` saja tidak cukup.
4. Tulis test untuk itu (lihat 4.1).

Gejala yang hilang: karyawan shift malam yang mengisi jam 01:00 WITA berhenti tercatat sebagai hari sebelumnya.

### 3.2 Constraint database yang hilang

```prisma
model User {
  phone_number String  @unique @db.VarChar(15)
  email        String? @unique
  // ...
  @@index([deleted_at])
  @@index([company_id])
  @@index([department_id])
}

model AttendanceHealthResult {
  @@index([user_id])
  @@index([created_at])
}

model ResponseUser {
  @@index([attendance_health_result_id])
  @@index([user_id])
}
```
Schema saat ini punya **nol** `@@index` dan **nol** `@unique` di 161 baris. Bersihkan duplikat yang sudah ada sebelum menerapkan unique constraint.

Tambahkan juga **satu submission FDM per user per hari** — sekarang tidak ada yang mencegah pengisian berkali-kali. Cara termurah tanpa mengubah schema: cek di dalam transaction sebelum create. Cara yang benar: kolom `submission_date` (date) dengan `@@unique([user_id, submission_date])`, supaya database yang menegakkan, bukan aplikasi.

### 3.3 Perbaiki empat bug diam

| Bug | Fix |
|---|---|
| Export FDM menampilkan jawaban terakhir user di **setiap** baris | Baca dari relasi `attendance_health_result`, bukan `user.ResponseUser` — [documentService.ts:467](src/features/documentTransfer/documentService.ts#L467) |
| `updateUser` menonaktifkan user diam-diam saat `is_active` tidak dikirim | Teruskan `undefined` sebagai `undefined`, jangan `=== "true" ? true : false` — [userController.ts:138](src/features/user-management/userController.ts#L138) |
| Filter `ahrid` tidak pernah bekerja (Zod membuangnya) | Tambahkan `attendance_health_result_id` ke schema `GET_FDM` — [fdmValidation.ts:5](src/features/fitDailyMonitoring/fdmValidation.ts#L5) |
| Alert UNFIT ke Occupational Health tidak pernah terkirim | Seed membuat `"HSEC - Occupational Health"`, kode mencari `"Occupational Health"`. Samakan, atau lebih baik: tandai dengan flag boolean di tabel department, jangan cocokkan string — [responseUserService.ts:146](src/features/fitDailyMonitoring/responseUser/responseUserService.ts#L146) |

Plus: tanggal di pesan WhatsApp dibekukan saat startup — pindahkan `const today = ...` ke dalam fungsi ([whatsapp-message.ts:20](src/utils/whatsapp-message.ts#L20)).

### 3.4 Batasi pagination
```ts
const pageSize = Math.min(Number(data.limit) || 100, 500);
const page = Math.max(Number(data.page) || 1, 1);
```
Sekarang, request tanpa `?page=` mengembalikan **seluruh tabel**, dan `?page=-5` menghasilkan 500.

### 3.5 Rapikan transaction
- Import Excel: **satu** transaction untuk seluruh file, bukan satu per baris ([documentService.ts:188](src/features/documentTransfer/documentService.ts#L188)). Pindahkan `rmSync` ke luar loop — sekarang ia menghapus seluruh direktori upload bersama sekali per baris.
- `updateQuestion`: bungkus keempat fase tulis dalam satu `$transaction` ([questionService.ts:135](src/features/fitDailyMonitoring/question/questionService.ts#L135)).
- Pengiriman WhatsApp: **keluarkan** dari transaction, dan `await` hasilnya ([responseUserService.ts:170](src/features/fitDailyMonitoring/responseUser/responseUserService.ts#L170)).

### 3.6 Hapus state global mutable
```ts
// fdmService.ts:31 — HAPUS
- let adminDefault: { user_id: string } | null;
```
Jadikan lokal di tiap method, atau satu helper `getAdminDefaultId()`. Sekarang dua endpoint membacanya sebelum ada yang meng-assign, jadi filter penyembunyian admin gagal tergantung urutan request.

---

## Fase 4 — Yang seharusnya ada sejak awal (± 1 hari)

### 4.1 Test — mulai dari lima, bukan dari coverage

Toolchain-nya belum lengkap. Pasang dulu:
```bash
npm i -D ts-jest @types/jest
npx ts-jest config:init
```
Tanpa itu, `npm test` tidak bisa menjalankan test TypeScript sama sekali — meskipun testnya ditulis.

Lalu tulis **lima** test ini, bukan lebih. Ini yang memberi keamanan terbanyak per baris:

```ts
// src/utils/date.test.ts — menutup 13 commit "fix utc"
import { startOfToday, endOfToday } from "./date";
test("startOfToday is midnight WITA", () => {
  process.env.TZ = "Asia/Makassar";
  expect(startOfToday().getHours()).toBe(0);
  expect(endOfToday().getHours()).toBe(23);
});
```

```ts
// src/features/auth/auth.test.ts
import request from "supertest";
import app from "../../app";
test("login rejects wrong password", async () => {
  const r = await request(app).post("/auth/login")
    .send({ email_or_phone_number: "00000", password: "salahsemua" });
  expect(r.status).toBe(401);
});
test("protected route rejects missing token", async () => {
  expect((await request(app).get("/auth/me")).status).toBe(401);
});
```

Tiga sisanya: **skoring FDM** (nilai 3 → UNFIT, nilai 2 → FIT_FOLLOW_UP, sisanya FIT), **guard `adminOnly` menolak role User**, dan **pagination menolak page negatif**.

Catatan: mengimpor `app` sekarang men-spawn Chromium ([app.ts:18](src/app.ts#L18)). Test butuh 4.3 dulu, atau mock `./utils` sementara.

### 4.2 README

Belum ada satu pun file Markdown di 113 file. Minimal yang harus ada:
- key `.env` apa saja yang dibutuhkan dan formatnya
- cara menjalankan lokal (dan bahwa `make up` rusak sampai Fase 2 selesai)
- di mana QR WhatsApp muncul saat pertama jalan (di log container)
- daftar endpoint — atau collection Postman yang di-commit

### 4.3 Pisahkan worker WhatsApp dari API

`clientWhatsapp.initialize()` di module scope [app.ts:18](src/app.ts#L18) berarti **meng-import app = men-spawn Chromium**. Konsekuensinya: test tidak bisa jalan, tiap instance API jadi browser host, deploy multi-instance akan bentrok memperebutkan satu session WhatsApp, dan promise yang tidak di-catch bisa membawa turun API.

Pisahkan ke proses sendiri yang mendengarkan queue atau endpoint internal. API tidak boleh punya dependency runtime ke browser.

### 4.4 Tooling minimum
```bash
npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier
```
Satu `.eslintrc` dengan `no-unused-vars` dan `no-console` sudah akan menangkap 7 `console.log` yang tertinggal, dua variabel tak terpakai di `fdmController`, dan naming file yang tidak konsisten. Tambahkan satu GitHub Action yang menjalankan `tsc --noEmit && npm test`. **Lewati husky** — CI sudah cukup.

### 4.5 Housekeeping
- `git rm prisma/seed/*.js` (8 file), tambahkan ke `.gitignore`
- Hapus import `node-cron` yang mati di [app.ts:5](src/app.ts#L5) — atau daftarkan job yang sebenarnya dimaksudkan, karena `sendMessageFdmTodayReport` sudah ditulis dan tidak pernah dipanggil
- Hapus 7 branch remote yang sudah ter-merge
- Gabungkan `getUsers`/`getTotalUsers` — ~200 baris copy-paste yang bedanya cuma `findMany` vs `count`. Bangun `where`-nya sekali, pakai dua kali. Menghapus ~180 baris tanpa menambah abstraksi.

---

## Yang **tidak** perlu dikerjakan

Sama pentingnya. Beberapa hal yang terlihat seperti masalah, tapi bukan:

| Terlihat salah | Kenapa dibiarkan saja |
|---|---|
| 4 feature master-data hampir identik (~660 baris) | Generic CRUD factory untuk 4 entitas biasanya lebih menyakitkan daripada duplikasinya. Biarkan. Yang layak digabung cuma `getUsers`/`getTotalUsers` karena keduanya di **satu file** dan membangun `where` yang sama. |
| `cors()` terbuka | Auth-nya bearer token di header, bukan cookie. Situs pihak ketiga tidak bisa membaca token korban. Batasi ke origin frontend saat sempat, tapi ini bukan lubang. |
| `jwt.verify` tanpa `algorithms` | jsonwebtoken 9.x sudah menolak `alg:none` secara default. Defense-in-depth, bukan bypass aktif. |
| Nama file `auth-service.ts` vs `userService.ts` | Kosmetik. Biarkan sampai ESLint yang menandainya. |
| Mengganti `uuid` dengan `crypto.randomUUID()` | Benar secara prinsip, nol dampak. Lakukan kalau kebetulan sedang menyentuh file itu. |
| Menambah Swagger/OpenAPI | Collection Postman yang di-commit memberi 90% manfaatnya dengan 5% usaha. |
| Refactor arsitektur | Layering-nya sudah benar dan konsisten di 10 feature. Jangan sentuh. |

---

## Ringkasan usaha

| Fase | Isi | Waktu | Hasil |
|---|---|---|---|
| **0** | Rotasi secret, `user_id` dari token, password admin, `.dockerignore`, hapus `--force-reset` | **~2 jam** | 4 dari 6 critical tertutup |
| **1** | Stream export, lampiran ber-auth, guard fail-closed, cek kepemilikan, rate limit, salt, `audit fix` | **~1 hari** | Semua critical + 8 high tertutup |
| **2** | Makefile, Dockerfile, compose, `npm start` | **~4 jam** | Project bisa dijalankan orang lain |
| **3** | Timezone, index & constraint, 4 bug diam, pagination, transaction | **~1 hari** | Data jadi benar |
| **4** | 5 test, README, pisah worker WhatsApp, ESLint + CI | **~1 hari** | Bisa dirawat |

**Total ~4 hari kerja** dari kondisi sekarang ke sesuatu yang layak jalan di produksi.

Sebagai perbandingan: menulis ulang project ini dari nol akan makan berminggu-minggu, dan arsitekturnya kemungkinan besar berakhir sama seperti yang sudah ada. Yang bermasalah bukan strukturnya. Yang bermasalah adalah lima batas yang tidak dijaga dan satu file `.env` yang berisi tiga huruf.
