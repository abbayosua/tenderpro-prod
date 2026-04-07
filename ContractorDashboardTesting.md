# Contractor Dashboard Testing Document

## Overview
Dokumen ini berisi daftar lengkap fitur Contractor Dashboard beserta skenario pengujian (Happy Flow dan Sad Flow).

**Demo Account:**
- Email: `info@ptbangunpermai.co.id`
- Password: `password123`
- Role: Contractor
- Company: PT Bangun Permai Sejahtera
- Name: Ahmad Sulaiman

---

## Daftar Fitur Contractor Dashboard

### 1. Header & Navigation
- Logo dan branding TenderPro
- Chat modal untuk komunikasi
- User profile display (nama & role)
- Logout button

### 2. Statistics Cards
- Total Penawaran
- Diterima (Accepted Bids)
- Pending (Pending Bids)
- Win Rate (persentase)

### 3. Quick Actions
- Cari Proyek (navigasi ke tab/project list)
- Verifikasi Akun (buka verification modal)

### 4. Verification Alert Banner
- Alert untuk akun belum terverifikasi
- Link untuk upload dokumen verifikasi

### 5. Tab: Penawaran Saya
- List penawaran dengan status badge (Diterima/Pending/Ditolak)
- Info: nama proyek, lokasi, harga penawaran, durasi
- Batalkan Penawaran button (untuk PENDING bids)
- Empty state "Belum ada penawaran"

### 6. Tab: Portofolio
- Portfolio cards dengan gambar
- Hover reveal: Edit & Hapus buttons
- Category badge
- Info: judul, lokasi, tahun, nilai proyek
- Tambah Portofolio button
- Empty state "Belum ada portofolio"

### 7. Portfolio Modal
- Form fields:
  - Judul Proyek (wajib)
  - Deskripsi
  - Kategori (dropdown)
  - Tahun
  - Nama Klien
  - Lokasi
  - Nilai Proyek (Rp)
  - Foto Proyek (kamera)
- Camera capture untuk foto
- Image gallery dengan remove button
- Edit mode untuk portfolio existing

### 8. Bid Modal (Submit Penawaran)
- Info: Anggaran Proyek
- Form fields:
  - Proposal (textarea)
  - Harga Penawaran (Rp)
  - Durasi (hari)
- Submit button

### 9. Verification Modal
- Document type selection (KTP, NPWP, SIUP, NIB, Akta Perusahaan)
- Document name input
- Camera capture untuk foto dokumen
- Switch camera (front/back)
- List dokumen terunggah dengan status
- Ajukan Permintaan Verifikasi button

### 10. Withdraw Bid Confirmation Modal
- Konfirmasi pembatalan penawaran
- Cancel & Confirm buttons

### 11. Chat Modal
- List conversations
- Chat history
- Send message

### 12. Delete Portfolio Confirmation
- Overlay pada portfolio card
- Konfirmasi hapus dengan Batal/Hapus buttons

---

## Test Scenarios

### Feature 1: Login & Dashboard Access

#### Happy Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Buka aplikasi | Landing page ditampilkan |
| 2 | Klik "Masuk" button | Login modal muncul |
| 3 | Pilih role "Contractor" | Role terpilih |
| 4 | Masukkan email `info@ptbangunpermai.co.id` | Email terisi |
| 5 | Masukkan password `password123` | Password terisi |
| 6 | Klik "Masuk" | Login berhasil, redirect ke Contractor Dashboard |
| 7 | Verifikasi dashboard loaded | Statistics cards, tabs terlihat |

#### Sad Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Masukkan email salah | Error message "Login gagal" |
| 2 | Masukkan password salah | Error message "Login gagal" |
| 3 | Pilih role Owner (dengan kredensial contractor) | Error message "Login gagal" |

---

### Feature 2: Statistics Cards

#### Happy Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Lihat card "Total Penawaran" | Menampilkan angka total bids |
| 2 | Lihat card "Diterima" | Menampilkan angka accepted bids |
| 3 | Lihat card "Pending" | Menampilkan angka pending bids |
| 4 | Lihat card "Win Rate" | Menampilkan persentase win rate |

#### Sad Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Contractor baru tanpa bids | Semua nilai 0, Win Rate 0% |
| 2 | Network error saat fetch stats | Graceful degradation, data default ditampilkan |

---

### Feature 3: Quick Actions

#### Happy Flow - Cari Proyek
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik "Cari Proyek" button | Navigasi ke halaman/project list |

#### Happy Flow - Verifikasi Akun
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik "Verifikasi Akun" button | Verification modal terbuka |
| 2 | Lihat document types | KTP, NPWP, SIUP, NIB, Akta Perusahaan tersedia |

