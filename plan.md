# plan.md — SIPRO — Lanjut Development (Slice A + Slice B + Slice Finance) — Fokus: MVP end-to-end

## ✅ STATUS (update terakhir — **pemulihan repo ke-7** + **FASE 39b: 21 GATE HIJAU**)
- **Pemulihan repo (sesi ini, ke-7)**: `/app` kembali kosong/template → repo GitHub
  `lolkajahasa/sipro` dipulihkan (1.116 berkas). Langkah pasca-restore §3b dijalankan:
  `backend/.env` dibuat ulang (JWT_SECRET acak baru, EMERGENT_LLM_KEY, PORTAL_MASTER_OTP,
  DEFAULT_ORG_*, COOKIE_SECURE, BOOKING_HOLD_DAYS, STORAGE_PROVIDER, PHOTO_*),
  `pip install APScheduler reportlab`, `yarn install`, `seed_reset.sh`.
  Catatan: `memory/test_credentials.md` kali ini IKUT di repo (tidak perlu ditulis ulang).
- **Kondisi saat ditemukan**: `run_all_gates.sh` → **17/21 PASS, 4 MERAH** — semuanya sisa
  wiring Fase 39, tepat di titik berhenti sesi sebelumnya (`forensic_audit` + `reference_router`).
- **FASE 39b DITUTUP** (menutup 4 gate merah + membuat master dokumen Fase 39 benar-benar
  terpakai): `run_all_gates.sh` → **OVERALL PASS (22 gates, termasuk gate baru
  `verify_39b.py`)**, uji-mutasi `scripts/mutasi_39b.py` → **20 pemeriksaan LULUS**
  (10 mutasi tertangkap + 10 pulih), `poc_31..poc_37` semua 0 FAIL, testing agent
  iterasi 58/59/60. Dua bug NYATA ditemukan saat pengujian & diperbaiki (unggah gagal-senyap
  dan 500 pada bukti kembar). Rincian & bukti: lihat **§FASE 39b** di bawah.
- **Berikutnya (disepakati owner)**: **Fase 40 — IA & Design System V2** (DataTable untuk
  semua daftar, halaman kanonik `/leads/:id` `/customers/:id` `/units/:id` `/projects/:id`,
  navigasi 33 → 26 item) sesuai `docs/v2/34_ROADMAP_EKSEKUSI.md`.
  Keputusan owner sesi ini: checklist dokumen **tetap di drawer lead** sampai Fase 40
  memindahkannya ke halaman kanonik; gerbang bukti **INV-07 ditegakkan di Fase 41/42**
  (bukan sekarang); checklist cukup di **Lead + Pelanggan** dulu (mitra & unit menyusul).
- Integrasi luar (WhatsApp Cloud API/e-Sign/e-Faktur/BI-SLIK) **tetap mode simulasi**
  (dikonfirmasi owner sesi ini — belum ada kredensial resmi).

## Riwayat STATUS sebelumnya (pemulihan ke-6 + FASE 37 & 38 DITUTUP)
- **Pemulihan repo (sesi ini, ke-6)**: `/app` kembali kosong/template → repo GitHub `sipro` dipulihkan.
  Langkah pasca-restore §3b dijalankan: `backend/.env` dibuat ulang, `pip install APScheduler reportlab`,
  `yarn install`, `memory/test_credentials.md` ditulis ulang (hilang karena di-gitignore), `seed_reset.sh`.
  **Bukti sehat**: `bash scripts/run_all_gates.sh` → **OVERALL PASS (18 gates)** pada DB bersih.
- **FASE 37 DITUTUP** (Kalibrasi Sekali Klik): `poc_37` **85/85**, `verify_37` **91/91**,
  `run_all_gates` **18 gates PASS**, 12 user story dibuktikan di browser oleh main agent
  **dan** dikonfirmasi ulang testing agent (iterasi 55: 0 bug). Satu cacat kejujuran angka
  ditemukan main agent sendiri saat menonton layar (badge "0 hari") → diperbaiki, lihat §FASE 37.
- **FASE 38 DITUTUP** (Sapuan permukaan tampilan): alat baru `scripts/ui_audit_dialogs.py`
  (audit DI DALAM dialog) menemukan 5 panel tanpa latar, 21 field bisu, 79 label tak tertaut,
  dan legenda grafik berkontras 2.1:1 → semuanya diperbaiki. Gate baru
  `scripts/verify_ui_surfaces.py` (20 pemeriksaan, diuji-mutasi) menjaga agar tidak kembali →
  `run_all_gates.sh` kini **19 gates PASS**. Bukti sebelum→sesudah ada di §FASE 38.

## Riwayat STATUS sebelumnya (pemulihan ke-5 + FASE 36 DITUTUP)
- **Pemulihan repo (ke-5)**: `/app` kembali ditemukan kosong/template → repo GitHub `sipro` dipulihkan lagi.
  Langkah pasca-restore §3b dijalankan ulang: buat ulang `backend/.env` (JWT_SECRET, EMERGENT_LLM_KEY,
  PORTAL_MASTER_OTP=000000, DEFAULT_ORG_ID=org-sipro, DEFAULT_ORG_NAME, COOKIE_SECURE, BOOKING_HOLD_DAYS,
  STORAGE_PROVIDER, PHOTO_*), **`pip install APScheduler reportlab`**, `yarn install`, lalu `bash scripts/seed_reset.sh`.
  **Bukti sehat**: `bash scripts/run_all_gates.sh` → **OVERALL PASS (17 gates)** pada DB bersih.
- **FASE 36 DITUTUP** (Kalender Jadwal): `poc_36` **132/132**, `verify_36` **135/135**,
  `run_all_gates` **17 gates PASS**, dan seluruh 12 user story **dibuktikan di browser**
  (testing agent iterasi 50 + 51 + 52). Lihat §FASE 36 untuk daftar cacat yang ditemukan & diperbaiki —
  termasuk **satu bug HIGH yang hanya terlihat dari sisa data pengujian**, bukan dari laporan tester.
- **Kredensial uji dipulihkan**: `memory/test_credentials.md` ditulis ulang (sandi `Sipro#2026`, 9 akun demo).
- **FASE 35 DITUTUP** (Papan Mandor tahan sinyal hilang — antrean offline): `poc_35` **43/43**,
  `verify_35` **52/52**, dan **dibuktikan di browser nyata**
  (offline sungguhan lewat Playwright: ajukan → antre → muat ulang saat offline → sinyal kembali → terkirim sendiri,
  tanpa dobel). Lihat §FASE 35 untuk daftar cacat yang ditemukan & diperbaiki.
- **FASE 33 DITUTUP**: testing_agent iterasi 44 + 45 → **0 bug kritis, 0 bug medium, 0 error konsol**.
- **FASE 34 DITUTUP** (jadwal massal per blok/cluster + geser tanggal serentak): `poc_34` 57/57,
  `verify_34` 40/40, testing_agent iterasi 46/47/48 → invarian terpenting (**bukti terikat waktu**) terbukti di layar.
- **Fase berikutnya (dipilih owner & disepakati detailnya)**:
  - **Fase 37 = Kalibrasi Sekali Klik** (ubah durasi/waktu tunggu template langsung dari Analitik Telat) — **BERIKUTNYA**.
- Integrasi eksternal (WhatsApp/e-Sign/e-Faktur/BI-SLIK) **tetap mode simulasi** (belum ada kredensial resmi).
- Tombol **"Masuk cepat"** di halaman login tetap ada untuk pengujian (memanggil login normal; bukan backdoor).


## Riwayat STATUS sebelumnya (pemulihan repo + Fase 33 dimulai)
- **Pemulihan repo (15 Agu 2026)**: repo GitHub dipulihkan lagi ke `/app`. `.env` (di-gitignore) dibuat ulang: `JWT_SECRET`, `EMERGENT_LLM_KEY`, `PORTAL_MASTER_OTP`, `DEFAULT_ORG_ID/NAME`, `COOKIE_SECURE`, `PHOTO_*`. Dependensi backend dipasang ulang (`reportlab`, `APScheduler`, dll; `litellm`+`emergentintegrations` sudah ada di image).
- **Dua gate merah pasca-restore diperbaiki (bukan diakali)**:
  - `build_policies` kini punya **dokumen kebijakan nyata** hasil seed (dulu kosong → audit forensik HIGH & admin tak bisa lihat "sejak kapan/oleh siapa").
  - **Laporan mingguan pekan berjalan** dibangkitkan dari jadwal nyata saat seed (dulu direksi melihat halaman kosong sampai Senin berikutnya).
  - Hasil: `verify_32` **28/28**, `forensic_audit` **PASS**, `bash scripts/run_all_gates.sh` → **OVERALL PASS (13 gates)**.
- **Titik berhenti Fase 32 direproduksi**: Papan Mandor + instruksi kerja + dialog ajukan (kamera + panel syarat) tampil normal, **0 error console**.
- **Fase 33 (RAB/BoQ ↔ jadwal → opname & termin subkon)**: **SELESAI & TERVERIFIKASI** — lihat §FASE 33.
- **Repo & environment**: repo GitHub dipulihkan ke `/app` (workspace persisten). Backend + frontend jalan via supervisor.
  - Env yang hilang saat pemulihan sudah dibuat ulang: `JWT_SECRET`, `EMERGENT_LLM_KEY`, `PORTAL_MASTER_OTP`, `DEFAULT_ORG_ID/NAME`, `COOKIE_SECURE`, `PHOTO_WATERMARK` → bug **login 500 (`KeyError: JWT_SECRET`) FIXED**.
