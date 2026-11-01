# Manual Test Checklist: Optimasi Latency Backend FDM

## Prasyarat
1. Backend jalan: `cd backend_app && npm run dev` (port dari .env, default 3030). PostgreSQL native di localhost:5432, db `imm`.
2. Login Admin + Viewer + user biasa (credentials di `prisma/seed/`).
3. Tool: browser FE atau curl/Postman dengan header `Authorization: Bearer <token>`.

## A. Index database (schema.prisma)
### A1. Index ter-create
- **Alur**: jalankan `npx prisma db push`, lalu cek via Prisma: `node -e` dengan `$queryRawUnsafe("select indexname from pg_indexes where tablename='attendance_health_results'")`.
- **Harapan**: minimal ada `attendance_health_results_created_at_idx` dan `attendance_health_results_user_id_idx`, plus index `response_user` (created_at, user_id, question_id, question_answer_id, attendance_health_result_id) dan `users` (company/department/job_position/employment_status/deleted_at).
- **Gagal kalau**: daftar index hanya pkey.

### A2. Query tetap benar setelah index
- **Alur**: buka FE halaman Data Monitoring dengan filter tanggal + department.
- **Harapan**: tabel terisi data sama seperti sebelum ada index.
- **Gagal kalau**: data hilang / error 500.

## B. Role cache middleware (jwt_middleware.ts)
### B1. Admin tetap bisa akses endpoint admin
- **Alur**: login Admin, panggil `PUT /fdm/:id/addNote` dengan note "tes".
- **Harapan**: 200, message "Note added successfully".
- **Gagal kalau**: 403 ADMIN_ONLY.

### B2. Non-admin ditolak
- **Alur**: login user biasa (bukan Admin/Viewer), akses `GET /fdm`.
- **Harapan**: 403 "Only be accessed by Admin or Viewer."
- **Gagal kalau**: 200 / data tampil.

### B3. Perubahan role tertangkap maksimal 60 detik
- **Alur**: panggil `GET /fdm` sebagai Viewer (cache terisi). Di DB ubah role user jadi user biasa. Tunggu 60 detik, panggil lagi.
- **Harapan**: panggilan kedua 403.
- **Gagal kalau**: masih 200 setelah >60 detik.

## C. getFDM refactor (fdmService.ts)
### C1. Paginated
- **Alur**: `GET /fdm?page=1` dengan data > 100 row.
- **Harapan**: maksimal 100 row, urut `created_at` desc.
- **Gagal kalau**: jumlah row > 100.

### C2. Tanpa page (mode search FE)
- **Alur**: `GET /fdm?name=<sebagian nama>` tanpa param page.
- **Harapan**: semua row yang match nama dikembalikan (mode lama, dipakai search box FE).
- **Gagal kalau**: hasil terpotong.

### C3. Akun sistem (phone 00000) tidak muncul
- **Alur**: `GET /fdm` tanpa filter.
- **Harapan**: tidak ada row milik user phone_number 00000.
- **Gagal kalau**: akun sistem ikut tampil.

## D. usersNotFilledToday anti-join
### D1. Daftar belum isi hari ini benar
- **Alur**: pastikan 1 user sudah submit FDM hari ini, 1 user belum. `GET /fdm/usersNotFilledToday`.
- **Harapan**: user yang belum isi muncul, yang sudah isi tidak.
- **Gagal kalau**: user yang sudah isi ikut muncul.

## E. Submit FDM (responseUserService.ts)
### E1. Submit FIT normal
- **Alur**: user belum isi hari ini, submit `POST /fdm/response/create` dengan semua jawaban value bukan 2/3.
- **Harapan**: 200, `data.result = "FIT"`, muncul di `GET /fdm/me`.
- **Gagal kalau**: error 500 / result salah.

### E2. Submit UNFIT: WA tetap terkirim
- **Alur**: submit dengan jawaban value 3 (jawaban UNFIT), pakai nomor WA `get_notification` milik sendiri (user Occupational Health) biar bisa diverifikasi.
- **Harapan**: response 200 langsung (`result: "UNFIT"`), WA masuk beberapa detik kemudian.
- **Gagal kalau**: response lambat menunggu WA, atau WA tidak terkirim.

### E3. Submit ganda hari ini tetap ditolak di level FE flow
- **Alur**: `GET /fdm/question/form` (endpoint form dengan middleware isFilled) setelah submit E1.
- **Harapan**: middleware `isFilled` mendeteksi sudah isi (respons sesuai perilaku lama).
- **Gagal kalau**: form dianggap belum isi.

## F. Cache question (questionService.ts)
### F1. getAll tidak query DB tiap kali
- **Alur**: panggil `GET /fdm/question/getAll` 2x berturut-turut.
- **Harapan**: respons identik, yang kedua berasal dari cache (tak terlihat dari luar, cek log query Prisma atau cukup cek data benar).
- **Gagal kalau**: data salah/stale lebih dari 60 detik setelah admin update soal.

### F2. Update soal meng-invalidate cache
- **Alur**: admin update satu pertanyaan via `PUT /fdm/question/update`, lalu `GET /fdm/question/getAll`.
- **Harapan**: pertanyaan baru langsung tampil (cache sudah kosong).
- **Gagal kalau**: pertanyaan lama masih tampil setelah update.

## G. Compression (app.ts)
### G1. Response gzip
- **Alur**: `curl -H "Authorization: Bearer <token>" -H "Accept-Encoding: gzip" -sD - -o /dev/null "<url>/fdm?page=1"`.
- **Harapan**: header `content-encoding: gzip`.
- **Gagal kalau**: tanpa content-encoding.

### H. Build
### H1. TypeScript compile
- **Alur**: `npx tsc --noEmit`.
- **Harapan**: exit 0, tanpa error.
- **Gagal kalau**: ada type error.

## Tidak bisa dites manual (sudah diverifikasi otomatis)
- `npx tsc --noEmit` exit 0 (H1, sudah dijalankan).
- `npx prisma validate` valid dan `prisma db push` sync tanpa error.
- Index ter-create di DB (A1, sudah diverifikasi via `$queryRawUnsafe`).

## Kategori tidak dilakukan (sesuai batasan)
- Endpoint API baru: user memo, frontend tidak boleh berubah, jadi ChartLine.jsx tetap 12 request countResult. Amplitudo optimasi terbesar sengaja dilewat.
- Pagination wajib untuk semua panggilan: tidak dipaksakan karena mode search FE masih relasi pada response tanpa page.