#### Sad Flow - Verifikasi Akun
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik Verifikasi tanpa kamera access | Error message "Tidak dapat mengakses kamera" |

---

### Feature 4: Tab Penawaran Saya

#### Happy Flow - View Bids List
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Buka tab "Penawaran Saya" | List penawaran ditampilkan |
| 2 | Lihat status badge | Badge warna hijau (Diterima), kuning (Pending), merah (Ditolak) |
| 3 | Lihat info penawaran | Nama proyek, lokasi, harga, durasi terlihat |

#### Happy Flow - Withdraw Bid
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Lihat penawaran dengan status PENDING | Badge kuning, button "Batalkan Penawaran" muncul |
| 2 | Klik "Batalkan Penawaran" | Confirmation modal muncul |
| 3 | Klik "Ya, Batalkan" | Penawaran dibatalkan, toast success |
| 4 | Refresh halaman | Penawaran tidak lagi muncul di list |

#### Sad Flow - Empty Bids
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Contractor baru tanpa penawaran | Empty state "Belum ada penawaran" ditampilkan |
| 2 | Klik "Cari Proyek" di empty state | Navigasi ke project list |

#### Sad Flow - Cancel Withdraw
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik "Batalkan Penawaran" | Confirmation modal muncul |
| 2 | Klik "Batal" | Modal tertutup, penawaran tetap ada |

---

### Feature 5: Tab Portofolio

#### Happy Flow - View Portfolio
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Buka tab "Portofolio" | Portfolio cards ditampilkan |
| 2 | Lihat portfolio card | Gambar, judul, kategori, lokasi, tahun, nilai terlihat |
| 3 | Hover pada portfolio card | Edit & Hapus buttons muncul |

#### Happy Flow - Add Portfolio
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik "Tambah Portofolio" button | Portfolio modal terbuka |
| 2 | Isi judul proyek | Field terisi |
| 3 | Isi deskripsi | Field terisi |
| 4 | Pilih kategori | Dropdown selection aktif |
| 5 | Isi tahun, lokasi, nilai | Semua field terisi |
| 6 | Klik area foto untuk ambil foto | Kamera aktif |
| 7 | Ambil foto | Foto preview muncul |
| 8 | Klik "Tambahkan" | Foto masuk ke gallery |
| 9 | Klik "Tambah Portofolio" | Toast success, modal tertutup, portfolio muncul |

#### Happy Flow - Edit Portfolio
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Hover pada portfolio card | Edit button muncul |
| 2 | Klik "Edit" | Portfolio modal terbuka dengan data existing |
| 3 | Ubah data | Field ter-update |
| 4 | Klik "Simpan Perubahan" | Toast success, data terupdate |

#### Happy Flow - Delete Portfolio
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Hover pada portfolio card | Hapus button muncul |
| 2 | Klik "Hapus" | Delete confirmation overlay muncul |
| 3 | Klik "Hapus" | Toast success, portfolio terhapus |

#### Sad Flow - Empty Portfolio
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Contractor baru tanpa portfolio | Empty state "Belum ada portofolio" ditampilkan |

#### Sad Flow - Add Portfolio Tanpa Judul
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Buka modal tambah portfolio | Modal terbuka |
| 2 | Klik "Tambah Portofolio" tanpa isi judul | Button disabled atau error "Judul portofolio wajib diisi" |

#### Sad Flow - Cancel Delete
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik "Hapus" pada portfolio | Confirmation overlay muncul |
| 2 | Klik "Batal" | Overlay hilang, portfolio tetap ada |

---

### Feature 6: Portfolio Modal - Camera

#### Happy Flow - Capture Photo
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik "Ambil Foto" button | Kamera aktif, video preview muncul |
| 2 | Klik button camera | Foto captured, preview muncul |
| 3 | Klik "Tambahkan" | Foto masuk ke gallery, kamera off |

#### Happy Flow - Multiple Photos
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Ambil foto pertama | Foto masuk ke gallery |
| 2 | Ambil foto kedua | Foto kedua masuk ke gallery |
| 3 | Lihat gallery | 2 foto terlihat dengan counter |

#### Happy Flow - Remove Photo
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Hover pada foto di gallery | X button muncul |
| 2 | Klik X | Foto terhapus dari gallery |

#### Sad Flow - Camera Permission Denied
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Block camera permission | Error message "Tidak dapat mengakses kamera" |

---

### Feature 7: Verification Modal