- **Integrations (ready, config-driven)**: `EMERGENT_LLM_KEY` tersedia → **Emergent Object Storage** aktif (managed). Mode simulasi masih dipakai untuk WhatsApp Cloud API live (tanpa kredensial Meta), e-sign, BI/SLIK, dan e-Faktur.
- **Guardrails**: `bash scripts/run_all_gates.sh` → **OVERALL PASS (12 gates)**.
- **POC Fase 31**: `python3 scripts/poc_31.py` → **63 PASS / 0 FAIL**. Gate `scripts/verify_31.py` → **30 PASS / 0 FAIL**.
- **Phase 28b/28c (Site Plan + Photo Storage + Bukti Perbaikan Berpasangan)**: **SELESAI & TERVERIFIKASI**.
- **Phase 29 (Work Hub v2 + Lead Lifecycle + UI/UX + Report/Kanban)**: **SELESAI & TERVERIFIKASI**.
- **Phase 30 (Qualification Hub / SLIK prescreen + photo optimize + capture.failed queue)**: **SELESAI & TERVERIFIKASI**.
- **Phase 31 (Construction Progress Engine v2)**: **SELESAI & TERVERIFIKASI**.
- **Phase 32 (Task-based Execution + Papan Mandor + Laporan Mingguan + Analitik Telat)**: **SELESAI & TERVERIFIKASI**.

---

## 1) Objectives

### Objective A — Work Hub Engine “bernilai bisnis” (P0)
Membangun ulang Work Hub agar benar-benar memandu pekerjaan lintas divisi, bukan sekadar menu.
Fokus owner (disepakati):
- **Domain kerja**: 4 divisi — **Sales & Marketing**, **Teknis/Proyek**, **Digital Marketing**, **Finance**.
- Tiap divisi punya **Supervisor + Staff** (field pada user: `division` + `level`).
- RBAC modul tetap seperti sekarang, tetapi **peran baru ditambahkan** untuk mendukung pola supervisor/staff.
- Work Hub harus memetakan **jobdesk** berdasarkan fitur yang sudah ada dan menjadikan action sebagai task.
- Supervisor mengatur konfigurasi: **auto event**, **manual**, **recurring**, SLA, prioritas, aturan assignee.
- Task memiliki alur: **open → in_progress → submitted → verified/rejected → done**.

### Objective B — Lead Lifecycle sebagai “gerbang bukti” + WA terintegrasi (P0)
Menutup gap bisnis proses sales:
- Stage tidak boleh dipilih bebas; harus berdasarkan **aksi + bukti**.
- **Won otomatis** dari event deal legal/akad/BAST (tidak manual).
- WA harus terintegrasi langsung ke record lead dan memicu task/lifecycle.
- Tambahkan penilaian **kualitatif** (disposition/intent) setelah kontak pertama.

### Objective C — UI/UX stability sweep (P0)
Sambil membangun fitur P0, lakukan perbaikan UI/UX yang paling terlihat:
- Konsistensi **Card background** (pakai `bg-card`).
- Tambah **pagination** di daftar utama.
- Tambah **sticky** header/toolbar/footer aksi pada halaman panjang.
- Perbaiki **CTA mati**, dan empty/loading/error state sesuai `design_guidelines.md`.

### ✅ Objective D — Construction Progress Engine v2 (P0) — SELESAI
**FASE 31 (permintaan owner): CONSTRUCTION PROGRESS ENGINE v2 — Jadwal Berbukti, Gerbang Mutu, Reminder & Eskalasi, per TIPE UNIT.**

### ✅ Objective E — Task-based Execution + Papan Mandor + Laporan Mingguan + Analitik Telat (P0) — SELESAI
**FASE 32 BARU (permintaan owner):**
- Papan Mandor (HP) + foto bukti (kamera) + kebijakan GPS on/off admin.
- Laporan mingguan Senin (in-app + PDF) + analitik telat + rekomendasi kalibrasi.

### 🎯 Objective F (BARU) — Kalender Jadwal (P0)
**FASE 36 (permintaan owner): Kalender bulanan seluruh tenggat rumah untuk Manajer Proyek** agar bentrok terlihat **SEBELUM** terjadi.

Pilihan owner (WAJIB dipatuhi):
1. Cakupan: bisa dipilih **SATU PROYEK** atau **SEMUA PROYEK** (portofolio).
2. Isi kalender per tanggal: **(a) build_items + jadwal unit, (b) QC/inspeksi + punch list, (c) tugas Work Hub tim proyek**.
3. Bentrok yang diperingatkan: **beban pelaksana**, **tumpukan pekerjaan KRITIS/hold-point**, dan **tenggat jatuh di hari non-kerja/libur**.
4. Aksi dari kalender: lihat + klik detail + **geser tanggal lewat dialog Fase 34** (bukan drag & drop).
5. Hari kerja/libur: buat **master data hari libur & pola hari kerja** yang dipakai **kalender DAN mesin jadwal**.

---

## 2) Implementation Steps

### Phase 1 — Core POC / Isolation (SELESAI)
- Sudah tervalidasi.

---

### Phase 2 — V1 App Development (Slice A — Sales funnel tipis) (SELESAI)
- Backend + Frontend selesai dan teruji.

---

### Phase 3 — Add More Features (Slice B — Konstruksi tipis) (SELESAI)
- Backend + Frontend selesai dan teruji.

---

### Phase 4 — Stabilization / Guardrails Growth (SELESAI)
- Stabilitas + compliance + gates hijau.

---

### Phase 5 — Slice Finance & Real-Time Notifications (SSE) (SELESAI)
- Foundation finance + SSE + UI finance lulus testing_agent_v3.

---

### Phase 6 — EPIC 3.5 Cashflow/Collections + EPIC M5 Reports/BI (SELESAI)
- Lulus testing_agent_v3 dan gates hijau.

---

### Phase 7 — EPIC 1.5 KPR/Financing + Adoption Completion (SELESAI)
- Customer Portal + object storage + portal security sudah berjalan.

---

### Phase 8 — EPIC M1 Customer Portal (SELESAI)
- Portal OTP (master `000000`), overview/payments/progress/documents + complaints: teruji.

---

## ✅ Phase 29 — Rebuild Work Hub + Lead Lifecycle + UI/UX (P0) (SELESAI & TERVERIFIKASI)
> Ringkasan fase 29 tetap berlaku seperti di dokumen sebelumnya (29a/29b/29c/29d), dengan POC PASS, gates PASS, dan verifikasi manual UI.

---

## ✅ PHASE 31 — SELESAI & TERVERIFIKASI (Construction Progress Engine v2)
> Dipertahankan sebagai arsip bukti (jangan dihapus).

---

## ✅ PHASE 32 — SELESAI & TERVERIFIKASI
> Dipertahankan sebagai arsip bukti (jangan dihapus).

---

## ✅ FASE 33 — SELESAI & TERVERIFIKASI
> Dipertahankan sebagai arsip bukti (jangan dihapus).

---

## ✅ FASE 34 — SELESAI & TERVERIFIKASI
> Dipertahankan sebagai arsip bukti (jangan dihapus).

---

## ✅ FASE 35 — SELESAI & TERVERIFIKASI
> Dipertahankan sebagai arsip bukti (jangan dihapus).

---

## ✅ FASE 37 — KALIBRASI SEKALI KLIK (dari Analitik Telat langsung ke template) — SELESAI & TERVERIFIKASI

### Bukti penutupan (DB tersegar)
- `python3 scripts/poc_37.py` → **85 PASS / 0 FAIL** (INV-37-1..10 lewat API nyata).
- `python3 scripts/verify_37.py` → **91 PASS / 0 FAIL** (termasuk aturan baru soal `changeText`).
- `bash scripts/run_all_gates.sh` → **OVERALL PASS (18 gates)**; `verify_31..36` tidak regresi.
- Browser: 12 user story dibuktikan **main agent** (screenshot + assertion) lalu dikonfirmasi
  **testing agent iterasi 55** (jalur panel Analitik Telat end-to-end, kalibrasi dari baris
  tabel telat, rollback + validasinya, regresi render 5 halaman) → **0 bug, 0 error konsol**.
- **Baseline kembali utuh setelah pengujian** (diperiksa langsung di database, bukan dari layar):
  RUMAH-9W 60 hari kerja / 20 langkah, RUKO-14W 90 / 16, `calibrated_steps=0`, rekomendasi=4,
  4 baris riwayat semuanya sudah dibatalkan/berupa pembatalan (jejak audit tetap ada — memang begitu).

### ⚠️ CACAT yang ditemukan main agent sendiri (bukan dari laporan tester)
**Badge & riwayat berbunyi "sudah diterapkan 0 hari" pada kalibrasi `wait_into_plan`.**
Untuk jenis ini pengguna tidak mengetik jumlah hari — sistem menghitung kekurangan jeda —
sehingga `delta_days` = 0 sementara tanggal rencana benar-benar bergeser `shift_days` hari.
Semua badge yang membaca `delta_days` mentah karena itu menyatakan "0 hari" padahal template
bergeser 3 hari kerja; perencana yang membaca riwayat akan menyimpulkan "tidak ada yang berubah".
Ini persis jenis angka menyesatkan yang Fase 37 dibuat untuk menutup.

**Perbaikan (Fase 37b):**
1. `build_calibration._targets()` ikut mengirim `kind` + `shift_days` pada objek `applied`.
2. Pembantu baru **`changeText(cal)`** di `utils/calibrationUi.js` — satu tafsir angka untuk
   semua panel: pakai `delta_days` bila ada, jatuh ke `shift_days` + keterangan
   **"(geser rencana)"** bila delta 0, dan "tanpa perubahan hari" bila keduanya 0.
   Angka pergeseran **tetap datang dari backend** (frontend tidak menghitung sendiri).
3. Enam tempat pemakaian diganti: kartu usulan, tabel telat, daftar langkah template,
   riwayat, dialog pembatalan, dan baris hasil di dialog.
4. `verify_37` diperketat: yang dilarang bukan lagi *menyebut* `shift_days` di frontend
   (aturan lama justru memaksa angka bohong), melainkan **melakukan aritmatika** atasnya;
   ditambah pemeriksaan bahwa 4 panel badge/riwayat memakai `changeText()`.
   Bukti di layar: `sudah diterapkan +3 hari (geser rencana)`, riwayat
   `Masukkan waktu tunggu ke tanggal rencana +3 hari (geser rencana)`, pembatalan
   `pembatalan −3 hari (geser rencana)`.

