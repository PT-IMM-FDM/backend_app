# Code Review — FDM Backend (Fit Daily Monitoring)

**Repo:** `PT-IMM-FDM/backend_app` · **Stack:** Express 4 + TypeScript 5 + Prisma 5 + PostgreSQL
**Tanggal review:** 8 Agustus 2026 · **Scope:** 113 file, ~5.400 baris TypeScript, 10 feature module

Metode: 6 auditor paralel membaca seluruh codebase, tiap temuan diverifikasi ulang oleh agent adversarial yang tugasnya *membantah* klaim. 48 temuan lolos verifikasi, 0 dibantah. Satu dimensi (input validation) gagal diselesaikan agent dan diisi dari pembacaan manual — ditandai di bawah.

---

## 1. Rating

Dua angka, karena dua standar berbeda:

| Dinilai sebagai | Skor | Alasan singkat |
|---|---|---|
| **Project magang / belajar** | **6.5 / 10** | Struktur, disiplin layering, dan konsistensi validasi di atas rata-rata anak magang. Fitur jalan, lengkap, dan dipakai orang. |
| **Sistem produksi pemegang data medis karyawan** | **2.5 / 10** | 6 kerentanan critical. Data kesehatan karyawan bisa diunduh tanpa login. Deploy path-nya rusak di 4 titik. |

Angka pertama yang relevan buat menilai kamu. Angka kedua yang relevan buat menilai apakah ini boleh jalan di server perusahaan hari ini. **Belum boleh** — lihat [SECURITY_AUDIT.md](SECURITY_AUDIT.md).

### Skor per dimensi

| Dimensi | Skor | Ringkas |
|---|---|---|
| Arsitektur & kualitas kode | **5 / 10** | Layering konsisten 10/10 feature, tapi duplikasi besar & state global |
| Autentikasi & otorisasi | **3 / 10** | Coverage guard 100%, tapi 2 IDOR + guard fail-open |
| Model data & korektness | **3 / 10** | Nol index, nol unique constraint, timezone salah |
| File upload & storage | **3 / 10** | Export PII ditulis ke direktori yang di-serve publik |
| Testing, dokumentasi, DX | **2 / 10** | 0 test, 0 README, `make up` gagal di baris pertama |
| Operasional & deployment | **2 / 10** | JWT secret 3 huruf, seed hapus semua user tiap restart |
| Input validation & injection | *(tidak dinilai)* | Agent gagal; dari pembacaan manual: **~5/10** |

**Rata-rata terbobot: 3.1 / 10 sebagai software produksi.**

---

## 2. Yang sudah bagus — dan ini bukan basa-basi

Beberapa keputusan di sini lebih baik dari kode yang saya lihat di tim berpengalaman.

### 2.1 Feature-sliced architecture, dijalankan konsisten

Semua 10 feature memakai pola `Route → Controller → Service → Validation → Model`. Yang penting: **nol kebocoran Prisma ke controller**. Tidak ada satu pun `prisma.` di file `*Controller.ts`. Business logic tinggal di service. Ini pola yang biasanya rusak di feature ke-4 — di sini bertahan sampai feature ke-10, termasuk yang nested tiga level (`management-company/management-job-position/`).

### 2.2 Role diambil dari database, bukan dari token