#### Happy Flow - Upload Document
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik "Verifikasi Akun" | Verification modal terbuka |
| 2 | Pilih jenis dokumen (KTP) | Button selected |
| 3 | Isi nama dokumen | Field terisi |
| 4 | Klik area foto | Kamera aktif |
| 5 | Ambil foto dokumen | Foto preview muncul |
| 6 | Klik "Unggah Dokumen" | Toast success, dokumen masuk ke list |

#### Happy Flow - Request Verification
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Upload minimal 1 dokumen | Dokumen muncul di list "Dokumen Terunggah" |
| 2 | Klik "Ajukan Permintaan Verifikasi" | Toast success, request terkirim |

#### Sad Flow - Upload Tanpa Nama Dokumen
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Ambil foto dokumen | Foto preview muncul |
| 2 | Biarkan nama dokumen kosong | Button "Unggah Dokumen" disabled |

#### Sad Flow - Upload Tanpa Foto
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Isi nama dokumen | Field terisi |
| 2 | Tidak ambil foto | Button "Unggah Dokumen" disabled |

---

### Feature 8: Chat Modal

#### Happy Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik message icon di header | Chat modal terbuka |
| 2 | Lihat list conversations | Percakapan dengan owner ditampilkan |
| 3 | Pilih conversation | Chat history muncul |
| 4 | Ketik pesan | Pesan terkirim, muncul di chat |

#### Sad Flow - No Conversations
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Contractor baru tanpa conversation | Empty state "Belum ada percakapan" |

---

### Feature 9: Logout

#### Happy Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik "Keluar" button | User logout |
| 2 | Verifikasi redirect | Redirect ke landing page |
| 3 | Cek auth state | User tidak terautentikasi |

---

### Feature 10: Verification Alert Banner

#### Happy Flow - Verified User
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login sebagai contractor terverifikasi | Banner tidak muncul |

#### Sad Flow - Unverified User
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login sebagai contractor belum terverifikasi | Alert banner muncul |
| 2 | Klik link di banner | Verification modal terbuka |

---

## Test Summary Checklist

| Feature | Happy Flow | Sad Flow | Status |
|---------|------------|----------|--------|
| Login & Dashboard | ✅ | ✅ | Ready |
| Statistics Cards | ✅ | ✅ | Ready |
| Quick Actions | ✅ | ✅ | Ready |
| Tab Penawaran Saya | ✅ | ✅ | Ready |
| Tab Portofolio | ✅ | ✅ | Ready |
| Portfolio Modal | ✅ | ✅ | Ready |
| Portfolio Camera | ✅ | ✅ | Ready |
| Verification Modal | ✅ | ✅ | Ready |
| Chat Modal | ✅ | ✅ | Ready |
| Logout | ✅ | - | Ready |
| Verification Alert | ✅ | ✅ | Ready |

---

## Known Issues / Bugs Found

| Issue ID | Description | Severity | Status |
|----------|-------------|----------|--------|
| - | - | - | - |

---

## Test Environment

- **Browser**: Chrome, Firefox, Safari
- **Device**: Desktop, Tablet, Mobile
- **Screen Size**: 1920x1080, 1366x768, 375x667 (mobile)

---

## Notes

1. Semua data test menggunakan seed data dari `prisma/seed.ts`
2. Demo contractor: `info@ptbangunpermai.co.id` memiliki:
   - 4 portfolio items
   - 3 penawaran (1 diterima, 1 pending untuk proyek owner)
   - 1 project aktif (Garasi dan Carport)
3. Camera feature membutuhkan HTTPS atau localhost untuk berfungsi
4. Real-time chat menggunakan polling/supabase realtime

---

## Data Test Contractor

### Demo Contractor - PT Bangun Permai Sejahtera
- **User ID**: Auto-generated
- **Email**: info@ptbangunpermai.co.id
- **Password**: password123
- **Name**: Ahmad Sulaiman
- **Company**: PT Bangun Permai Sejahtera
- **Rating**: 4.8
- **Total Projects**: 120
- **Verification Status**: VERIFIED

### Portfolio Items (4 items)
1. Rumah Mewah 2 Lantai di Kemang - Rp 3.5M
2. Renovasi Rumah Type 70 - Rp 800M
3. Pembangunan Villa di Puncak - Rp 2.5M
4. Rumah Minimalis Modern - Rp 950M

### Active Bids
1. Pembangunan Rumah 2 Lantai di Depok - PENDING - Rp 1.15M
2. Pembangunan Garasi dan Carport - ACCEPTED - Rp 195M

---

**Document Created**: 2024
**Last Updated**: 2024
**Author**: Development Team