### Catatan pengujian (agar tidak terulang)
Testing agent iterasi 54 berhenti setelah US-1 dengan alasan **"sesi cepat kedaluwarsa"** —
itu **keliru**: access token berumur **24 jam** (`backend/security.py`) dan disimpan di
`localStorage` (`services/apiClient.js`). Penyebab sebenarnya: setiap skrip Playwright baru
memakai browser bersih. Instruksi yang benar: **login sekali, kerjakan semua skenario dalam
satu sesi**, dan hanya bersihkan `localStorage` saat berganti peran.

### Rancangan asli (arsip)
Masalah nyata yang ditutup: Analitik Telat sudah menunjuk pekerjaan yang selalu telat dan
memberi rekomendasi, tetapi ujungnya hanya kalimat "buka Template Jadwal lalu ubah hari
mulai/selesai" — menyimpan template menuntut payload penuh, jadi perencana harus mengetik
ulang seluruh template. Akibatnya kalibrasi tidak pernah dilakukan dan analitik hanya hiasan.
Selain itu perubahan durasi tidak punya jejak (siapa/kapan/atas dasar data apa) dan tidak bisa
dikembalikan. Ditambah **kebutaan model** yang ketahuan saat merancang: `wait_days` (curing)
tidak pernah masuk `day_from/day_to`, sehingga rencana sistematis terlalu optimistis.

### 37a — Kelakuan yang dijanjikan
- Dari kartu rekomendasi **dan** dari setiap baris tabel "Pekerjaan paling sering telat":
  tombol **"Kalibrasi"** → dialog pratinjau → terapkan. Tanpa pindah halaman, tanpa mengetik ulang template.
- **Tiga jenis kalibrasi** (SSOT `calibration_kind`):
  1. `step_duration` — ubah durasi langkah (± hari kerja); langkah SETELAHNYA ikut bergeser
     supaya template tetap konsisten (tidak ada tumpang tindih / lompatan), `week` dihitung ulang.
  2. `wait_time` — ubah lamanya waktu tunggu wajib sebelum langkah boleh dimulai.
  3. `wait_into_plan` — **masukkan waktu tunggu ke tanggal rencana**: langkah digeser agar jaraknya
     dari pendahulu ≥ waktu tunggu (rencana berhenti berpura-pura curing bisa dilewati).
- **Pratinjau = hasil**: satu fungsi hitung dipakai pratinjau DAN eksekusi.
- **Wajib alasan (SSOT `calibration_cause`) + catatan ≥10 karakter**, `client_ref` idempoten.
- **Jadwal unit yang SUDAH ada tidak diubah** (bukti kerja tidak boleh bergeser) — pratinjau
  menyebut angkanya secara jujur, dan menyebut berapa rumah **belum terjadwal** yang akan memakai
  durasi baru. Mengubah tanggal jadwal berjalan tetap hanya lewat **Fase 34**.
- **Riwayat kalibrasi** per template: sebelum→sesudah, pelaku, waktu, alasan, angka data yang
  mendasarinya — dengan tombol **kembalikan (rollback)** tepat ke nilai sebelumnya.
- Rekomendasi yang sudah dikalibrasi ditandai **"sudah diterapkan"** (aplikasi tidak menyuruh dua kali).

### 37b — Berkas
- Backend: `build_calibration.py` (mesin: `plan/apply/rollback/candidates`), `models_p37.py`,
  `reference_p37.py` (grup `calibration_kind`, `calibration_cause`; nomor 37 masuk `_PHASES`),
  `routers/build_calibration_router.py` — `GET /build/calibration/candidates`,
  `POST /build/calibration/preview`, `POST /build/calibration/apply`,
  `GET /build/calibration/history`, `POST /build/calibration/{id}/rollback`.
  Koleksi baru **`build_calibrations`** (+ indeks unik `(org_id, client_ref)`).
  `build_analytics._recommend` diperbaiki: rekomendasi kini membawa objek `calibration`
  siap-pakai + kalimatnya jujur (waktu tunggu berlaku **sebelum** langkah, bukan sesudah).
- Frontend: `components/construction/calibration/{CalibrationDialog,CalibrationHistoryPanel}.js`,
  `constants/testIds/buildCalibration.js`, `DelayAnalyticsPanel` diberi tombol kalibrasi + riwayat.
- Gate: `scripts/poc_37.py` (API nyata) + `scripts/verify_37.py` → `run_all_gates.sh` jadi **18 gates**.

### Invarian (INV-37-x) yang harus terbukti
1. Pratinjau = hasil (fungsi hitung sama).
2. Kalibrasi **tidak menyentuh** `build_items`/`build_schedules` yang sudah ada (dibuktikan
   dengan membandingkan tanggal item sebelum & sesudah).
3. Jadwal **BARU** setelah kalibrasi memakai angka baru (dibuktikan dengan membuat jadwal & mengukur).
4. Tanpa alasan / catatan <10 karakter → **400**; `client_ref` sama → tidak dobel.
5. Template tetap konsisten: durasi ≥1 hari, tidak ada tumpang tindih, `week` ikut benar,
   total bobot tidak berubah, `validate_steps` tetap bersih.
6. Rollback mengembalikan **tepat** nilai sebelumnya dan tercatat sebagai kalibrasi balik.
7. RBAC: hanya Manajer Proyek/direksi/admin; pelaksana melihat tanpa tombol; sales 403.
8. Setiap kalibrasi & rollback masuk `audit_logs`.
9. Rekomendasi yang sudah dikalibrasi ditandai "sudah diterapkan".
10. Kalibrasi menghormati kalender Fase 36 (jadwal baru tetap melewati hari libur).

### User stories Fase 37 (dipakai testing agent)
1. PM membuka Progres & Mutu → tab Analitik Telat dan melihat rekomendasi kalibrasi berisi angka nyata.
2. PM menekan "Kalibrasi" pada satu rekomendasi → dialog terbuka **sudah terisi** usulan perubahan.
3. Tombol terapkan **mati** sebelum alasan + catatan (≥10 karakter) diisi.
4. Pratinjau menampilkan sebelum→sesudah tiap langkah terdampak + total durasi template berubah.
5. Pratinjau menyebut jumlah jadwal unit berjalan yang **TIDAK** diubah + jumlah rumah belum terjadwal.
6. Setelah diterapkan: toast sukses, tabel langkah menampilkan durasi baru, kartu rekomendasi
   berubah menjadi "sudah dikalibrasi".
7. PM membuka riwayat kalibrasi dan melihat sebelum→sesudah, alasan, pelaku, waktu.
8. PM menekan "Kembalikan" pada riwayat → nilai template kembali seperti semula (dengan catatan).
9. PM mengalibrasi langsung dari baris tabel "Pekerjaan paling sering telat" (tanpa rekomendasi).
10. Pelaksana (site@sipro.co.id) melihat analitik tanpa tombol kalibrasi.
11. Sales (sales@sipro.co.id) tetap mendapat kartu "AKSES DITOLAK" pada halaman itu.
12. Kalibrasi `wait_into_plan` menjelaskan dengan jujur bahwa waktu tunggu (curing) dimasukkan ke
    tanggal rencana, bukan dipersingkat.

---

## ✅ FASE 36 — KALENDER JADWAL (KALENDER BULANAN + DETEKSI BENTROK + MASTER LIBUR) — SELESAI & TERVERIFIKASI

### Bukti penutupan (DB tersegar)
- `python3 scripts/poc_36.py` → **132 PASS / 0 FAIL** (INV-36-1..14, semuanya lewat API nyata).
- `python3 scripts/verify_36.py` → **135 PASS / 0 FAIL** (termasuk §G regresi pewarisan kalender).
- `bash scripts/run_all_gates.sh` → **OVERALL PASS (17 gates)**; `verify_31..35` tidak regresi.
- Browser (testing agent iterasi **50, 51, 52**): 12 user story terbukti di layar
  (portofolio, bentrok beban September, pratinjau geser Fase 34, ambang, tambah/hapus libur,
  jadwalkan inspeksi QC jalur ditolak & jalur berhasil, filter jenis/pelaksana, bulan kosong,
  RBAC pelaksana & sales). **0 error konsol.**

### ⚠️ CACAT HIGH yang ditemukan SETELAH ronde-2 (dan cara menemukannya — jangan diulang)
Tester iterasi 51 melaporkan “angka bentrok tidak kembali ke 3 (30 → 76 → 10)” sebagai temuan
**LOW / “kemungkinan efek state”**. Pemeriksaan DB oleh main agent membuktikan itu **bug HIGH**:
- Menekan **“Simpan pola & ambang”** saat halaman menampilkan SATU proyek membuat dokumen
  kalender **khusus proyek** dengan `holidays: []`, dan `resolve()` memperlakukannya sebagai
  **PENGGANTI UTUH** kalender organisasi.
- Akibat nyata (terverifikasi di database, bukan dugaan): **18 hari libur nasional hilang senyap**
  untuk proyek itu → `summary.holidays` Agustus kosong, bentrok `non_workday` **2 → 0**, dan
  **inspeksi QC BERHASIL dijadwalkan pada 2026-08-17 (Hari Kemerdekaan)** tanpa satu pun peringatan.
- Pelajaran: **angka yang tidak kembali ke baseline setelah pengujian = sinyal cacat**, bukan noise.
  Juga: angka kartu ringkasan harus dibaca dari elemen NILAI (nilai 3 + hint “0 beban · 2 hari libur”
  terbaca “30” bila seluruh teks kartu dipungut digitnya).

### Perbaikan (Fase 36b) — pewarisan kalender, bukan penggantian
1. `build_calendar._merge()` menggantikan `_shape()`: kalender efektif = **organisasi diwarisi**,
   override proyek menimpa **pola & ambang** saja; **hari libur DIGABUNG** (organisasi ∪ proyek).
