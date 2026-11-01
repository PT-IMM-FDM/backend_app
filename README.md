# FDM Backend API

Backend Fit Daily Monitoring (FDM): monitoring kesehatan harian karyawan. Karyawan isi form kesehatan, sistem hitung status FIT / FIT_FOLLOW_UP / UNFIT, dan kirim notifikasi WhatsApp ke Occupational Health bila ada karyawan UNFIT.

## Tech Stack

- Node.js + TypeScript + Express
- Prisma ORM + PostgreSQL
- JWT auth
- Zod validation
- WhatsApp notification: whatsapp-web.js (puppeteer)
- Log: winston + morgan custom

## Struktur

```
src/
  app.ts                     Express app, register route + middleware
  index.ts                   Entry point (listen)
  applications/              Prisma client + logger (singleton)
  middlewares/
    jwt_middleware.ts        verifyToken, adminOnly, adminOrViewer
    error_middleware.ts      404 + error handler terpusat
    multer.ts                disk upload (public/uploads/...)
  features/
    auth/                    login, JWT 15 menit
    user-management/         CRUD user
    management-company/      company, department, job position, employment status
    documentTransfer/        upload dokumen
    fitDailyMonitoring/
      fdm*                   list, count, note, attachment FDM (admin/viewer)
      question/              CRUD pertanyaan + jawaban form
      responseUser/          submit jawaban + hitung result
public/uploads/              file attachment (diserve statis via /public)
prisma/
  schema.prisma              model + index
  seed/                      seed data awal
```

Pola tiap feature: `*Route` (endpoint + middleware) -> `*Controller` (parse request) -> `*Service` (validasi Zod + business logic + Prisma) -> `*Model` (tipe request/response) + `*Validation` (skema Zod).

## Setup

```bash
npm install
cp .env.example .env          # isi DATABASE_URL, JWT_SECRET, PORT, API_URL
npx prisma db push            # sinkron schema ke DB
npm run seed                  # data awal
npm run dev                   # ts-node-dev, default port dari .env
```

Scan QR WhatsApp di terminal saat pertama jalan (clientWhatsapp diinisialisasi di `src/app.ts`).

Build produksi:

```bash
npm run build     # tsc -> build/
npm start         # node build/index.js
```

Docker: `docker-compose.yml` (dev), `docker-compose.prod.yml` (prod, `prisma db push` + seed sekali via `init.lock`).

## Environment

| Variabel | Keterangan |
| --- | --- |
| DATABASE_URL | koneksi PostgreSQL, tambah `?connection_limit=10&pool_timeout=10` untuk kontrol pool |
| JWT_SECRET | secret sign token, token expired 15 menit |
| PORT | port server (default 3030) |
| API_URL | base URL untuk generate `file_url` attachment |

## Endpoint Utama

Semua endpoint kecuali `/auth` wajib header `Authorization: Bearer <token>`. Prefix `/fdm` butuh role Admin atau Viewer (kecuali `/fdm/me`), endpoint write FDM butuh Admin.

### FDM (admin/viewer)

- `GET /fdm` : daftar hasil FDM. Query: `startDate`, `endDate`, `uid`, `jpid` (job position, CSV), `esid` (employment status, CSV), `cid` (company, CSV), `did` (department, CSV), `result` (FIT/FIT_FOLLOW_UP/UNFIT), `ahrid`, `page` (pageSize 100), `name`. Tanpa `page` return semua data.
- `GET /fdm/me` : 7 FDM terakhir user login.
- `GET /fdm/countResult` : jumlah FIT / FIT_FOLLOW_UP / UNFIT + totalRespondent per range tanggal dan filter.
- `GET /fdm/countFilledToday` : jumlah yang sudah isi hari ini, filter jpid/esid/did/cid.
- `GET /fdm/usersNotFilledToday` : user yang belum isi hari ini beserta dept/company-nya.
- `GET /fdm/mostQuestionAnswered` : agregasi jawaban per pertanyaan hari ini (dipecah per department).
- `POST /fdm/addAttachment/:attendance_health_result_id` (Admin) : multipart field `fdm_attachment_file`, maks 5MB, maks 3 file per result.
- `DELETE /fdm/:attendance_health_result_id/deleteAttachment/:attendance_health_file_attachment_id` (Admin)
- `PUT /fdm/:attendance_health_result_id/addNote` (Admin)

### Question & Response

- `GET /fdm/question/getAll`, `GET /fdm/question/form` (middleware `isFilled` cek apakah user sudah isi hari ini)
- `POST /fdm/question/create`, `PUT /fdm/question/update`, `DELETE /fdm/question/delete` (soft delete, Admin)
- `GET /fdm/response/:user_id/:attandance_health_result_id` : detail jawaban user per hasil FDM.

### Response User (submit FDM)

`POST /fdm/response/create` body:

```json
{
  "user_id": "uuid",
  "question_id": [1, 2, 3],
  "question_answer_id": [1, 2, 3],
  "attendance_status": "...",
  "work_duration_plan": "...",
  "shift": "true",
  "is_driver": "false",
  "vehicle_hull_number": "B-1234"
}
```

Result dihitung dari nilai jawaban (value 3 = UNFIT, 2 = FIT_FOLLOW_UP, selain itu FIT). Selesai transaction, kirim WA ke user `get_notification` di department Occupational Health + department user bila UNFIT.

### Auth & User

- `POST /auth/login` : return JWT (expired 15 menit), `POST /auth/logout`
- CRUD + update password user: lihat `src/features/user-management/userRoute.ts` dan `src/features/auth/auth-route.ts`

## Performa

- Index DB untuk tabel panas (`users`, `response_user`, `attendance_health_results`): filter `created_at`, `user_id`, FK, dan `deleted_at` ter-index.
- Role check middleware pakai cache in-memory TTL 60 detik (tidak query DB tiap request).
- Response JSON di-gzip via `compression`.
- Cache limit:
  - role: 60 detik. Perubahan role user tertangkap maksimal 60 detik kemudian.
  - `adminDefault` (akun sistem phone 00000): 5 menit.
  - question form: 60 detik, invalidate saat create/update/delete question.
- Notifikasi WhatsApp dikirim setelah transaction commit (fire-and-forget), tidak menahan response submit.
- Checklist pengujian manual: `docs/manual-test-latency.md`.

## Migrasi ke Prisma Migrate (rencana deploy)

Repo belum pakai migrate (masih `prisma db push`). Rencana migrasi tanpa kehilangan data:

```bash
# 1. pastikan schema sudah sinkron dengan DB produksi
npx prisma db pull   # verifikasi, lalu bandingkan dengan schema.prisma

# 2. baseline: tandai schema saat ini sebagai migrasi awal
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
npx prisma migrate resolve --applied 0_init

# 3. deploy berikutnya
npx prisma migrate deploy
```

Index tambahan (`@@index`) masuk di migrasi setelah baseline.