[src/middlewares/jwt_middleware.ts:27-38](src/middlewares/jwt_middleware.ts#L27-L38) query ulang role dari DB tiap request, bukan baca `role_id` dari JWT claim. `role_id` memang di-sign di [auth-service.ts:71](src/features/auth/auth-service.ts#L71) tapi tidak pernah dibaca lagi.

Konsekuensinya: menurunkan role user langsung berlaku di request berikutnya, bukan setelah token 15 menit expired. Ini trade-off yang benar (satu query ekstra ditukar dengan revocation instan), dan kelihatan diambil sadar, bukan kebetulan.

### 2.3 Error handling: coverage 100%

Setiap controller async dibungkus `try/catch → next(error)`. Saya cek semuanya. Tidak ada satu pun unhandled promise rejection yang bisa menggantung request. [error_middleware.ts](src/middlewares/error_middleware.ts) membedakan `JsonWebTokenError` / `ZodError` / `ErrorResponse` / fallback dengan benar.

### 2.4 App dipisah dari listener

[src/app.ts](src/app.ts) `export default app`, [src/index.ts](src/index.ts) yang `listen()`. Ini persis yang dibutuhkan supertest. Kamu sudah menyiapkan project untuk bisa dites — tinggal tidak pernah menulis testnya. (Satu ganjalan: WhatsApp client di-`initialize()` saat import di [app.ts:18](src/app.ts#L18), jadi import app = spawn Chromium. Detail di §3.5.)

### 2.5 TypeScript strict, hampir tanpa escape hatch

`"strict": true` aktif, dan di ~5.400 baris cuma ada **4** kemunculan `any`/`as any`. Tidak ada `@ts-ignore` sama sekali. Banyak project "TypeScript" yang sebenarnya JavaScript dengan ekstensi `.ts` — ini bukan salah satunya.

### 2.6 Validasi Zod diterapkan seragam

Tiap service memanggil `Validation.validate(Schema, data)` sebelum menyentuh DB. Karena `z.object().parse()` membuang key yang tidak dideklarasikan, **tidak ada mass-assignment**: tidak ada satu pun `prisma.create({ data: req.body })` di codebase ini. `role_id` dan `is_active` tidak bisa diselundupkan lewat endpoint self-service — [userController.ts:156-162](src/features/user-management/userController.ts#L156-L162) menyusun objeknya field-by-field.

Juga: **nol raw SQL**. Tidak ada `$queryRaw`, `$executeRawUnsafe`. SQL injection tidak mungkin lewat jalur ini.

### 2.7 Git hygiene sebagian besar sehat

Conventional Commits dipakai konsisten. Mayoritas kerja lewat PR branch. `.gitignore` benar — **`.env` tidak pernah ter-commit**, saya verifikasi ke seluruh history (`git log --all --diff-filter=A`), bukan cuma cek working tree.

---

## 3. Yang bermasalah

Security dibahas terpisah di [SECURITY_AUDIT.md](SECURITY_AUDIT.md). Bagian ini soal kualitas kode dan korektness.

### 3.1 Duplikasi copy-paste ~900 baris

Empat feature master-data (`company`, `department`, `job-position`, `employment-status`) praktis identik byte-per-byte — beda cuma nama entitas dan kedalaman import. Bandingkan [companyService.ts](src/features/management-company/companyService.ts) dengan [departmentService.ts](src/features/management-company/management-department/departmentService.ts): struktur `deleteX` sama persis, termasuk loop `findUnique` lalu `update` di dalam transaction.

Ditambah [userService.ts:212-330](src/features/user-management/userService.ts#L212-L330): `getUsers` dan `getTotalUsers` adalah ~200 baris copy-paste yang bedanya cuma `findMany` vs `count`.

**Ini bukan panggilan untuk bikin abstraksi generic CRUD.** Untuk 4 entitas, generic factory sering lebih menyakitkan daripada duplikasinya. Yang layak: gabungkan `getUsers`/`getTotalUsers` jadi satu fungsi yang membangun `where` sekali, lalu dipakai dua kali. Itu menghapus ~180 baris tanpa menambah abstraksi apa pun.

### 3.2 State global mutable di service

```ts
// src/features/fitDailyMonitoring/fdmService.ts:31
let adminDefault: { user_id: string } | null;
```

Variabel module-level, dibagi ke semua request. Cuma `countResult` yang meng-assign-nya. `countFilledToday` dan `mostQuestionAnswered` **membacanya** — jadi kalau salah satu dipanggil sebelum `countResult` pernah jalan, `adminDefault` masih `undefined` dan filter "sembunyikan admin default" diam-diam tidak jalan. Hasil: data akun admin ikut kehitung, tergantung urutan request. Bug yang muncul dan hilang sendiri.

`getFDM` di baris 35 justru mendeklarasikan `let adminDefault` **lokal** yang menutupi (shadow) yang global — jadi ada dua variabel bernama sama dengan perilaku berbeda di file yang sama.

Fix: hapus yang global, jadikan lokal di tiap method (atau satu helper `getAdminDefaultId()`).

### 3.3 Transaction dipakai di tempat salah

| Lokasi | Masalah |
|---|---|
| [documentService.ts:188](src/features/documentTransfer/documentService.ts#L188) | Import Excel pakai **satu transaction per baris**. Gagal di baris 300 dari 500 → 299 user masuk permanen, sisanya tidak. Tidak ada rollback keseluruhan. |
| [questionService.ts:135](src/features/fitDailyMonitoring/question/questionService.ts#L135) | `updateQuestion` melakukan 4 fase tulis **tanpa transaction sama sekali**, lewat 3 loop N+1 berurutan. Gagal di tengah = pertanyaan ter-update tapi jawabannya tidak. |
| [responseUserService.ts:170](src/features/fitDailyMonitoring/responseUser/responseUserService.ts#L170) | Kebalikannya: panggilan **jaringan WhatsApp dilakukan di dalam** `$transaction`. Transaction menahan koneksi DB selama HTTP call ke WhatsApp. Dan `sendMessageFdmUnfit(...)` dipanggil tanpa `await` — floating promise, error-nya tidak terlihat, dan bisa terkirim untuk submission yang ternyata di-rollback. |

Aturannya sederhana: transaction membungkus **semua** tulisan yang harus atomik, dan **tidak ada I/O eksternal di dalamnya**.

### 3.4 Bug korektness yang diam

**a. Filter `ahrid` tidak pernah bekerja.**
[fdmController.ts:44](src/features/fitDailyMonitoring/fdmController.ts#L44) mengirim `attendance_health_result_id`, tapi schema `GET_FDM` di [fdmValidation.ts:5-16](src/features/fitDailyMonitoring/fdmValidation.ts#L5-L16) tidak mendeklarasikan field itu. Zod membuangnya. Lalu [fdmService.ts:85](src/features/fitDailyMonitoring/fdmService.ts#L85) membaca `validateData.attendance_health_result_id` → selalu `undefined`. Filternya mati sejak lahir.

**b. Export FDM menampilkan jawaban yang salah.**
[documentService.ts:467](src/features/documentTransfer/documentService.ts#L467) membaca jawaban dari relasi `user.ResponseUser` (seumur hidup user), bukan dari `attendance_health_result` baris itu. Kalau seorang karyawan punya 30 record FDM, ke-30 baris Excel-nya menampilkan jawaban yang sama — jawaban terakhir. Laporan historis jadi salah total.

**c. `updateUser` menonaktifkan user secara diam-diam.**
[userController.ts:138](src/features/user-management/userController.ts#L138):
```ts
is_active: is_active === "true" ? true : false,
```
Kalau `is_active` tidak dikirim di body, `undefined === "true"` → `false`. Admin yang cuma mau ganti nomor telepon akan menonaktifkan akun itu. Sama untuk `get_notification`. Seharusnya `undefined` diteruskan sebagai `undefined` supaya Prisma tidak menyentuh kolomnya.

**d. Tanggal di pesan WhatsApp dibekukan saat startup.**
[whatsapp-message.ts:20](src/utils/whatsapp-message.ts#L20) menghitung `today` sekali saat module load. Server yang hidup 3 minggu akan mengirim alert UNFIT bertanggal 3 minggu lalu.

**e. Alert UNFIT ke Occupational Health tidak pernah terkirim.**
[responseUserService.ts:146](src/features/fitDailyMonitoring/responseUser/responseUserService.ts#L146) mencari department bernama persis `"Occupational Health"`. Seed [departmentDefault.ts:33](prisma/seed/departmentDefault.ts#L33) membuatnya sebagai `"HSEC - Occupational Health"`. Tidak match → `phoneNumberOfOH` selalu `[]`. Di database hasil seed sendiri, escalation utama sistem ini mati. (Bisa hidup kalau admin membuat department dengan nama persis itu — tapi itu kebetulan, bukan desain.)

**f. Satu salt bcrypt untuk semua password.**
[src/utils/hash.ts:3](src/utils/hash.ts#L3):
```ts
const genSalt = bcrypt.genSaltSync(10);
```
Dihitung sekali saat module load, dipakai untuk **setiap** password di proses itu. Dua user dengan password sama → hash identik. Salt per-password adalah alasan salt itu ada. Fix satu baris: `bcrypt.hash(password, 10)`.

### 3.5 Timezone: 13 commit, akar masalah masih ada

History-nya bercerita: `fix utc`, `bug: utc time format`, `fix: bug utc`, `return to not -8 hours`, `fix start date and end date for export fdm` (dua kali), sampai branch `bug-utc` khusus.

Akar masalahnya belum diperbaiki. [src/utils/date.ts](src/utils/date.ts) pakai `setHours(0,0,0,0)` — yang beroperasi di **timezone lokal proses**. `TZ` tidak di-set di manapun (Dockerfile, compose, `.env`), jadi container `node:18` jalan di **UTC**. Site-nya WITA (UTC+8) — dibuktikan oleh hardcode `+ 8` di [documentService.ts:486](src/features/documentTransfer/documentService.ts#L486).

Akibat konkret: karyawan shift malam yang mengisi FDM jam 01:00 WITA tercatat sebagai **hari sebelumnya** (17:00 UTC). Dia muncul di daftar "belum mengisi hari ini", dan admin menegurnya padahal sudah mengisi.

Pola `setHours` ini juga di-copy inline ke [questionService.ts:82-86](src/features/fitDailyMonitoring/question/questionService.ts#L82-L86), [responseUserService.ts:120-121](src/features/fitDailyMonitoring/responseUser/responseUserService.ts#L120-L121), dan dua controller — jadi memperbaiki `date.ts` saja tidak cukup.

**Fix: set `TZ=Asia/Makassar` di compose, buang semua `+8`/`-8` hardcode, dan pusatkan semua perhitungan batas hari di `date.ts`.** Satu unit test 6 baris untuk `startOfToday()` akan menghemat 13 commit itu.

### 3.6 Skema database: nol index, nol unique constraint

[prisma/schema.prisma](prisma/schema.prisma) — 161 baris, dan tidak mengandung satu pun `@@index`, `@unique`, atau `@@unique`. Kedua file migrasi juga tidak punya `CREATE INDEX`.

Artinya Postgres cuma punya index primary key. Setiap FK (`attendance_health_results.user_id`, empat FK di `response_user`, lima `users.*_id`), setiap `created_at`, setiap `deleted_at` → **sequential scan**. Query dashboard FDM yang memfilter rentang tanggal lalu sort akan scan seluruh tabel dan sort di memori. Di 500 karyawan × 250 hari kerja = 125.000 baris, ini mulai terasa; di tahun kedua akan menyakitkan.

Yang tidak adanya `@unique` lebih berbahaya — dibahas sebagai temuan critical di [SECURITY_AUDIT.md](SECURITY_AUDIT.md#c5).

### 3.7 Pagination tidak dibatasi

[fdmService.ts:88-109](src/features/fitDailyMonitoring/fdmService.ts#L88-L109): `pageSize` hardcode 100, tapi kalau query param `page` **tidak dikirim**, cabang `else` mengembalikan **seluruh tabel** tanpa `take`. Satu request tanpa `?page=` menarik semua record kesehatan yang pernah ada. `page` juga tidak divalidasi — `?page=-5` menghasilkan `skip: -600` dan Prisma melempar 500.

### 3.8 Tooling & housekeeping

- **8 file `.js` hasil kompilasi ikut ter-commit** di `prisma/seed/`, berdampingan dengan sumber `.ts`-nya. Yang `.js` di-commit **2 bulan setelah** yang `.ts`, dan isinya sudah menyimpang. Sekarang ada dua tempat menyimpan kredensial admin default, dan tidak jelas mana yang dipakai.
- **`npm start` tidak pernah bekerja.** `package.json` menjalankan `node dist/index.js`; `tsconfig.json` `outDir` ke `./build`.
- **Tidak ada ESLint, Prettier, EditorConfig, pre-commit hook, atau CI.** Konsekuensinya terlihat: 7 `console.log` tertinggal di jalur produksi, naming file tidak konsisten (`auth-service.ts` kebab-case vs `userService.ts` camelCase di 9 feature lain), variabel tak terpakai (`startOfDayUtc`, `endOfDayUtc` dideklarasi dua kali di fdmController dan tidak pernah dipakai).
- **`node-cron` di-import di [app.ts:5](src/app.ts#L5) tapi tidak ada satu pun job yang didaftarkan.** `sendMessageFdmTodayReport` di-export tapi tidak pernah dipanggil dari manapun. Fitur laporan terjadwal setengah jadi.
- **`NODE_ENV` dibaca tapi tidak pernah di-set.** [error_middleware.ts:42,50](src/middlewares/error_middleware.ts#L42) menyembunyikan stack trace hanya jika `NODE_ENV === "production"`. Grep ke seluruh repo: `NODE_ENV` tidak di-set di Dockerfile, compose, `.env`, atau `.env.example`. Jadi **stack trace bocor di semua environment**, termasuk produksi.

---

## 4. Testing & dokumentasi

Ini dimensi terlemah, dan yang paling murah diperbaiki.

- **0 file test.** `jest`, `supertest`, `@types/supertest` terpasang di devDependencies, script `"test": "jest"` ada. Tidak pernah dipakai.
- Dan seandainya kamu menulis test hari ini, **`npm test` tidak bisa menjalankannya**: tidak ada `ts-jest`, tidak ada babel, tidak ada `jest.config.js`, tidak ada `@types/jest`. Toolchain-nya tidak lengkap.
- **Tidak ada README.** Nol file Markdown di 113 file. Developer berikutnya harus menebak: key `.env` apa saja, kenapa `make up` gagal, kenapa compose minta `.env.dev` yang tidak ada, di mana QR WhatsApp muncul saat pertama jalan.
- **`make up` gagal di baris pertama.** Recipe di [Makefile](Makefile) di-indent dengan **spasi**, bukan tab, plus line ending CRLF. `make` menjawab `*** missing separator. Stop.` Satu-satunya cara menjalankan project yang terdokumentasi, tidak jalan.

---

## 5. Penilaian akhir

Yang saya lihat: **engineer yang paham struktur, tapi belum pernah diminta memikirkan penyerang atau hari deploy.**

Bukti sisi baiknya nyata dan konsisten — layering yang bertahan 10 feature, role yang sengaja diambil dari DB bukan dari token, `strict` TypeScript dengan 4 `any`, validasi Zod seragam, error handling 100%, app yang sengaja dipisah dari listener. Itu bukan kebetulan; itu keputusan.

Yang runtuh selalu di batas sistem: apa yang terjadi kalau `user_id` datang dari body dan bukan dari token; apa yang terjadi kalau file ditulis ke direktori yang di-serve `express.static`; apa yang terjadi kalau `seed` yang berisi `deleteMany()` jalan di setiap container start. Semua itu satu baris jauhnya dari benar, dan semuanya luput karena tidak ada test, tidak ada CI, dan tidak ada yang pernah mencoba menyerangnya.

Sebagai kerja magang: **kuat, di atas rata-rata.** Sebagai sistem yang memegang data kesehatan karyawan di server perusahaan: **jangan dijalankan sebelum 6 item critical di [SECURITY_AUDIT.md](SECURITY_AUDIT.md) ditutup.** Lima dari enam adalah perbaikan trivial atau kecil — total di bawah sehari kerja.

Rencana perbaikan berurutan ada di [IMPROVEMENTS.md](IMPROVEMENTS.md).