2. `_ensure_doc()` membuat override sebagai **salinan pola/ambang organisasi** → menyimpan
   pengaturan tidak pernah mengubah perilaku diam-diam. Daftar libur dibiarkan kosong **karena
   diwarisi** (libur nasional yang ditambahkan admin kelak tetap sampai ke proyek itu).
3. Menghapus libur warisan pada cakupan proyek kini menjadi **PENGECUALIAN yang disengaja**
   (`holiday_exclusions`): tercatat di `audit_logs` (`calendar_holiday_exclude`), tampil terpisah
   di UI, dan bisa dibatalkan (`POST /build/calendar/holidays/{day}/restore`).
4. Override bisa dilepas: `DELETE /build/calendar/settings?project_id=` → proyek kembali mengikuti
   organisasi. `GET /settings` juga mengembalikan `overrides[]` supaya **divergensi tidak tersembunyi**.
5. Dialog memaksa memilih cakupan (SSOT baru **`calendar_settings_scope`**, bawaan
   “Kalender organisasi”), setiap baris libur menyebut asalnya (SSOT **`holiday_source`**),
   tombol pada libur warisan berbunyi **“Kecualikan”** (bukan “Hapus”).
   Daftar libur dipecah ke komponen `WorkCalendarHolidays.js` (batas ukuran file tetap patuh).
6. **Bentrok `non_workday` diperluas** ke `inspection` + `punch` (`NONWORK_KINDS`) — dulu inspeksi
   yang jatuh di hari libur tidak ditandai di mana pun; pesannya kini merinci jenis agendanya.
   `outlook` (chip bulan berikutnya) menghitung lapisan yang sama supaya angkanya tidak mengecil.
7. Gate regresi baru: `poc_36` **INV-36-11..14** dan `verify_36` **§G** (termasuk uji fungsi murni
   `_merge` tanpa menyentuh database + sapuan semua dokumen override yang ada di DB).

### Sisa data pengujian dibereskan lewat jalur resmi
Override proyek dilepas (`DELETE /settings`) dan tanggal inspeksi yang terjadwal di hari libur
dibatalkan (`PUT /inspections/{id}/schedule` → `null`) — bukan ditembak langsung ke MongoDB.

---

## 📓 FASE 36 — rancangan asli (arsip)

### Masalah nyata yang ditutup
- Tenggat konstruksi saat ini terlihat **per unit / per daftar** saja → bentrok baru ketahuan setelah telat.
- `build_engine` hanya tahu hari kerja mingguan (5/6/7) + `holidays` yang melekat pada template/jadwal.
  Pada data nyata `holidays` kosong, sehingga tenggat bisa mendarat di libur nasional dan tidak ada UI admin untuk mengatur.
- Operasi massal (Fase 34) memakai perhitungan tanggal yang sama (`plan_for_template`, `plan_shift`) → master kalender harus masuk lewat **satu resolver** agar konsisten.
- `inspections` belum punya tanggal rencana → kalender tidak boleh mengarang. Perlu field `scheduled_date` + aksi menjadwalkan.

### Prinsip Fase 36
1. **Kalender = cermin data nyata** (tidak ada angka/tanggal karangan).
2. **Master kalender kerja** (hari libur + pola hari kerja) dipakai oleh **UI kalender** dan **mesin jadwal**.
3. Perubahan jadwal massal/geser **tidak punya mesin baru**: tetap lewat Fase 34 (beralasan + audit + bukti terverifikasi tidak bergeser).
4. UX harus patuh gate: loading/error/empty state, testIds, tanpa hardcode vocabulary, dan route+nav konsisten.

### Invarian (ditegakkan backend, diuji `poc_36.py`, dijaga `verify_36.py`)
- **INV-36-1** Kalender = cermin data nyata (jumlah acara = hasil query langsung; tidak ada angka karangan).
- **INV-36-2** Pola hari kerja & hari libur master **DIPATUHI mesin jadwal** (jadwal baru/geser tidak mendarat di libur).
- **INV-36-3** Bentrok beban pelaksana dilaporkan dengan nama orang + daftar pekerjaan + ambang yang dipakai.
- **INV-36-4** Tenggat yang jatuh di hari non-kerja ditandai + saran hari kerja terdekat.
- **INV-36-5** Tumpukan pekerjaan kritis/hold point melebihi ambang dilaporkan per tanggal.
- **INV-36-6** Kalender **READ-ONLY**; satu-satunya jalan mengubah tanggal = jalur Fase 34 (penyebab SSOT + catatan ≥10 huruf).
- **INV-36-7** RBAC: PM/direksi penuh, pelaksana melihat tanpa tombol ubah, sales 403.
- **INV-36-8** Pengaturan kalender hanya admin/owner/PM dan tercatat di `audit_logs`.
- **INV-36-9** Portofolio lintas proyek hanya menampilkan proyek yang boleh diakses pengguna.
- **INV-36-10** Bulan tanpa data → empty state yang menjelaskan, bukan grid kosong.

### 36a — Mesin Kalender Kerja (Master Data)
- **File baru**: `backend/build_calendar.py`
- **Koleksi baru**: `build_work_calendars`
  - 1 dokumen per org, dengan **opsional override per proyek**.
  - Skema: pola 7 hari (full/half/off), daftar libur `[{date, name, kind}]`, ambang bentrok
    (`max_items_per_person_per_day`, `max_critical_per_day`).
- **Resolver**: `resolve(org, project_id)` digunakan oleh UI kalender dan mesin jadwal.
- **Integrasi ke mesin jadwal**:
  - `backend/build_engine.py` diberi parameter opsional untuk hari off (kompatibel ke belakang).
  - `backend/build_bulk.py` (`plan_for_template`, `plan_shift`) memakai resolver yang sama.
  - Hasil: libur nasional benar-benar **dilewati** oleh jadwal (bukan hanya diwarnai UI).

### 36b — Agregasi Bulanan + Deteksi Bentrok
- **File baru**: `backend/build_calendar_view.py`
- **Endpoint**: `GET /api/build/calendar?month=YYYY-MM&project_id=&kinds=&assignee=`
  - `days[]`: jenis hari, nama libur, jumlah acara, beban per orang.
  - `events[]`: 5 jenis acara (konstruksi item, start/finish jadwal unit, inspeksi/QC terjadwal,
    punch list due, Work Hub due—kecuali task yang punya `meta.build_item_id` agar tidak dobel).
  - `conflicts[]`: `overload / critical_stack / non_workday` + detail orang/daftar pekerjaan + saran.
  - `summary`, `unscheduled` (inspeksi tanpa `scheduled_date`).
- **Lintas proyek**: bila `project_id` kosong, tampil portofolio (dibatasi proyek yang user boleh akses).

### 36c — SSOT & Model
- **SSOT**: `backend/reference_p36.py` (grup baru):
  - `calendar_event_kind`, `calendar_day_kind`, `calendar_conflict_kind`, `holiday_kind`, `calendar_scope`
- Tambahkan **36** ke tuple `_PHASES` di `backend/reference.py`.
- **Model**: `backend/models_p36.py`:
  - `WorkCalendarIn`, `HolidayIn`, `InspectionScheduleIn`.

### 36d — Router & RBAC
- **Router baru**: `backend/routers/build_calendar_router.py`
  - `GET /build/calendar`
  - `GET /build/calendar/settings`
  - `PUT /build/calendar/settings`
  - `POST /build/calendar/holidays`
  - `DELETE /build/calendar/holidays/{date}`
- **Tambahan ke inspeksi**: `PUT /inspections/{id}/schedule` di `inspection_router.py`.
- **RBAC**:
  - lihat kalender: `construction.view` (PM/direksi/pelaksana/keuangan)
  - ubah setting/libur: admin/owner/PM (ditambah `audit_log`)
  - sales: 403 dengan pesan sopan.

### 36e — Seed
- **File baru**: `backend/seed_phase36.py`
  - kalender bawaan: Minggu off, Sabtu setengah hari
  - daftar libur nasional 2026 **bertanda** "bawaan, wajib disesuaikan admin" (jujur)
  - menjadwalkan inspeksi demo (idempoten)
- Dipanggil di `server.py` lifespan **setelah** `seed_phase33`.

### 36f — POC (wajib sebelum frontend)
- **File baru**: `scripts/poc_36.py` (API nyata) harus **100% PASS** untuk INV-36-1..10.

### 36g — Frontend
- Halaman baru **`/build-calendar`**: "Kalender Jadwal".
  - Tambah di `navigationConfig.js` (NAV + PAGE_META) dan `App.js` route.
- Komponen:
  - `CalendarMonthGrid` (grid bulan, badge jenis acara, penanda libur & bentrok)
  - `CalendarDayPanel` (detail hari: daftar acara + tombol buka unit/pekerjaan + tombol geser)
  - `CalendarConflictPanel` (daftar bentrok + penjelasan manusiawi + CTA)
  - `CalendarFilters` (pemilih proyek/semua proyek, bulan, jenis acara, pelaksana)
  - `WorkCalendarDialog` (pengaturan pola hari kerja + CRUD libur; hanya admin/PM)
- Integrasi tombol **"Geser jadwal"** membuka `BulkShiftDialog` Fase 34 (bukan mesin baru).
- **testIds**: file baru `frontend/src/constants/testIds/buildCalendar.js` dan re-export dari index.
- Semua state wajib: loading/error/kosong/akses ditolak (patuh `ux_audit.py`).

### 36h — Gate & Verifikasi
- **Gate baru**: `scripts/verify_36.py` masuk `scripts/run_all_gates.sh` → jadi **17 gates**.
- `verify_api_contract.py` harus hijau: semua `api.get/post` FE cocok route BE.
- `audit_endpoint_sweep.py`: semua GET /api sebagai owner tanpa 5xx.
- Tidak boleh regresi: `verify_31/32/33/34/35` tetap PASS.
- **testing_agent_v3** wajib: user stories Fase 36 + regresi Fase 31–35.

