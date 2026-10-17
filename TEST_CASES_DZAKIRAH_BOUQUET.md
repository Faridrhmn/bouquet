# 📋 DOKUMEN MASTER TEST CASE & QA TEST SPECIFICATION
## Proyek: Dzakirah Bouquet Platform (Web & Backend API)
**Versi Dokumen:** 1.0  
**Tanggal Rilis:** 11 Oktober 2026  
**Peran QA:** Lead QA Engineer / Quality Assurance Specialist  
**Target Aplikasi:** Web Frontend (Responsive), Backend REST API (Node.js/Express), Database (PostgreSQL)

---

## 📑 DAFTAR ISI
1. [Ringkasan Eksekutif & Ruang Lingkup Pengujian](#1-ringkasan-eksekutif--ruang-lingkup-pengujian)
2. [Lingkungan Pengujian (Test Environment)](#2-lingkungan-pengujian-test-environment)
3. [Rangkuman Temuan Awal (Static Code Analysis & Bug Report)](#3-rangkuman-temuan-awal-static-code-analysis--bug-report)
4. [Matriks Matriks Test Case (Detailed Test Cases)](#4-matriks-test-case)
   - [Modul 1: Autentikasi & Keamanan Admin (AUTH)](#modul-1-autentikasi--keamanan-admin-auth)
   - [Modul 2: Katalog Produk & Manajemen Inventori (PROD)](#modul-2-katalog-produk--manajemen-inventori-prod)
   - [Modul 3: Pemesanan & Multi-Step Wizard Pelanggan (ORD)](#modul-3-pemesanan--multi-step-wizard-pelanggan-ord)
   - [Modul 4: Pelacakan Pesanan & Self-Service Pelanggan (TRK)](#modul-4-pelacakan-pesanan--self-service-pelanggan-trk)
   - [Modul 5: Dashboard Admin & Pemrosesan Pesanan (ADM)](#modul-5-dashboard-admin--pemrosesan-pesanan-adm)
   - [Modul 6: Sistem Ulasan & UGC / Social Proof (REV)](#modul-6-sistem-ulasan--ugc--social-proof-rev)
   - [Modul 7: Laporan Keuangan & Analisis Bisnis (RPT)](#modul-7-laporan-keuangan--analisis-bisnis-rpt)
   - [Modul 8: Pengaturan Toko & Multi-Rekening (SET)](#modul-8-pengaturan-toko--multi-rekening-set)
   - [Modul 9: Pengujian Non-Fungsional, Respon & UI/UX (NFT)](#modul-9-pengujian-non-fungsional-respon--uiux-nft)
5. [Panduan Eksekusi & Template Pelaporan Bug](#5-panduan-eksekusi--template-pelaporan-bug)

---

## 1. RINGKASAN EKSEKUTIF & RUANG LINGKUP PENGUJIAN

### 1.1 Tujuan
Dokumen ini dibuat sebagai panduan komprehensif bagi tim QA/Tester untuk memverifikasi fungsionalitas, keamanan, integritas data, dan kegunaan (*usability*) aplikasi **Dzakirah Bouquet**. Pengujian mencakup sisi pelanggan (*public customer web*), backend REST API, dan panel admin (*back-office dashboard*).

### 1.2 Cakupan Pengujian (In-Scope)
- **Frontend Pelanggan:** `index.html` (Homepage & Lacak Pesanan Cepat), `collection.html` (Katalog, Detail Produk, Multi-Step Order Wizard, UGC Reviews, Modal Lacak & Edit/Batal Pesanan), `services.html` (FAQ, Informasi Layanan).
- **Backend API:** Seluruh rute REST API di `server.js` (Auth, Products, Orders, Reviews, Reports, Settings).
- **Frontend Admin:** `admin.html` (Manajemen Produk, Pemrosesan Pesanan, Status Pembayaran, Unggah Foto Buket Selesai, Laporan Keuangan HPP & Laba Bersih, Manajemen Ulasan UGC, Konfigurasi Rekening & Kredensial).
- **Database PostgreSQL:** Integritas tabel `products`, `orders`, `categories`, `admin_users`, `product_reviews`, `store_settings`.

### 1.3 Tingkat Keparahan (Severity Definitions)
- **Critical (P1):** Kerusakan sistemik, kegagalan transaksi, crash server, celah keamanan fatal, atau kehilangan data.
- **High (P2):** Fitur utama tidak berfungsi atau menghasilkan data yang keliru tanpa ada solusi sementara (*workaround*).
- **Medium (P3):** Fitur berjalan tetapi ada inkonsistensi validasi, UX bermasalah, atau layout terpotong.
- **Low (P4):** Typo, ketidaksesuaian kosmetik kecil, minor styling alignment.

---

## 2. LINGKUNGAN PENGUJIAN (TEST ENVIRONMENT)

| Komponen | Spesifikasi / Konfigurasi |
| :--- | :--- |
| **Node.js Runtime** | Node.js v18.x / v20.x |
| **Database** | PostgreSQL 14+ (`dzakirah_db`) |
| **Port Server** | Default `5005` (sesuai file `.env`) atau `3000` |
| **Browser Support** | Google Chrome (Desktop & Mobile view), Mozilla Firefox, Apple Safari, Microsoft Edge |
| **Screen Resolution** | Desktop (1920x1080, 1366x768), Tablet (768x1024), Mobile (375x667, 390x844, 412x915) |
| **Kredensial Default** | Username: `admin` \| Password: `admin123` |

---

## 3. RANGKUMAN TEMUAN AWAL (STATIC CODE ANALYSIS & BUG REPORT)

Sebelum tim melakukan uji coba fungsional (*black-box*), hasil analisis kode (*white-box review*) oleh QA Specialist menemukan bug kritis yang wajib dicatat:

> ✅ **STATUS BUG KRITIS (TELAH DIPERBAIKI / RESOLVED):**
> - **Lokasi:** File [server.js](file:///home/patrick/Program/buoquet/server.js#L189) pada rute `PUT /api/auth/update-profile`.
> - **Status Perbaikan:** Telah diperbaiki dari `users` menjadi `admin_users` pada query SELECT dan UPDATE.
> - **Hasil:** Admin kini dapat memperbarui username, nama, dan kata sandi tanpa mengalami HTTP 500.

---

## 4. MATRIKS TEST CASE

### Modul 1: Autentikasi & Keamanan Admin (AUTH)

| ID Test Case | Skenario Pengujian | Langkah Pengujian (Test Steps) | Data Uji (Test Data) | Hasil yang Diharapkan (Expected Result) | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-001** | Login Admin dengan kredensial valid | 1. Buka `admin.html`<br>2. Masukkan username dan password valid<br>3. Klik tombol "Masuk ke Dashboard" | Username: `admin`<br>Password: `admin123` | Login berhasil, token JWT tersimpan di `localStorage`, dashboard utama terbuka, nama admin tampil. | **Critical** | [ ] Pass<br>[ ] Fail |
| **TC-AUTH-002** | Login Admin dengan password salah | 1. Buka `admin.html`<br>2. Masukkan username valid tapi password salah<br>3. Klik "Masuk" | Username: `admin`<br>Password: `salah123` | HTTP 401: Alert "Username atau password salah!", tidak dapat masuk, form tidak reset username. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-AUTH-003** | Login Admin dengan username tidak terdaftar | 1. Buka `admin.html`<br>2. Masukkan username fiktif<br>3. Klik "Masuk" | Username: `hacker`<br>Password: `admin123` | HTTP 401: Muncul pesan error "Username atau password salah!" (pesan generik aman). | **High** | [ ] Pass<br>[ ] Fail |
| **TC-AUTH-004** | Validasi input kosong pada form login | 1. Buka `admin.html`<br>2. Kosongkan username dan password<br>3. Klik "Masuk" | Username: ` ` (spasi)<br>Password: ` ` | Validasi form HTML5 `required` aktif dan API merespon HTTP 400 jika lolos bypass. | **Medium** | [ ] Pass<br>[ ] Fail |
| **TC-AUTH-005** | Akses rute terproteksi API tanpa Token JWT | 1. Kirim request HTTP GET ke `/api/orders` atau `/api/admin/reports` tanpa header `Authorization` | Header Authorization: None | HTTP 401: Response JSON `{ success: false, message: "Akses ditolak. Token autentikasi tidak ditemukan." }`. | **Critical** | [ ] Pass<br>[ ] Fail |
| **TC-AUTH-006** | Akses rute terproteksi dengan token kadaluwarsa/palsu | 1. Kirim request HTTP GET `/api/orders` dengan header `Bearer token_ngawur_123` | Header Authorization: `Bearer eyJ...invalid` | HTTP 403: Response `{ success: false, message: "Token tidak valid atau telah kedaluwarsa." }`. | **Critical** | [ ] Pass<br>[ ] Fail |
| **TC-AUTH-007** | Logout Admin | 1. Dalam kondisi login di `admin.html`<br>2. Klik tombol "Logout" di header | User klik "Logout" | Token JWT dihapus dari `localStorage`, layar kembali ke halaman login, riwayat sesi bersih. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-AUTH-008** | Update Profil & Kredensial Login Admin (Verifikasi Bug Temuan QA) | 1. Buka tab "Pengaturan"<br>2. Masukkan password lama dan password baru<br>3. Klik "Perbarui Profil & Password" | Username: `admin_baru`<br>Password Lama: `admin123`<br>Password Baru: `newpass456` | Verifikasi apakah API gagal karena tabel `users` (Bug) atau berhasil update ke `admin_users`. | **Critical** | [ ] Pass<br>[ ] Fail |

---

### Modul 2: Katalog Produk & Manajemen Inventori (PROD)

| ID Test Case | Skenario Pengujian | Langkah Pengujian (Test Steps) | Data Uji (Test Data) | Hasil yang Diharapkan (Expected Result) | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-PROD-001** | Menampilkan katalog produk di halaman publik | 1. Buka `collection.html`<br>2. Perhatikan kartu-kartu produk | Data produk dari PostgreSQL | Seluruh produk aktif muncul lengkap dengan foto, nama, badge, harga berformat Rupiah, dan stok. | **Critical** | [ ] Pass<br>[ ] Fail |
| **TC-PROD-002** | Filter produk berdasarkan kategori | 1. Buka `collection.html`<br>2. Klik tombol kategori tab (misal: "Bunga Artificial", "Snack & Uang", "Wisuda & Boneka") | Kategori: `artificial`, `snack-money`, `graduation` | Grid produk hanya menampilkan item sesuai kategori slug yang dipilih secara instan tanpa reload. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-PROD-003** | Auto-filter via URL Query Parameter | 1. Buka URL: `collection.html?category=graduation` | Query Param `?category=graduation` | Kategori "Wisuda & Boneka" otomatis aktif (*active class*) dan produk terfilter otomatis. | **Medium** | [ ] Pass<br>[ ] Fail |
| **TC-PROD-004** | Membuka modal detail produk | 1. Klik pada gambar atau judul produk di kartu buket | Produk ID tertentu | Modal detail terbuka menampilkan foto resolusi besar, nama, harga, estimasi dimensi (tinggi x lebar), bahan, dan rating ulasan. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-PROD-005** | Tampilan produk yang kehabisan stok (*Out of Stock*) | 1. Set stok suatu produk menjadi 0 via admin/database<br>2. Refresh `collection.html` | Produk dengan `stock_quantity = 0` | Badge berubah merah "Stok Habis", tombol "Pesan" menjadi disabled (opacity 0.6, cursor not-allowed). | **High** | [ ] Pass<br>[ ] Fail |
| **TC-PROD-006** | Admin: Tambah produk baru dengan upload gambar | 1. Login ke `admin.html`<br>2. Klik "+ Tambah Produk"<br>3. Isi nama, kategori, harga jual, HPP, stok, pilih file gambar (JPG/PNG)<br>4. Simpan | Nama: `Buket Lily Pink`<br>Harga: `75000`<br>HPP: `45000`<br>Stok: `15`<br>File: `foto.jpg` | Gambar otomatis dikonversi menjadi format WebP berkualitas tinggi di folder `uploads/products/`, data tersimpan di DB, tabel ter-refresh. | **Critical** | [ ] Pass<br>[ ] Fail |
| **TC-PROD-007** | Admin: Validasi input harga negatif atau non-numerik | 1. Buka modal tambah produk<br>2. Masukkan harga minus (cth: `-50000`) atau string | Harga: `-50000` | Sistem menolak input (validasi browser / DB constraint `price >= 0` aktif). | **High** | [ ] Pass<br>[ ] Fail |
| **TC-PROD-008** | Admin: Edit data produk dan stok | 1. Klik ikon pensil/edit pada baris produk<br>2. Ubah harga dari `65000` menjadi `70000` dan stok dari `10` ke `20`<br>3. Klik "Simpan Perubahan" | Harga baru: `70000`<br>Stok baru: `20` | Data berhasil terupdate, alert sukses muncul, tabel produk menampilkan harga & stok terbaru. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-PROD-009** | Admin: Toggle status aktif/non-aktif produk | 1. Klik switch toggle "Aktif/Nonaktif" pada produk | Switch toggle diklik | Request `PUT /api/products/:id` dengan `{ is_active: false }`. Produk seketika hilang dari katalog publik `collection.html`. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-PROD-010** | Admin: Hapus produk | 1. Klik ikon tempat sampah pada baris produk<br>2. Klik "OK" pada dialog konfirmasi | Konfirmasi Delete | Produk terhapus dari database, baris hilang dari tabel, alert konfirmasi muncul. | **Medium** | [ ] Pass<br>[ ] Fail |
| **TC-PROD-011** | Deep-Linking dari Kisaran Harga Transparan `services.html` | 1. Buka `services.html`<br>2. Klik salah satu tombol paket (Pilih Paket Hemat / Favorit / Wisuda) | `tier=mini&max_price=40000`, `tier=medium...`, `tier=jumbo...` | Browser dialihkan ke `collection.html`, auto-smooth scroll ke katalog, chip budget aktif sesuai paket, banner konteks muncul, dan produk tersaring sesuai harga. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-PROD-012** | Filter Berbasis Budget Chips di Katalog | 1. Buka `collection.html`<br>2. Klik chip "💰 Hemat (≤ 40rb)"<br>3. Klik chip "⭐ Favorit (40k - 65k)"<br>4. Klik chip "🎓 Jumbo (65k+)" | Interaksi chip budget | Kartu produk tersaring instan tanpa reload browser sesuai batasan continuous range. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-PROD-013** | Multi-Filter Kombinasi (Kategori + Budget) | 1. Pilih kategori "🌸 Bunga Artificial"<br>2. Pilih budget "⭐ Favorit (40k - 65k)" | Kategori: `artificial`, Tier: `medium` | Hanya menampilkan buket bunga artificial yang berada di rentang harga Rp 40.001 - Rp 65.000. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-PROD-014** | Context Active Filter Banner & 1-Click Reset | 1. Filter aktif pada salah satu paket atau kategori<br>2. Perhatikan banner alert di atas grid<br>3. Klik tombol "✕ Reset Filter" | Tombol Reset Filter | Banner menampilkan keterangan filter & jumlah buket. Tombol reset mengembalikan katalog ke "Semua Koleksi" dan URL dibersihkan tanpa reload. | **Medium** | [ ] Pass<br>[ ] Fail |
| **TC-PROD-015** | Sortir Produk (Harga & Rating) | 1. Pada toolbar katalog, ubah dropdown sortir ke "Harga: Rendah ke Tinggi", lalu "Harga: Tinggi ke Rendah", lalu "Rating Tertinggi" | Opsi sort select | Urutan kartu produk berubah seketika sesuai kriteria sortir yang dipilih. | **Medium** | [ ] Pass<br>[ ] Fail |
| **TC-PROD-016** | Zero-Result Rescue State & Direct WA Consultation | 1. Pilih kombinasi filter yang menghasilkan 0 produk (misal: Wisuda + Hemat)<br>2. Perhatikan tampilan grid | 0 hasil pencarian | Tampil kartu "Buket Belum Ditemukan" ramah pelanggan dengan tombol "Lihat Semua Koleksi" dan CTA "💬 Tanya Custom via WhatsApp". | **High** | [ ] Pass<br>[ ] Fail |

---

### Modul 3: Pemesanan & Multi-Step Wizard Pelanggan (ORD)

| ID Test Case | Skenario Pengujian | Langkah Pengujian (Test Steps) | Data Uji (Test Data) | Hasil yang Diharapkan (Expected Result) | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ORD-001** | Buka Wizard Pemesanan dari Kartu Produk | 1. Klik tombol "💐 Pesan" pada kartu produk | Produk ID tertentu | Modal pesanan terbuka di Langkah 1 dengan produk tersebut sudah otomatis terpilih di dropdown. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-ORD-002** | Validasi Tanggal Pemakaian (Langkah 1) | 1. Coba pilih tanggal kemarin / masa lalu<br>2. Coba klik tombol "Lanjut ke Kustomisasi" tanpa mengisi tanggal | Tanggal kemarin / Tanggal kosong | Input `min` mencegah pemilihan tanggal masa lalu. Alert peringatan muncul jika tanggal kosong. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-ORD-003** | Peringatan Pesanan Hari H / H-1 (*Same Day Alert*) | 1. Pilih tanggal pemakaian sama dengan hari ini atau besok (H-1) | Tanggal = Today / Today+1 | Kotak peringatan kuning muncul: "⚠️ Pesanan Mendesak (H-1 / Hari H) - Slot terbatas...". | **Medium** | [ ] Pass<br>[ ] Fail |
| **TC-ORD-004** | Kustomisasi Warna Wrap & Kartu Ucapan Cepat (Langkah 2) | 1. Pilih warna wrapping (cth: "Black Gold Luxury")<br>2. Klik salah satu template kartu ucapan (Wisuda / Ultah / Romantis / Semangat) | Template: "Wisuda" | Textarea pesan otomatis terisi template ucapan wisuda formal & emotikon, user dapat mengedit kembali. | **Medium** | [ ] Pass<br>[ ] Fail |
| **TC-ORD-005** | Kalkulasi Real-Time Tambahan Add-On (Langkah 2) | 1. Perhatikan total harga awal<br>2. Centang "Lampu LED Fairy Lights (+Rp 10.000)"<br>3. Centang "Semprot Parfum (+Rp 5.000)" | Add-on LED + Parfum | Total harga bertambah seketika secara live (+Rp 15.000) pada teks tampilan ringkasan harga. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-ORD-006** | Validasi Data Pemesan (Langkah 3) | 1. Kosongkan Nama Pemesan<br>2. Isi Nomor HP kurang dari 8 digit (cth: `123`)<br>3. Coba klik lanjut | Nama: Kosong<br>HP: `123` | Muncul validasi "Harap isi nama lengkap pemesan!" dan "Harap masukkan nomor WhatsApp aktif yang valid!". | **High** | [ ] Pass<br>[ ] Fail |
| **TC-ORD-007** | Normalisasi Nomor Telepon WhatsApp | 1. Masukkan nomor WhatsApp dalam format `0812-3456-7890` atau `+62812...`<br>2. Submit pesanan | Input: `081234567890` | Fungsi `sanitizePhoneNumber` mengubah format ke standar internasional `6281234567890` tanpa karakter non-angka. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-ORD-008** | Pengurangan Stok Otomatis saat Pesanan Terbuat | 1. Catat stok produk A (misal 5 unit)<br>2. Buat pesanan produk A sampai berhasil<br>3. Cek kembali stok produk A di database/admin | Produk A (Stok awal = 5) | Stok produk A berkurang menjadi 4 unit secara otomatis di database PostgreSQL. | **Critical** | [ ] Pass<br>[ ] Fail |
| **TC-ORD-009** | Pencegahan Race Condition / Pesanan Saat Stok Habis | 1. Buat pesanan untuk produk yang stoknya 0 lewat manipulasi request API | `product_id` dengan stok 0 | Backend merespon HTTP 400: "Stok untuk produk ... sedang habis!", pesanan ditolak. | **Critical** | [ ] Pass<br>[ ] Fail |
| **TC-ORD-010** | Format Kode Pesanan Unik | 1. Submit pesanan | Data pemesan lengkap | Kode pesanan terbentuk dengan format `DZK-YYYYMMDD-XXXX` (cth: `DZK-20261011-8492`) dan berstatus awal `Pending`. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-ORD-011** | Redirection ke WhatsApp dengan Pesan Terstruktur | 1. Selesaikan submit pemesanan di Langkah 3 | Tombol "Pesan Sekarang via WhatsApp" | Browser membuka tab baru `https://wa.me/62...` berisi teks chat rapi mencantumkan Kode Order, nama buket, tanggal pakai, rincian add-on, isi kartu ucapan, dan nominal tagihan. | **High** | [ ] Pass<br>[ ] Fail |

---

### Modul 4: Pelacakan Pesanan & Self-Service Pelanggan (TRK)

| ID Test Case | Skenario Pengujian | Langkah Pengujian (Test Steps) | Data Uji (Test Data) | Hasil yang Diharapkan (Expected Result) | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-TRK-001** | Lacak Pesanan dengan Kode Valid | 1. Buka fitur "Lacak Pesanan" di `index.html` atau `collection.html`<br>2. Masukkan kode order valid (cth: `DZK-20261011-1234`)<br>3. Klik "Lacak" | Kode Order valid | Data detail pesanan tampil: timeline status (Pending/Diproses/Selesai), status pembayaran, rincian produk, dan instruksi bayar. | **Critical** | [ ] Pass<br>[ ] Fail |
| **TC-TRK-002** | Lacak Pesanan dengan Kode Tidak Ditemukan | 1. Masukkan kode order asal (cth: `DZK-99999999-0000`)<br>2. Klik "Lacak" | Kode palsu | Kotak error merah muncul: "Kode pesanan tidak ditemukan. Periksa kembali kode Anda." | **Medium** | [ ] Pass<br>[ ] Fail |
| **TC-TRK-003** | Visualisasi Timeline Status Pesanan | 1. Lacak pesanan berstatus `Diproses`<br>2. Perhatikan stepper timeline | Status: `Diproses` | Step 'Pending' dan 'Diproses' berwarna hijau/aktif, step 'Selesai' dan 'Siap Ambil' masih abu-abu. | **Medium** | [ ] Pass<br>[ ] Fail |
| **TC-TRK-004** | Pelanggan Unggah Bukti Pembayaran (*Payment Proof*) | 1. Pada kotak pelacakan pesanan, pilih file struk transfer (JPG/PNG)<br>2. Klik "Kirim Bukti Bayar" | File gambar `struk.jpg` | File tersimpan di `uploads/proofs/` sebagai WebP, kolom `payment_proof_url` terisi di DB, status update di layar pelacakan. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-TRK-005** | Validasi Jenis File pada Bukti Pembayaran | 1. Coba unggah file selain gambar (cth: `document.pdf` atau `script.sh`) | File non-gambar | Multer menolak upload dengan error "Hanya file gambar (JPG, PNG, WebP) yang diperbolehkan!". | **High** | [ ] Pass<br>[ ] Fail |
| **TC-TRK-006** | Self-Service Edit Pesanan saat status `Pending` | 1. Lacak pesanan status `Pending`<br>2. Klik "✏️ Edit Pesanan Mandiri"<br>3. Masukkan nomor HP verifikasi dan ubah warna wrap / ucapan<br>4. Klik Simpan | No HP cocok, data perubahan | Data pesanan berhasil diperbarui di database tanpa perlu campur tangan admin. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-TRK-007** | Proteksi Edit Pesanan jika Nomor HP tidak cocok | 1. Buka modal edit pesanan<br>2. Masukkan nomor HP yang berbeda dengan nomor pemesan<br>3. Klik Simpan | No HP: `0899999999` (salah) | Sistem menolak dengan pesan "Nomor HP tidak cocok dengan data pemesan." | **High** | [ ] Pass<br>[ ] Fail |
| **TC-TRK-008** | Larangan Edit Pesanan Mandiri jika status `Diproses` / `Selesai` | 1. Coba lakukan request edit ke pesanan yang statusnya sudah `Diproses` | Status: `Diproses` | Tombol edit tersembunyi; jika ditembak via API, respon HTTP 400: "Pesanan berstatus Diproses tidak dapat diedit secara mandiri...". | **High** | [ ] Pass<br>[ ] Fail |
| **TC-TRK-009** | Self-Service Pembatalan Pesanan saat `Pending` | 1. Lacak pesanan status `Pending`<br>2. Klik "❌ Batalkan Pesanan"<br>3. Konfirmasi nomor HP | No HP pemesan valid | Status pesanan berubah menjadi `Batal`, notifikasi sukses muncul, timeline berubah status batal. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-TRK-010** | Cetak / Print Invoice Pesanan | 1. Pada hasil pelacakan pesanan, klik tombol "🖨️ Cetak Invoice Resmi" | Klik Cetak Invoice | Tab baru terbuka menampilkan struk invoice formal Dzakirah Bouquet lengkap dengan rincian biaya, dan dialog print browser terbuka. | **Medium** | [ ] Pass<br>[ ] Fail |

---

### Modul 5: Dashboard Admin & Pemrosesan Pesanan (ADM)

| ID Test Case | Skenario Pengujian | Langkah Pengujian (Test Steps) | Data Uji (Test Data) | Hasil yang Diharapkan (Expected Result) | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ADM-001** | Menampilkan Riwayat & Daftar Pesanan | 1. Buka tab "Pesanan Masuk" di `admin.html` | Data dari `GET /api/orders` | Seluruh pesanan muncul berurutan dari yang terbaru, menampilkan kode order, nama pemesan, no WA, tanggal pakai, total, status bayar, dan status pengerjaan. | **Critical** | [ ] Pass<br>[ ] Fail |
| **TC-ADM-002** | Filter Pesanan Berdasarkan Tanggal Pakai | 1. Klik tombol filter "Semua"<br>2. Klik tombol filter "Hari Ini"<br>3. Klik tombol filter "Besok" | Filter date buttons | Tabel menyaring baris pesanan hanya yang tanggal pakainya sesuai dengan hari ini atau besok untuk prioritas florist. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-ADM-003** | Update Status Pengerjaan Pesanan (*Dropdown Action*) | 1. Pada baris pesanan, ubah status dari `Pending` ke `Diproses`<br>2. Kemudian ubah ke `Selesai` | Nilai status: `Diproses`, `Selesai` | API `PATCH /api/orders/:id/status` dipanggil, status di database berubah, warna badge di tabel langsung berubah. | **Critical** | [ ] Pass<br>[ ] Fail |
| **TC-ADM-004** | Update Status Pembayaran (*Unpaid / Paid / Refunded*) | 1. Ubah dropdown status bayar dari `Unpaid` menjadi `Paid` | Nilai: `Paid` | API `PATCH /api/orders/:id/payment-status` dipanggil, status terupdate, omset lunas di laporan keuangan otomatis bertambah. | **Critical** | [ ] Pass<br>[ ] Fail |
| **TC-ADM-005** | Admin Mengecek Bukti Transfer Pelanggan | 1. Klik tombol "📷 Cek Bukti" pada pesanan yang sudah unggah struk | Tombol Cek Bukti | Modal gambar bukti pembayaran muncul dalam ukuran jelas untuk verifikasi mutasi rekening. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-ADM-006** | Admin Mengunggah Foto Buket Selesai (*Completion Photo*) | 1. Klik tombol "🌸 Foto" pada baris pesanan<br>2. Pilih foto hasil buket asli yang sudah dirangkai<br>3. Klik "Unggah Hasil Jadi" | File `hasil_buket.jpg` | Foto disimpan di `uploads/completions/` (WebP), link tercatat di kolom `completion_photo_url`, foto dapat dilihat pelanggan di halaman lacak pesanan. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-ADM-007** | Kirim Notifikasi Status via WhatsApp Otomatis | 1. Klik tombol "WA" pada baris pesanan berstatus `Selesai` | Klik tombol WA | Membuka WhatsApp Web/App ke nomor pelanggan dengan template pesan ramah: "Buket pesanan Anda (#DZK-...) sudah SELESAI dirangkai dan siap diambil!". | **High** | [ ] Pass<br>[ ] Fail |
| **TC-ADM-008** | Melihat Rincian Kartu Ucapan Pemesan | 1. Klik ikon amplop pada baris pesanan | Ikon Amplop | Modal muncul menampilkan To, From, dan pesan ucapan pemesan untuk dicetak/ditulis tangan oleh florist. | **Medium** | [ ] Pass<br>[ ] Fail |
| **TC-ADM-009** | Export Data Pesanan ke CSV / Excel | 1. Klik tombol "📥 Download Rekap CSV" | Klik tombol export | File `Rekap_Pesanan_Dzakirah_YYYY-MM-DD.csv` terunduh otomatis, data dapat dibuka di Excel dengan kolom lengkap dan rapi. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-ADM-010** | Hapus Log Pesanan | 1. Klik ikon hapus (tempat sampah) pada baris pesanan<br>2. Konfirmasi penghapusan | Konfirmasi OK | Baris pesanan terhapus permanen dari tabel dan database. | **Medium** | [ ] Pass<br>[ ] Fail |

---

### Modul 6: Sistem Ulasan & UGC / Social Proof (REV)

| ID Test Case | Skenario Pengujian | Langkah Pengujian (Test Steps) | Data Uji (Test Data) | Hasil yang Diharapkan (Expected Result) | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-REV-001** | Pelanggan Memberi Ulasan & Rating Bintang | 1. Buka modal ulasan pada produk di `collection.html`<br>2. Isi nama pemesan, rating bintang (1-5), komentar, dan foto buket asli<br>3. Klik "Kirim Ulasan" | Nama: `Rina`<br>Rating: `5`<br>Komentar: `Bunganya sangat wangi dan rapi!`<br>File: `foto_testimoni.jpg` | Ulasan berhasil dikirim, foto tersimpan di `uploads/reviews/`, ulasan langsung tampil di daftar testimoni produk. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-REV-002** | Validasi Input Wajib pada Form Ulasan | 1. Kosongkan nama pemesan<br>2. Coba kirim ulasan | Nama: Kosong | Muncul alert: "Produk, nama pemesan, dan rating bintang wajib diisi!". | **Medium** | [ ] Pass<br>[ ] Fail |
| **TC-REV-003** | Rekalkulasi Rata-rata Rating (*Average Rating*) | 1. Kirim ulasan baru dengan rating 3 bintang pada produk yang memiliki rating 5<br>2. Cek nilai rating di kartu produk | Nilai rating baru | Nilai rata-rata rating produk ter-update dihitung secara desimal (cth: `4.5` dari total ulasan). | **High** | [ ] Pass<br>[ ] Fail |
| **TC-REV-004** | Admin Melihat Seluruh Ulasan Pelanggan | 1. Buka tab "Ulasan UGC" di `admin.html` | Tab Ulasan UGC | Tabel menampilkan semua ulasan pelanggan lintas produk beserta foto, bintang, komentar, dan nama produk terkait. | **Medium** | [ ] Pass<br>[ ] Fail |
| **TC-REV-005** | Admin Menghapus Ulasan Palsu / Spam | 1. Klik tombol "Hapus" pada ulasan yang tidak pantas<br>2. Konfirmasi penghapusan | Konfirmasi Hapus | Ulasan terhapus dari database, tidak lagi tampil di halaman publik produk. | **Medium** | [ ] Pass<br>[ ] Fail |

---

### Modul 7: Laporan Keuangan & Analisis Bisnis (RPT)

| ID Test Case | Skenario Pengujian | Langkah Pengujian (Test Steps) | Data Uji (Test Data) | Hasil yang Diharapkan (Expected Result) | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-RPT-001** | Kalkulasi Omset Kotor (*Gross Sales*) | 1. Buka tab "Laporan Keuangan" di `admin.html`<br>2. Bandingkan angka Omset Kotor dengan total harga pesanan | Seluruh pesanan yang statusnya BUKAN `Batal` | Total omset kotor menjumlahkan `total_price` semua pesanan sah, pesanan `Batal` tidak dihitung. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-RPT-002** | Kalkulasi Omset Lunas (*Paid Revenue*) | 1. Perhatikan kartu "Omset Lunas Masuk" | Pesanan dengan `payment_status = 'Paid'` | Menjumlahkan hanya pesanan yang status pembayarannya sudah `Paid`. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-RPT-003** | Estimasi HPP dan Laba Bersih | 1. Perhatikan angka Estimasi HPP (Modal 55%) dan Estimasi Laba Bersih (45%) | Formula perhitungan sistem | Perhitungan konsisten: Estimasi HPP = 55% dari Omset, Laba Bersih = Omset Kotor - Estimasi HPP. | **Medium** | [ ] Pass<br>[ ] Fail |
| **TC-RPT-004** | Deteksi Otomatis Produk Menipis (*Low Stock Alert*) | 1. Buat stok suatu produk bernilai di bawah 5 unit (misal: 3 unit)<br>2. Refresh tab Laporan Keuangan | Produk dengan `stock_quantity < 5` | Produk tersebut muncul pada tabel peringatan "Peringatan Stok Menipis" dengan badge merah. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-RPT-005** | Fitur Restok Instan (*Quick Restock +5*) | 1. Pada tabel peringatan stok menipis, klik tombol "+ Restok (+5)" | Klik tombol restok | Stok produk seketika bertambah 5 unit via API `PUT /api/products/:id`, jika stok sudah $\ge 5$ produk hilang dari tabel peringatan. | **High** | [ ] Pass<br>[ ] Fail |

---

### Modul 8: Pengaturan Toko & Multi-Rekening (SET)

| ID Test Case | Skenario Pengujian | Langkah Pengujian (Test Steps) | Data Uji (Test Data) | Hasil yang Diharapkan (Expected Result) | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-SET-001** | Admin Mengubah Nomor WhatsApp Toko | 1. Buka tab "Pengaturan" di `admin.html`<br>2. Ubah nomor WhatsApp toko<br>3. Klik "Simpan Pengaturan Toko" | No WA baru: `081298765432` | Data tersimpan di tabel `store_settings`, tombol konsultasi WA di publik mengarah ke nomor baru. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-SET-002** | Update Rekening Multi-Bank (BCA, Mandiri, BRI, BNI) | 1. Isi nomor rekening baru untuk BCA, Mandiri, BRI, dan BNI serta nama pemilik rekening<br>2. Simpan pengaturan | No Rekening & Nama Pemilik | Pengaturan tersimpan sukses via API `PUT /api/settings`. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-SET-003** | Sinkronisasi Rekening ke Halaman Pelanggan | 1. Buka `collection.html`<br>2. Lacak pesanan dengan metode transfer bank | Pengaturan toko publik | Nomor rekening dan nama pemilik rekening yang tampil di modal pelacakan sesuai dengan yang disetting admin. | **High** | [ ] Pass<br>[ ] Fail |

---

### Modul 9: Pengujian Non-Fungsional, Respon & UI/UX (NFT)

| ID Test Case | Skenario Pengujian | Langkah Pengujian (Test Steps) | Data Uji (Test Data) | Hasil yang Diharapkan (Expected Result) | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-NFT-001** | Uji Tampilan Responsif Smartphone (*Mobile View*) | 1. Buka `collection.html` dan `admin.html` pada layar 375px (iPhone SE) dan 390px (iPhone 12/13/14/15)<br>2. Uji alur wizard pemesanan | Resolusi mobile | Tidak ada elemen horizontal overflow (*scroll bocor ke kanan*), tombol order mudah ditekan (*touch target* $\ge 44px$), modal muat di layar. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-NFT-002** | Ketahanan Terhadap Serangan XSS (*Cross-Site Scripting*) | 1. Masukkan payload `<script>alert('XSS')</script>` pada Nama Pemesan, Catatan Kartu Ucapan, atau Komentar Ulasan<br>2. Submit dan lihat tampilan di admin & publik | Payload `<script>alert('XSS')</script>` | Skrip tidak dieksekusi. Fungsi `escapeHTML` menetralkan tag HTML menjadi entitas teks aman (`&lt;script&gt;...`). | **Critical** | [ ] Pass<br>[ ] Fail |
| **TC-NFT-003** | Optimasi Kompresi Gambar (*Sharp Image Optimization*) | 1. Unggah foto buket ukuran 8MB (format JPG/PNG mentah)<br>2. Periksa file yang tersimpan di server | File gambar 8MB | Gambar otomatis di-resize (maksimal 1200x1200px) dan dikonversi ke WebP kualitas 80% dengan ukuran hemat (biasanya < 300KB), menghemat bandwidth. | **High** | [ ] Pass<br>[ ] Fail |
| **TC-NFT-004** | Uji Ketahanan Terhadap SQL Injection | 1. Pada input pencarian produk atau lacak pesanan, masukkan payload `' OR '1'='1` | Payload `' OR '1'='1` | Query menggunakan parameterized queries PostgreSQL (`$1`, `$2`), tidak terjadi error sintaks SQL atau pembocoran data. | **Critical** | [ ] Pass<br>[ ] Fail |
| **TC-NFT-005** | Penanganan Pemutusan Database (*Database Disconnect Resilience*) | 1. Matikan service PostgreSQL sementara<br>2. Akses halaman aplikasi | Database Down | Server tidak langsung crash; endpoint merespon dengan status HTTP 500 dan pesan error yang terisolasi dengan log console. | **Medium** | [ ] Pass<br>[ ] Fail |

---

## 5. PANDUAN EKSEKUSI & TEMPLATE PELAPORAN BUG

### 5.1 Langkah Memulai Pengujian Lokal Bagi Tim QA
1. **Pastikan Environment Siap:**
   ```bash
   # Masuk ke direktori proyek
   cd /home/patrick/Program/buoquet
   
   # Cek dependensi
   npm install
   
   # Pastikan database PostgreSQL menyala dan migrasi up to date
   npm run db:migrate
   
   # Jalankan server
   npm run dev
   # atau
   npm start
   ```
2. **Akses URL Pengujian:**
   - Halaman Utama (Homepage): `http://localhost:5005/index.html`
   - Katalog & Pemesanan: `http://localhost:5005/collection.html`
   - Layanan & FAQ: `http://localhost:5005/services.html`
   - Panel Admin: `http://localhost:5005/admin.html`
3. **Eksekusi:** Centang checkbox `[ ] Pass` atau `[ ] Fail` pada setiap Test Case di atas setelah pengujian selesai.

---

### 5.2 Format Standar Pelaporan Bug (Bug Report Template)
Jika tim menemukan deviasi atau kegagalan saat pengujian, laporkan menggunakan format standar berikut:

```markdown
### 🐞 [BUG REPORT] - <Judul Singkat Masalah>

- **ID Test Case:** TC-XXX-XXX
- **Tingkat Keparahan (Severity):** Critical / High / Medium / Low
- **Prioritas:** P1 / P2 / P3 / P4
- **Modul / Halaman Terkait:** (Contoh: Admin - Tab Pengaturan)
- **URL & Endpoint:** PUT /api/auth/update-profile
- **Device / Browser:** Chrome 129 Desktop (Ubuntu 24.04)

**Langkah Mereproduksi Masalah (Steps to Reproduce):**
1. Buka halaman admin.html dan login sebagai admin.
2. Masuk ke tab "Pengaturan".
3. Isi password lama dan password baru, lalu klik "Perbarui Profil & Password".

**Hasil Aktual (Actual Result):**
Muncul pesan error "Terjadi kesalahan server saat memperbarui profil admin", status HTTP 500. Di console server terdapat pesan: error: relation "users" does not exist.

**Hasil yang Diharapkan (Expected Result):**
Kredensial berhasil diperbarui dan query diarahkan ke tabel `admin_users`.

**Tangkapan Layar / Bukti (Log):**
[Lampirkan screenshot atau potongan log error terminal]
```

---
*Dokumen ini disusun secara profesional oleh Lead QA Engineer untuk memastikan kualitas, keandalan, dan kesiapan operasional platform Dzakirah Bouquet.*