### User stories Fase 36 (dipakai testing agent)
1. PM membuka Kalender Jadwal, memilih bulan, dan langsung melihat tenggat semua rumah dalam satu grid bulanan.
2. PM mengganti cakupan ke "semua proyek" dan melihat portofolio lintas proyek.
3. PM melihat spanduk bentrok "Eko Site kebagian 5 tenggat pada 20 Agustus" lalu membuka detail hari itu.
4. PM melihat tenggat yang jatuh pada hari libur nasional (mis. 17 Agustus) ditandai + saran tanggal kerja terdekat.
5. PM melihat tumpukan pekerjaan KRITIS/hold point pada satu tanggal.
6. Dari kalender PM menekan "Geser jadwal" → dialog Fase 34 terbuka, wajib penyebab + catatan, pratinjau menunjukkan bukti terverifikasi dipertahankan.
7. Admin/PM membuka pengaturan kalender kerja: mengubah Sabtu menjadi setengah hari, menambah/menghapus hari libur; perubahan langsung terlihat di kalender dan dipakai saat jadwal baru dibuat.
8. PM menjadwalkan inspeksi QC yang belum bertanggal dari panel "belum dijadwalkan" lalu inspeksi itu muncul di kalender.
9. Pelaksana (site@sipro.co.id) melihat kalender miliknya tanpa tombol pengubah jadwal.
10. Sales (sales@sipro.co.id) mendapat kartu "AKSES DITOLAK" yang sopan.
11. Filter jenis acara bekerja dan jumlah di ringkasan ikut berubah.
12. Bulan tanpa acara menampilkan keadaan kosong yang menjelaskan.

---

## ✅ FASE 39b — MENUTUP WIRING FASE 39 (4 GATE MERAH) + MASTER DOKUMEN JADI TERPAKAI — SELESAI

### Kondisi awal (terukur, bukan kesan)
`bash scripts/run_all_gates.sh` pada DB tersegar → **17 PASS / 4 FAIL**:

| Gate merah | Temuan apa adanya |
|---|---|
| `audit_endpoint_sweep` | 3 route error 400: `GET /api/doc/matrix`, `GET /api/doc/submissions`, `GET /api/settings/effective` |
| `forensic_audit` | 2 **HIGH**: koleksi `settings` & `doc_submissions` "KOSONG + hanya ditulis engine + TIDAK ADA ENDPOINT BACA" (+ 17 MED) |
| `audit_forms_deep` | 3 blocking: 2 field **"Akun GL" masih input teks bebas** (AddonPanel, PriceComponentPanel) + 1 peta label enum hardcode (SettingsPanel) |
| `ux_audit` | 1 error: `data-testid="project-open-structure"` statis di dalam `.map()` (ProjectsPage.js:98) |

### Cacat SUNGGUHAN yang ditemukan saat menelusuri gate merah (bukan cuma alat yang salah)
1. **Master 17 dokumen syarat Fase 39 adalah data mati.** `grep` seluruh frontend:
   `doc/matrix` & `doc/submissions` **0 kemunculan** → tidak ada satu pun layar yang memakainya.
   Akibatnya US-39-3 ("…lalu melihatnya muncul sebagai checklist") **belum terbukti**, dan
   `doc_submissions` **mustahil terisi dari UI** — itulah sebab aslinya gate memerah.
2. **SSOT ganda**: `CONTEXT_OPTIONS` (8 konteks `applies_to`) ditulis ulang di
   `DocRequirementsPanel.js`, padahal vocabulary-nya milik backend. Tidak tertangkap E5
   karena nilainya belum ada di registry mana pun.
3. **`migration_runs` tidak bisa dilihat siapa pun** → klaim "18 unit lama otomatis dapat
   cluster & blok" (US-39-5) hanya bisa dipercaya, tidak bisa diperiksa.
4. **Dua false positive alat**: regex tipe input `\w+` tidak mengenali `datetime-local`,
   sehingga 3 field yang SUDAH memakai pemilih tanggal dilaporkan cacat E3.

### Yang dikerjakan
**39b-1 — Checklist Dokumen benar-benar ada di layar (US-39-3)**
- Komponen baru `frontend/src/components/patterns/DocChecklist.js` (dipakai ulang):
  matriks syarat × bukti, badge WAJIB/opsional, catatan syarat, status pill, riwayat
  (siapa mengunggah/memverifikasi + kapan + alasan tolak), tombol **Unggah / Unggah ulang /
  Verifikasi / Tolak (wajib beralasan)**, ringkasan hitungan + badge "Syarat wajib lengkap".
- Dipasang di **drawer Lead** (`components/sales/LeadDetail.js`) dan **drawer Pelanggan**
  (`components/customers/CustomerDetailSheet.js`). Sesuai `docs/v2/24_CRM_LEAD_SPEC.md` §6,
  `22_DOMAIN_DATA_WIRING.md` W7 & INV-07, dan `26_CUSTOMER_LEGAL_SPEC.md` (dokumen lead
  diwarisi pelanggan).
- **Konteks dihitung backend, bukan frontend** → `doc_registry.contexts_for()`:
  lead = tahap sekarang + tahap BERIKUTNYA (+ `lead_stage:spr` bila sudah booking/won);
  pelanggan = `customer:legal` (+ `payment_scheme:kpr` bila punya pengajuan KPR);
  mitra = `partner:onboarding`. `GET /doc/matrix` tanpa `contexts` kini menurunkannya sendiri,
  jadi aturannya tidak punya dua versi.
- Grup SSOT baru `doc_context` (12 nilai) menggantikan `CONTEXT_OPTIONS` hardcode →
  chip di checklist berbunyi **"Lead — tahap Booking (keep unit)"**, bukan `lead_stage:booking`.

**39b-2 — `audit_endpoint_sweep` (3 route 400)**
400 di situ adalah **validasi yang benar** (parameter entitas/kunci wajib). Yang salah adalah
sweep-nya: ia memanggil tanpa parameter. Ditambah `QUERY_RESOLVERS` yang **mencari id NYATA**
lewat API lain (`/leads`, `/settings`) sebelum memanggil route — jadi yang diuji jawaban
sebenarnya, bukan sekadar "tidak 500". Bila id tak bisa di-resolve, gate **gagal keras**
(dibuktikan mutasi M6).

**39b-3 — `forensic_audit` jujur soal "endpoint baca"**
Audit dulu hanya mencari `db.<coll>.find(...)` **di dalam berkas router**. Sejak router
dibatasi 800 baris, akses DB pindah ke modul engine → 10 koleksi dilaporkan "TIDAK ADA
ENDPOINT BACA" walau datanya jelas tampil di layar; **dua di antaranya HIGH dan menutupi
temuan sungguhan**. Perbaikan: `_router_helper_modules()` mengikuti `import` modul lokal
milik router (termasuk **import di dalam fungsi** — pola `omnichannel_router` → `wa_playbooks`),
lalu operasi baca di modul itu dihitung. Ditambah entri `ENGINE_MANAGED` untuk 12 koleksi
Fase 39/33/35/36 **dengan menyebut endpoint tulis nyatanya** (masing-masing diverifikasi
dengan curl), dan `build_weekly_reports` masuk `DERIVED_BY_DESIGN`.
Hasil: **HIGH 2 → 0**, **MED 17 → 8** (sisanya jujur: "kosong sampai dipakai pertama kali"
atau memang ditulis penjadwal).

**39b-4 — `audit_forms_deep` (2 field enum + 1 peta label)**
- Grup SSOT baru `gl_account`: **dinamis dengan LABEL dari master** — mekanisme registry
  diperluas (`label_field` + `label_format` di `source`) sehingga dropdown berbunyi
  **"4-1100 — Pendapatan Penjualan Unit"** (30 akun dari bagan akun), bukan kode telanjang.
  `allow_new: false` → akun baru harus dibuat dulu di halaman Akuntansi (pemilih tidak
  menawarkan "Nilai baru…"). `reference.py` **tidak disentuh** (masih 798/800 baris):
  penggabungan label dikerjakan `routers/reference_router.py`.
- `AddonPanel` & `PriceComponentPanel`: input teks "Akun GL" → `ReferenceSelect`.
- `SettingsPanel`: `ORIGIN_LABEL`/`SOURCE_LABEL` dihapus → `labelOf("setting_origin"/"setting_source")`
  (grup baru di `reference_p39.py`).
- Alat diperbaiki: regex tipe `[\w-]+` (kenali `datetime-local`) + E3 tidak berlaku untuk
  `type=number`. Label "Maksimal tenggat per pelaksana per hari" → "Maksimal **jumlah**
  tenggat…" agar tidak ambigu. Hasil: **E1 0, E5 0, E2 0, E3 0, E4 0**.

**39b-5 — `ux_audit`**: `project-open-structure` diberi `data-project={p.id}` + `aria-label`
berisi nama proyek → 18 elemen dalam `.map()` lolos, gate PASS.

**39b-6 — Endpoint baru yang membuat klaim bisa diperiksa**
`GET /api/admin/migrations` (izin `audit_logs.view`) → riwayat `migration_runs` **plus
`state`**: hitungan NYATA saat ini (18 unit, 18 punya cluster, 18 punya blok, 18 punya tipe,
0 tanpa cluster/blok). Karena migrasi idempoten, jalan kedua wajar berangka 0 — angka 0 itu
mudah disalahpahami sebagai "tidak pernah dibereskan", jadi keadaan sekarang ditampilkan
lebih dulu. Layarnya: panel **"Migrasi & Pembenahan Data (V2)"** di halaman Jejak Audit
(`/admin/audit`) — `components/master/MigrationRunsPanel.js`. US-39-5 kini bisa
**dibuktikan**, bukan dipercaya.

**39b-7 — Dua bug NYATA yang muncul justru saat pengujian (bukan dari gate)**
1. **Unggah gagal-senyap.** Checklist dulu memakai SATU input berkas tersembunyi bersama +
   `pickFor` (ref) yang hanya terisi bila tombol diklik. Bila berkas dipilih tanpa melewati
   tombol, handler berhenti **tanpa pesan apa pun** — testing agent ronde 2 melaporkannya
   sebagai "unggah tidak mengubah status". Perbaikan: **setiap baris syarat punya input
   berkasnya sendiri** (`input[data-testid=doc-checklist-file][data-requirement=<KODE>]`),
   kode syarat dibawa elemennya, dan bila kode hilang muncul pesan galat (tidak pernah diam).
2. **500 pada bukti kembar.** Index unik `uq_doc_submission` menolak `file_id` yang sama,
   tetapi `create_submission` tidak menangkap `DuplicateKeyError` → **HTTP 500** dan layar
   hanya berbunyi "Gagal mengunggah dokumen". Lebih dalam: mengunggah ULANG berkas yang sama
   menghasilkan `file_id` BARU sehingga bukti kembar tetap lolos (verifikator mengerjakan
   berkas yang sama dua kali). Perbaikan: penangkapan `DuplicateKeyError` **dan** pemeriksaan
   **isi berkas** lewat sidik jari `files.sha256` (sudah ada sejak Fase 31) →
   400 berbunyi *"Berkas dengan isi yang sama sudah pernah diserahkan untuk syarat 'X'
   (status: Menunggu verifikasi)…"*. Bukti berbeda tetap boleh, dan unggah ulang setelah
   **DITOLAK** tetap boleh (kalau tidak, satu penolakan keliru mengunci prosesnya).

**39b-8 — Gate baru ke-22: `scripts/verify_39b.py`** (58 pemeriksaan) menjaga janji Fase 39b:
konteks diturunkan backend, bukti fiktif ditolak, bukti kembar (file_id **dan** isi) ditolak
tetapi bukti berbeda/unggah-ulang-setelah-ditolak diizinkan, verifikasi & penolakan menyimpan
aktor+waktu+alasan, **pengunggah tidak boleh memverifikasi berkasnya sendiri**, hitungan
matriks & `doc_progress` ikut berubah, label dari SSOT, dan **wiring UI benar-benar ada**
(checklist terpasang di Lead & Pelanggan, input berkas per baris, tidak ada peta label
hardcode). Gate ini **membereskan sisa data ujinya sendiri** (menghapus penyerahan+berkas uji
lalu menghitung ulang `doc_progress` dengan rumus yang sama seperti
`doc_registry.refresh_progress`) sehingga data demo tidak ikut kotor.

**39b-9 — CACAT IZIN yang ditemukan main agent sendiri saat menonton layar (bukan dari gate
maupun tester)**
Setelah checklist jadi, saya membukanya sebagai **sales** dan tombol **Verifikasi/Tolak ikut
muncul**. Artinya orang yang MENGUNGGAH berkas bisa meloloskan berkasnya sendiri — "gerbang
bukti" kehilangan seluruh artinya. Tabel izin `docs/v2/24_CRM_LEAD_SPEC.md` §13 memang
menyebut: verifikasi dokumen = **sales ✖**, sales_manager ✔, marketing_admin ✔, finance ✔,
owner/super_admin ✔. Penyebabnya: endpoint verifikasi memakai izin `documents.update` yang
JUGA dimiliki sales. Perbaikan:
- Aksi RBAC baru **`documents.verify`** dipisah dari `update`; `POST /doc/submissions/{id}/verify`
  dan `/reject` memakai izin itu. Ditulis juga sebagai `ROLE_GRANTS` eksplisit karena matriks
  RBAC yang **sudah tersimpan di DB menimpa** DEFAULT_PERMISSIONS per peran (tanpa itu izin
  baru tidak pernah aktif pada organisasi lama → tombol jadi 403).
- **`GET /auth/me` kini mengirim `permissions`** (izin efektif peran) → `AuthContext.can()`.
  Frontend menyembunyikan aksi yang pasti ditolak backend **tanpa menyalin aturan RBAC**
  (dulu satu-satunya cara adalah menebak dari nama peran = aturan punya dua versi).
- Bukti di browser: **sales** mengunggah NPWP → 0 tombol Verifikasi/Tolak; **manajer** melihat
  1 tombol Verifikasi + 1 Tolak, memverifikasi, dan barisnya berbunyi
  "diunggah … oleh sales@sipro.co.id · Diverifikasi … oleh manager@sipro.co.id".
  Di API: sales verify/reject = **403**, manajer = **200**.
- Cacat kejujuran angka yang ikut diperbaiki: badge menulis **"Syarat wajib lengkap"** padahal
  syaratnya **belum ada satu pun** (`complete=true` untuk daftar kosong) → sekarang berbunyi
  "Belum ada syarat pada tahap ini".

### Bukti penutupan
- `bash scripts/run_all_gates.sh` → **OVERALL PASS (22 gates)** pada DB tersegar
  (`verify_39b.py` masuk sebagai gate ke-22).
- `python3 scripts/mutasi_39b.py` → **20/20 pemeriksaan LULUS** (10 mutasi tertangkap +
  10 pulih). Mutasi yang diuji: dropdown SSOT dikembalikan jadi input bebas; peta label
  hardcode; tenggat `type=text`; router lepas dari `settings_store`; koleksi tanpa endpoint
  tulis; parameter wajib tak bisa di-resolve; **checklist dicabut dari layar Lead**;
  **input berkas kembali dipakai bersama**; **pemeriksaan bukti kembar dihapus**;
  **konteks tidak lagi diturunkan backend**.
  Catatan: uji-mutasi ini SENDIRI menemukan **gate saya terlalu longgar** (M8 lolos karena
  `data-requirement` dicari di seluruh berkas, padahal harus diperiksa pada elemen
  `<input type="file">`-nya) → gate diperketat. Juga ditambah tunggu `/api/health` sebelum
  tiap mutasi dijalankan agar hasilnya tidak flaky karena hot-reload backend.
- `poc_31` 63/63, `poc_32` 79/79, `poc_33` 66/66, `poc_34` 57/57, `poc_35` 43/43,
  `poc_36` 132/132, `poc_37` 85/85 — semua 0 FAIL (poc_37 wajib DB tersegar: butuh rumah
  yang belum terjadwal, akan gagal bila dijalankan setelah poc_34/36 memakai jatahnya).
- **testing_agent iterasi 58 / 59 / 60**: backend 57/61 (0 kritis; 3 "temuan" terbukti bukan
  bug setelah saya periksa), lalu 7 dari 8 alur frontend PASS, lalu alur unggah→verifikasi,
  tolak-beralasan, unggah-ulang-setelah-ditolak, dan checklist pelanggan PASS.
- Dibuktikan main agent di browser (Playwright, URL pratinjau): unggah → `pending` →
  **Verifikasi** → `verified` + "Diverifikasi … oleh superadmin@sipro.co.id" → **Tolak**
  (submit mati saat alasan kosong) → `rejected` + alasan tampil; bukti kembar → POST 400 +
  toast berbahasa Indonesia; panel migrasi menampilkan 18/18 unit ber-cluster & ber-blok.
- DB akhir **bersih**: `doc_submissions` 0, `settings` (override) 0, tidak ada berkas uji.

### Yang SENGAJA belum dikerjakan (jangan diklaim selesai)
- **INV-07 belum ditegakkan**: checklist masih informatif — sistem belum menolak kenaikan
  tahap saat dokumen wajib belum verified. Tahap `spr` juga belum ada di mesin lifecycle
  (`acquisition → nurturing → appointment → booking → won`). Keputusan owner: **Fase 41/42**.
- Checklist belum dipasang di **Mitra** (3 syarat `partner:onboarding`) & **Unit**
  (`unit:permit`) — keputusan owner: cukup Lead + Pelanggan dulu.
- `doc_submissions` & `settings` **kosong pada DB baru** — itu benar (belum ada unggahan /
  belum ada setting yang ditimpa); forensic melaporkannya MED, bukan HIGH.
- Duplikasi lama **`customers.kyc_files` vs `doc_submissions`** masih ada (dua sistem dokumen
  pelanggan). Konsolidasinya milik **Fase 43** (`26_CUSTOMER_LEGAL_SPEC.md`).

### User stories Fase 39/39b (dipakai testing agent)
- **US-39-1** Admin membuat cluster → blok → unit (satuan, generator massal, impor CSV dry-run)
  dari halaman `/projects/:id`.
- **US-39-2** Admin membuat master add-on & komponen biaya; **Akun GL dipilih dari dropdown
  bagan akun** (tidak bisa diketik ngawur).
- **US-39-3** Admin membuat/mengubah master dokumen syarat di Pusat Konfigurasi → syarat itu
  **muncul sebagai checklist** di layar Lead & Pelanggan sesuai tahapnya.
- **US-39-3b** Sales mengunggah KTP di checklist lead → status "menunggu" → supervisor
  **Verifikasi** (tercatat aktor+waktu) atau **Tolak dengan alasan** (alasan terlihat).
- **US-39-4** Admin mengubah setting `reservation.max_active_per_lead` dari UI (wajib alasan)
  → nilai efektif berubah & riwayat perubahan terlihat.
- **US-39-5** Admin melihat riwayat migrasi/backfill (`/api/admin/migrations`) sebagai bukti
  data lama ikut dibereskan.

---

## ✅ FASE 38 — SAPUAN PERMUKAAN TAMPILAN (latar kartu/field, label, kontras) — SELESAI & TERVERIFIKASI

### Masalah nyata yang ditutup
Keluhan pemakai yang memicu sesi sebelumnya: *"banyak kartu rusak, tidak ada background"*.
Akar pertamanya sudah ditemukan (Input/Textarea/Select bawaan shadcn memakai `bg-transparent`
sehingga field di atas panel berwarna tampak tanpa latar) dan diperbaiki. Yang **belum** ada:
alat untuk membuktikan sisanya, dan penjaga supaya tidak kembali. Terutama karena alat audit
lama (`ui_audit_shots.py`, `ui_audit_tabs.py`) hanya mengukur halaman **pada keadaan awal** —
padahal keluhan itu paling banyak muncul **di dalam dialog**, tempat field bertumpuk di atas
panel berwarna.

### 38a — Alat baru: audit DI DALAM dialog
`scripts/ui_audit_dialogs.py` (baru): masuk sebagai satu peran, membuka setiap dialog di
seluruh halaman (dikenali dari kata kerja pada label tombol, bukan dari testid, supaya tombol
yang lupa diberi testid pun ikut terperiksa), lalu **mengukur** di dalam dialog:
`D1` panel berbingkai/berbayang tanpa latar · `D2` field tanpa latar sendiri ·
`D3` tombol aksi terakhir tak terjangkau (hanya bila panel memang tidak bisa digulir) ·
`D4` teks meluber tanpa elipsis · `D5` field bisu (tanpa label/aria-label/placeholder) ·
`D6` kontras teks < 3:1 terhadap latar efektifnya. Hasil: JSON + tangkapan layar tiap dialog.

### 38b — Temuan (terukur) & perbaikannya
| Temuan | Akibat nyata | Perbaikan |
|---|---|---|
| `D1` panel 698×1826 tanpa latar di layar Kalibrasi; 1 panel tanpa latar di dialog "Jadwal massal"; 3 pembungkus tabel (`LedgerDrillSheet`, `BroadcastPanel`, `SpkScopeSection`) | daftar/tabel tampak "menggantung" tanpa kartu — inilah "kartu rusak" | `bg-card` pada kelima pembungkus |
| `D5` 21 field bisu di 7 dialog (izin, buku harian, subkon, RAB, PO, pengguna, material) | kotak isian tanpa nama: pemakai menebak, pembaca layar bungkam, penguji hanya bisa pegang urutan DOM | `id`+`htmlFor`, `data-testid`, dan **placeholder contoh nyata** (mis. "503/1234/DPMPTSP/2026") |
| Label tidak tertaut di **79** tempat lain | klik tulisan label tidak memindahkan kursor ke kotaknya | codemod mekanis `scripts/_patch_label_ids.py` (hanya `<Label>` tanpa atribut + kontrol tanpa `id`) |
| `D5` semua `ReferenceSelect` | pemicu shadcn adalah `<button>`, jadi label di atasnya tidak pernah tertaut | `aria-label` diambil dari label grup SSOT `/api/reference` (tanpa mengetik ulang teks) |
| `D6` legenda grafik "Rencana" kontras **2.1:1** | tulisan legenda memakai warna garis amber → nyaris tak terbaca di latar putih | pembantu baru `utils/chartUi.js` (`legendLabel`) dipakai 4 grafik; kotak warna seri tetap |
| teks panjang terpotong (kas bon, aset, audit, pemilih template) | isi tidak terbaca | sudah ada `title` (hover) di 3 tempat; pemilih template di layar Kalibrasi ditambahkan |

### 38c — Penjaga baru (gate ke-19)
`scripts/verify_ui_surfaces.py` masuk `run_all_gates.sh` (**19 gates**) dengan 20 pemeriksaan:
`S1` field wajib punya latar sendiri (bukan `bg-transparent`) · `S2` permukaan mengapung
(dialog/sheet/popover/dropdown/select/command) memakai latar **padat**, tidak boleh
semi-transparan · `S3` pembungkus tabel berbingkai wajib menyebut `bg-` ·
`S4` tidak ada `<Label>` menggantung tanpa tautan ke field · `S5` setiap `<Legend>` memakai
`formatter` warna teks yang terbaca.
Gate ini **diuji-mutasi**: `bg-background` pada `input.jsx` sengaja dikembalikan ke
`bg-transparent` → gate GAGAL seperti seharusnya, lalu dipulihkan → PASS (jadi gate ini
benar-benar menjaga, bukan hiasan). Satu bug pada gate sendiri ikut ketemu dari uji ini:
pengambilan class dengan memasangkan tanda kutip dari awal berkas salah membaca komentar,
sehingga sempat lolos padahal class-nya tidak terbaca.

### 38d — Bukti sebelum → sesudah (angka, bukan kesan)
| Ukuran | Sebelum | Sesudah |
|---|---|---|
| Kartu tanpa latar (35 halaman, peran owner) | 1 | **0** |
| Kartu tanpa latar (55 tab) | 0 | **0** |
| Dialog bermasalah / temuan — owner | 11 dialog / 22 temuan | **0 / 0** (37 dialog) |
| Dialog bermasalah / temuan — pm | 13 dialog / 19 temuan | **0 / 0** (40 dialog) |
| Dialog bermasalah / temuan — finance | 0 / 0 | **0 / 0** (43 dialog) |
| Dialog bermasalah / temuan — pelaksana (site) | — | **0 / 0** (44 dialog) |
| Gate | 18 PASS | **19 PASS** |

### Catatan jujur
- Teks panjang yang terpotong dengan elipsis **tetap ada** di kas bon/aset/log audit — itu
  memang disengaja (kolom sempit), dan isi penuhnya muncul saat kursor diarahkan (`title`).
- Kesalahan konsol yang terlihat saat audit lewat `localhost:3000` (`ws://localhost:443/ws`)
  adalah socket hot-reload webpack, bukan cacat aplikasi: lewat URL pratinjau **0 error**.
  Karena itu audit sekarang dijalankan dengan `SIPRO_UI_BASE=<url pratinjau>`.
- Respons 403 yang tercatat sebagai "console error" pada halaman terlarang adalah **RBAC yang
  bekerja** (halaman menampilkan kartu AKSES DITOLAK), bukan kerusakan.

---


## 3) Next Actions (immediate)
Fase 31–38 selesai & terverifikasi, dan **Fase 39 + 39b (fondasi data V2 + checklist dokumen)
sudah ditutup** dengan 22 gate hijau. **Berikutnya = FASE 40 (IA & Design System V2)** sesuai
`docs/v2/34_ROADMAP_EKSEKUSI.md` — sudah disetujui owner:
1. **Fase 40 — IA & Design System V2**: semua daftar utama memakai `DataTable`
   (search + filter multi + sort + pilih kolom + ekspor + aksi massal), klik baris membuka
   **halaman** detail kanonik (`/leads/:id`, `/customers/:id`, `/units/:id`, `/projects/:id`)
   untuk objek besar, restrukturisasi navigasi **33 → 26 item** (tanpa fitur hilang —
   wajib checklist pemetaan), setiap KPI beranda bisa diklik → tabel terfilter.
   Gate baru: `verify_ia_v2.py` (+ perluas `verify_ui_surfaces.py`).
   **Pekerjaan yang sudah menunggu di Fase 40**: pindahkan `DocChecklist` dari drawer Lead
   ke halaman `/leads/:id` (keputusan owner Fase 39b).
2. Setelah itu **Fase 41 — CRM Lead V2** (stage machine v2 + tahap `spr`, umur tahap & SLA,
   profil lead, merge duplikat) — di sini **INV-07 ditegakkan** (lead tidak boleh naik tahap
   sebelum dokumen wajib terverifikasi).
3. Ditahan owner (butuh arahan/kredensial): **Kurva-S & laporan portofolio lintas proyek**;
   **ringkasan laporan mingguan via WhatsApp** (butuh kredensial Meta; WA masih simulasi).
4. Lanjutan sapuan tampilan bila owner menyebut halaman tertentu: alat ukurnya sudah ada
   (`ui_audit_shots.py`, `ui_audit_tabs.py`, `ui_audit_dialogs.py`) sehingga perbaikan
   berikutnya bisa langsung berbasis angka, bukan tebakan.

## 3b) Catatan pemeliharaan
- **`backend/reference.py` sudah menyentuh batas compliance (≤800 baris).** Grup fase baru
  WAJIB dibuat di `reference_p<NN>.py`, lalu cukup **menambahkan nomor fase ke tuple `_PHASES`**
  di `reference.py` (pemuatan sudah dinamis sejak Fase 35).
- **Setelah pull/restore repo (PENTING — sudah TUJUH kali terjadi):**
  1. `/app/backend/.env` di-gitignore → buat ulang: `JWT_SECRET` (acak), `EMERGENT_LLM_KEY`,
     `PORTAL_MASTER_OTP=000000`, `DEFAULT_ORG_ID=org-sipro`, `DEFAULT_ORG_NAME=PT SIPRO Land`,
     `COOKIE_SECURE=true`, `BOOKING_HOLD_DAYS=7`, `STORAGE_PROVIDER=emergent`, `PHOTO_*`.
     Tanpa `JWT_SECRET`, login **500 (`KeyError: JWT_SECRET`)**.
     ⚠️ **Jebakan nyata (pemulihan ke-7)**: baris `CORS_ORIGINS="*"` bawaan platform **tidak
     diakhiri newline**, jadi `cat >> .env` membuat `CORS_ORIGINS="*"JWT_SECRET=…` menempel
     dalam satu baris → `JWT_SECRET` tidak terbaca. Periksa `head -4 .env` setelah menulis.
  2. `pip install APScheduler reportlab` — dua paket ini TIDAK ada di image dasar
     (tanpa itu backend gagal start: `ModuleNotFoundError: reportlab`).
     Catatan: `pip install -r backend/requirements.txt` **gagal** (konflik
     `emergentintegrations` vs `litellm` yang sudah ada di image) — cukup dua paket di atas.
     Untuk alat audit tampilan tambahkan `pip install playwright` (hanya untuk
     `scripts/ui_audit_*.py`; SENGAJA tidak dimasukkan `requirements.txt` karena backend
     tidak memakainya — `/usr/bin/google-chrome` sudah tersedia di image, jadi tidak perlu
     `playwright install`).
  3. `cd frontend && yarn install`, lalu `sudo supervisorctl restart backend frontend`.
  4. `bash scripts/seed_reset.sh` → harus **OVERALL PASS (22 gates)**.
  5. Kredensial uji ada di `/app/memory/test_credentials.md` (sandi `Sipro#2026`) — sejak
     pemulihan ke-7 berkas ini SUDAH ikut di repo, tidak perlu ditulis ulang.
  6. Berkas sementara (token, log) taruh di `/root/tmp`, **bukan** `/tmp`: `/tmp` dibersihkan
     saat pod idle/restart di tengah sesi (terjadi pada pemulihan ke-7).
- Sebelum menyatakan sebuah fase selesai, WAJIB hijau semua:
  - `bash scripts/run_all_gates.sh` (**22 gates**, termasuk `verify_37.py`,
    `verify_ui_surfaces.py`, `verify_settings.py`, `verify_masterplan.py`, `verify_39b.py`)
  - `poc_31.py` (63) + `poc_32.py` (79) + `poc_33.py` (66) + `poc_34.py` (57) + `poc_35.py` (43) + `poc_36.py` (**132**) + `poc_37.py` (**85**)
  - `python3 scripts/mutasi_39b.py` (**20**) bila gate/alat audit ikut diubah — gate yang
    tidak bisa memerah tidak menjaga apa pun.
  Catatan: `poc_35.py` memakai 3 pekerjaan siap kerja hasil seed dan `poc_37.py` butuh
  rumah yang BELUM terjadwal — jalankan pada DB tersegar (`seed_reset.sh`, lalu ulangi
  drop+restart bila POC lain sudah menghabiskan jatahnya; urutan aman: 35 → 31 → 32 → 33 →
  34 → 36, lalu reset lagi sebelum 37).
- **Bypass uji**: tidak ada backdoor auth; pengujian memakai akun demo asli + tombol
  "Masuk cepat" di halaman login (hanya memanggil `POST /auth/login` biasa). Tombol demo ini
  boleh dimatikan sebelum go-live — beri tahu agar dihapus dari `pages/Login.js`.
- **Arsip bukti**: salinan lengkap bukti penutupan Fase 31–35 disimpan di
  `memory/plan_archive_upto_fase35.md` (jangan dihapus).
- **Pelajaran pengujian (dari Fase 36 ronde-2)**: bila sebuah angka **tidak kembali ke baseline**
  setelah pengujian, itu **sinyal cacat** — jangan diterima sebagai "efek state". Dan angka pada
  kartu ringkasan harus dibaca dari elemen NILAI-nya (nilai `3` + hint `0 beban · 2 hari libur`
  akan terbaca `30` bila seluruh teks kartu dipungut digitnya).
- **Pelajaran pengujian (dari Fase 39b)**:
  1. **Jangan pernah gagal-senyap.** Handler yang `return` tanpa pesan saat prasyaratnya
     kosong menghasilkan laporan "fitur tidak jalan" yang mahal ditelusuri. Bawa data yang
     dibutuhkan pada ELEMEN-nya (mis. `data-requirement` di tiap `<input type="file">`),
     jangan disimpan di ref bersama yang hanya terisi oleh urutan klik tertentu.
  2. **Setiap `insert_one` pada koleksi ber-index unik wajib menangkap `DuplicateKeyError`**,
     kalau tidak pengguna dapat 500 tanpa penjelasan (terjadi pada `doc_submissions`).
  3. **Uji-mutasi bisa menemukan gate-nya sendiri longgar.** Pemeriksaan "string X ada di
     berkas" mudah lolos karena string itu muncul di tempat lain — periksa pada ELEMEN/BLOK
     yang dimaksud (temuan M8).
  4. **Gate yang membuat data wajib membereskan sisanya sendiri** (`verify_39b.py` menghapus
     penyerahan+berkas ujinya lalu menghitung ulang denormalisasi `doc_progress`), agar data
     demo owner tidak makin kotor setiap kali gate dijalankan.
  5. **Laporan testing agent tetap harus diperiksa sendiri.** Tiga "temuan" iterasi 58
     ternyata bukan bug (parameter/route sudah benar), sedangkan satu "bug medium" iterasi 59
     justru menutupi dua cacat nyata. Periksa dengan `curl`/browser sebelum menerima maupun
     menolak laporan.

---

## 4) Success Criteria
- ✅ WorkHub berfungsi sesuai domain divisi dan menjadi penggerak kerja.
- ✅ Lead lifecycle menjadi gerbang bukti; WA terintegrasi; stage tidak loncat.
- ✅ Construction Progress Engine v2 (Fase 31) stabil.
- ✅ Fase 32 stabil (Papan Mandor, laporan mingguan, analitik telat, policy GPS).
- ✅ Fase 33 stabil (uang mengikuti bukti).
- ✅ Fase 34 stabil (jadwal massal & geser massal menjaga bukti).
- ✅ Fase 35 stabil (offline queue jujur & idempotent).
- ✅ **Fase 36 (Kalender Jadwal) — TERCAPAI**:
  - PM/direksi bisa melihat **kalender bulanan** tenggat lintas unit, dan opsional lintas proyek.
  - Bentrok (beban pelaksana, tumpukan kritis, jatuh di non-kerja) terlihat jelas sebelum telat.
  - Hari libur & pola hari kerja bisa diatur admin dan dipakai **UI + mesin jadwal**.
  - Mengubah tanggal tetap lewat Fase 34 (beralasan + audit + bukti terverifikasi dipertahankan).
  - Semua perubahan menjaga compliance (py<800, js<500, util<300, css<400) dan `bash scripts/run_all_gates.sh` tetap PASS.

---

## 5) Log Pemulihan (Clone dari GitHub — 16 Agu 2026)
Repo `github.com/oipowasa/Sipro` dipulihkan ke `/app` pada environment baru.

- **Disalin**: seluruh isi repo kecuali `.git/`, `.emergent/`, `node_modules/`, `__pycache__/`, dan `.env`
  (file `.env` tidak ada di repo karena `.gitignore` — dibuat ulang, lihat bawah).
- **`backend/.env` dibuat ulang** (MONGO_URL & DB_NAME milik platform tidak diubah):
  `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`, `JWT_SECRET` (baru, acak 32-byte),
  `EMERGENT_LLM_KEY` (untuk Object Storage terkelola), `PORTAL_MASTER_OTP=000000`,
  `DEFAULT_ORG_ID=org-sipro`, `DEFAULT_ORG_NAME=PT SIPRO Land`.
  Catatan: JWT_SECRET baru ⇒ semua sesi/token lama tidak valid (login ulang).
- **`frontend/.env`** memakai `REACT_APP_BACKEND_URL` milik environment (tidak diubah).
- **Dependensi**: `yarn install` (frontend, OK). Backend: seluruh paket sudah ada di image
  kecuali `reportlab==5.0.0` + `APScheduler==3.11.3` (+`tzlocal`) yang dipasang manual.
  `pip install -r requirements.txt` penuh **gagal** karena resolusi `emergentintegrations 0.2.0`
  vs wheel `litellm 1.80.0` — keduanya sudah terpasang di image, jadi tidak diperlukan.
- **Seed startup sukses**: org + 9 user demo, site plan 12 kavling, peta SVG demo,
  Fase 27 (aset/kas bon/pembiayaan), Fase 29 (44 jobdesk), Fase 28b (3 foto contoh),
  Fase 31 (2 template + 4 jadwal unit), Fase 33 (RAB→langkah + SPK borongan),
  Fase 36 (kalender kerja + 18 hari libur). Object storage: `provider=emergent (managed)`.
- **Verifikasi**: `bash scripts/run_all_gates.sh` ⇒ **OVERALL: PASS (19 gates)**.
  `testing_agent_v3` iterasi 57 ⇒ backend 20/20, frontend (login + 9 rute utama) lolos, **0 bug**.
- **Status**: aplikasi berjalan penuh di preview URL; tidak ada perubahan kode fungsional.

---

## 6) SIPRO V2 — Perbaikan Fondasi & Ekspansi CRM/BI (mulai 16 Agu 2026)
Review menyeluruh owner (CRM + digital marketing + analytics/BI + proyek/unit + konstruksi) menghasilkan
**spesifikasi V2 terpisah yang saling mereferensikan** di `docs/v2/` (17 dokumen, 1.927 baris, 0 link rusak).

**Pintu masuk wajib:** `docs/v2/20_INDEX_V2.md` (keputusan owner D1–D13 + daftar pertanyaan terbuka OQ-1…OQ-11)
lalu `docs/v2/36_PLAYBOOK_AGENT.md` (aturan kerja) dan `docs/v2/34_ROADMAP_EKSEKUSI.md` (Fase 39–51).

**Temuan kritis yang harus diperbaiki (bukti di `docs/v2/21_AUDIT_KONDISI.md`):**
- `CR-01` **S1** satu lead bisa mengunci banyak unit (`routers/deals_router.py:78` tanpa cek reservasi aktif per lead).
- `CR-02/03` SPR hanya 1 klik, booking fee tanpa siklus verifikasi/hangus/refund (klausa `[DOC]` tidak dijalankan).
- `CR-04` tahap `won` masih menunggu AJB → lead mandek di `booking` (bertentangan dengan keputusan owner D4).
- `CR-05` tidak ada entitas **cluster/blok** (blok hanya hasil `code.split("-")`).
- `CR-06/07` komponen biaya (BPHTB/notaris/bank/hook/kelebihan tanah/promo) & skema bayar belum jadi data.
- `CR-14…CR-17` tidak ada BI (CAC, conversion per tahap, unit terjual kumulatif, realisasi RAB, target dinamis).

**Aset baru:** 4 dokumen legal asli owner disimpan permanen di `docs/source_templates/`
(SPR Cash, SPR Cash Bertahap, SPR KPR, SPKT) → menjadi acuan generator dokumen (`docs/v2/27_DOCGEN_SPEC.md`).

**Status:** SPEC SELESAI, implementasi belum dimulai. Fase berikutnya = **Fase 39 Fondasi Data & Wiring**.
