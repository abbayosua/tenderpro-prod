# Owner Dashboard Testing Document

## Overview
Dokumen ini berisi daftar lengkap fitur Owner Dashboard beserta skenario pengujian (Happy Flow dan Sad Flow).

**Demo Account:**
- Email: `andriansyah@gmail.com`
- Password: `password123`
- Role: Owner

---

## Daftar Fitur Owner Dashboard

### 1. Header & Navigation
- Logo dan branding TenderPro
- Notifikasi panel dengan badge unread count
- Chat modal untuk komunikasi
- User profile display
- Logout button

### 2. Statistics Cards
- Total Proyek
- Proyek Aktif
- Tender Terbuka
- Penawaran Pending
- Trend indicators (persentase perubahan)

### 3. Quick Actions
- Buat Proyek Baru
- Lihat Semua Penawaran
- Laporan (Export)
- CCTV Proyek

### 4. Charts & Analytics
- **Pie Chart**: Distribusi proyek per kategori (Pembangunan Baru, Renovasi, Komersial, Interior, Lainnya)
- **Bar Chart**: Progress bulanan (Proyek Baru vs Selesai)

### 5. Tab: Proyek Saya
- Search proyek by nama
- Filter by status (Semua, Tender Terbuka, Sedang Berjalan, Selesai)
- Project cards dengan info:
  - Kategori, Status, Budget
  - Lokasi, Jumlah Penawaran, View Count
  - Progress bar (untuk IN_PROGRESS)
  - CCTV Live badge (untuk IN_PROGRESS)
- Detail Progress modal
- CCTV Preview modal
- Penawaran terbaru list (untuk OPEN projects)
- Accept/Reject bid langsung dari project card

### 6. Tab: Penawaran Masuk
- Filter by project
- Sort by (Terbaru, Harga Terendah, Rating Tertinggi)
- Checkbox selection untuk compare (max 3)
- Compare button (muncul jika >= 2 selected)
- Bid cards dengan info:
  - Nama kontraktor & perusahaan
  - Harga penawaran
  - Durasi kerja
  - Rating & total proyek
  - Match score percentage
  - Proposal text
- Accept/Reject bid
- Add to favorites

### 7. Tab: Timeline
- List proyek IN_PROGRESS dan COMPLETED
- Progress percentage
- Estimated duration
- Detail progress button

### 8. Tab: Dokumen
- Filter by tipe dokumen (Kontrak, Gambar, Invoice, SPK, RAB)
- Filter by project
- Upload document (via webcam/foto)
- Document list dengan info:
  - Nama, tipe, ukuran file
  - Project name
  - View count & download count
  - Approval status
- View document (preview modal)
- Download document

### 9. Tab: Pembayaran
- Summary cards:
  - Total Anggaran
  - Sudah Dibayar
  - Menunggu Pembayaran
  - Sisa Anggaran
- Payment progress bar
- Payment history list:
  - Milestone name
  - Project name
  - Amount
  - Status (Dibayar/Pending)
- Export button

### 10. Tab: Favorit
- List kontraktor favorit
- Info: nama, perusahaan, rating, total proyek
- Notes dari owner
- Remove from favorites

---

## Test Scenarios

### Feature 1: Login & Dashboard Access

#### Happy Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Buka aplikasi | Landing page ditampilkan |
| 2 | Klik "Masuk" button | Login modal muncul |
| 3 | Pilih role "Owner" | Role terpilih |
| 4 | Masukkan email `andriansyah@gmail.com` | Email terisi |
| 5 | Masukkan password `password123` | Password terisi |
| 6 | Klik "Masuk" | Login berhasil, redirect ke Owner Dashboard |
| 7 | Verifikasi dashboard loaded | Statistics cards, charts, tabs terlihat |

#### Sad Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Masukkan email salah | Error message "Login gagal" |
| 2 | Masukkan password salah | Error message "Login gagal" |
| 3 | Pilih role Contractor (dengan kredensial owner) | Error message "Login gagal" |

---

### Feature 2: Statistics Cards

#### Happy Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Lihat card "Total Proyek" | Menampilkan angka 4 dengan trend "+4%" |
| 2 | Lihat card "Proyek Aktif" | Menampilkan angka 2 dengan trend "+2%" |
| 3 | Lihat card "Tender Terbuka" | Menampilkan angka 1 dengan trend "+1%" |
| 4 | Lihat card "Penawaran Pending" | Menampilkan angka 3 dengan trend "+3%" |

#### Sad Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Owner baru tanpa proyek | Semua nilai 0, trend "+0%" |
| 2 | Network error saat fetch stats | Graceful degradation, data default ditampilkan |

---

### Feature 3: Quick Actions

#### Happy Flow - Buat Proyek Baru
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik "Buat Proyek Baru" | CreateProject modal muncul |
| 2 | Isi form lengkap | Semua field terisi |
| 3 | Klik "Simpan" | Proyek berhasil dibuat, toast success |
| 4 | Refresh dashboard | Proyek baru muncul di list |

#### Sad Flow - Buat Proyek Baru
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik "Simpan" tanpa isi form | Error "Mohon lengkapi data proyek" |
| 2 | Isi budget dengan huruf | Input tidak valid/tertolak |

#### Happy Flow - CCTV Proyek
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik "CCTV Proyek" | Redirect ke proyek IN_PROGRESS pertama, CCTV modal terbuka |
| 2 | Lihat CCTV preview | Live feed / placeholder ditampilkan |

#### Sad Flow - CCTV Proyek
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik "CCTV Proyek" saat tidak ada proyek IN_PROGRESS | Toast "Tidak ada proyek yang sedang berjalan" |

---

### Feature 4: Tab Proyek Saya

#### Happy Flow - Search & Filter
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Ketik "Renovasi" di search | Hanya proyek dengan kata "Renovasi" muncul |
| 2 | Pilih filter "Tender Terbuka" | Hanya proyek OPEN muncul |
| 3 | Pilih filter "Sedang Berjalan" | Hanya proyek IN_PROGRESS muncul |
| 4 | Pilih filter "Selesai" | Hanya proyek COMPLETED muncul |
| 5 | Clear search & filter | Semua proyek ditampilkan |

#### Sad Flow - Search & Filter
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Search dengan keyword tidak ada | Empty state "Belum ada proyek" ditampilkan |

#### Happy Flow - Project Card IN_PROGRESS
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik project IN_PROGRESS | CCTV modal terbuka |
| 2 | Klik "Detail Progress" | Progress modal dengan milestones terbuka |
| 3 | Klik "Lihat CCTV" | CCTV modal terbuka |

#### Happy Flow - Project Card OPEN dengan Bids
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Scroll ke penawaran terbaru | List penawaran muncul |
| 2 | Klik "Terima" pada bid | Bid diterima, toast success |
| 3 | Klik "Tolak" pada bid | Bid ditolak, toast success |

#### Sad Flow - Project Card tanpa Bids
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Lihat proyek OPEN tanpa penawaran | Section penawaran tidak ditampilkan |

---

### Feature 5: Tab Penawaran Masuk

#### Happy Flow - Filter & Sort
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Pilih filter project tertentu | Hanya bids untuk project tersebut muncul |
| 2 | Sort "Harga Terendah" | Bids terurut dari harga terendah |
| 3 | Sort "Rating Tertinggi" | Bids terurut dari rating tertinggi |
| 4 | Sort "Terbaru" | Bids terurut dari terbaru |

#### Happy Flow - Compare Bids
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Centang bid pertama | Checkbox tercentang |
| 2 | Centang bid kedua | Checkbox tercentang |
| 3 | Lihat "Bandingkan (2)" button | Button muncul dengan count |
| 4 | Centang bid ketiga | Checkbox tercentang (max 3) |
| 5 | Centang bid keempat | Checkbox disabled, tidak bisa dipilih |
| 6 | Klik "Bandingkan" | Compare modal terbuka dengan perbandingan |
| 7 | Klik "Pilih" pada bid | Bid diterima, modal tertutup |

#### Sad Flow - Compare Bids
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Centang hanya 1 bid | Button "Bandingkan" tidak muncul |
| 2 | Buka compare modal dengan < 2 bids | Pesan "Pilih minimal 2 penawaran" |

#### Happy Flow - Add Favorite
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik heart icon pada bid card | Toast "Kontraktor ditambahkan ke favorit!" |
| 2 | Buka tab Favorit | Kontraktor baru muncul di list |

#### Sad Flow - Add Favorite
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik heart icon pada kontraktor yang sudah di favorite | Error atau tidak ada aksi duplikat |

---

### Feature 6: Tab Timeline

#### Happy Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Buka tab Timeline | List proyek IN_PROGRESS dan COMPLETED |
| 2 | Lihat progress bar | Progress 65% ditampilkan |
| 3 | Klik "Detail" | Progress modal dengan milestones terbuka |

#### Sad Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Owner baru tanpa proyek berjalan | Pesan "Tidak ada proyek yang sedang berjalan atau selesai" |

---

### Feature 7: Tab Dokumen

#### Happy Flow - Filter Documents
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Pilih filter "Kontrak" | Hanya dokumen tipe KONTRAK muncul |
| 2 | Pilih filter "Gambar Teknis" | Hanya dokumen tipe GAMBAR muncul |
| 3 | Filter by project | Hanya dokumen project tersebut muncul |

#### Happy Flow - View Document
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik "Lihat" pada dokumen | Preview modal terbuka |
| 2 | Lihat view count | Counter bertambah |
| 3 | Klik "Download" | File didownload, download count bertambah |

#### Happy Flow - Upload Document
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik "Foto & Upload" | Webcam modal terbuka |
| 2 | Ambil foto / upload file | File terupload |
| 3 | Isi nama dokumen dan tipe | Form terisi |
| 4 | Klik "Upload" | Toast "Dokumen berhasil diunggah!" |

#### Sad Flow - Upload Document
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Upload tanpa pilih project | Default ke project pertama |
| 2 | Upload tanpa isi nama | Error "Nama dokumen harus diisi" |

#### Sad Flow - Empty Documents
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Owner baru tanpa dokumen | Empty state "Belum ada dokumen" |

---

### Feature 8: Tab Pembayaran

#### Happy Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Buka tab Pembayaran | Summary cards ditampilkan |
| 2 | Lihat "Total Anggaran" | Nilai total budget semua proyek |
| 3 | Lihat "Sudah Dibayar" | Nilai total yang sudah dibayar |
| 4 | Lihat "Menunggu Pembayaran" | Nilai pending payments |
| 5 | Lihat "Sisa Anggaran" | Selisih budget - paid |
| 6 | Lihat progress bar | Persentase pembayaran |
| 7 | Scroll ke riwayat | List payments ditampilkan |
| 8 | Klik "Export" | Export modal terbuka |

#### Sad Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Owner baru tanpa pembayaran | Semua nilai Rp 0, empty state riwayat |

---

### Feature 9: Tab Favorit

#### Happy Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Buka tab Favorit | List kontraktor favorit ditampilkan |
| 2 | Lihat info kontraktor | Nama, perusahaan, rating, total proyek |
| 3 | Lihat notes | Notes dari owner ditampilkan |
| 4 | Klik trash icon | Kontraktor dihapus dari favorit |
| 5 | Konfirmasi hapus | Toast "Kontraktor dihapus dari favorit" |

#### Sad Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Owner baru tanpa favorit | Empty state "Belum ada kontraktor favorit" |

---

### Feature 10: Notifikasi

#### Happy Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik bell icon | Notification panel terbuka |
| 2 | Lihat unread badge | Jumlah notifikasi unread ditampilkan |
| 3 | Klik satu notifikasi | Notifikasi ditandai read, badge berkurang |
| 4 | Klik "Tandai Semua Dibaca" | Semua notifikasi read, badge = 0 |

#### Sad Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tidak ada notifikasi | Empty state ditampilkan |

---

### Feature 11: Chat Modal

#### Happy Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik message icon | Chat modal terbuka |
| 2 | Pilih conversation | Chat history ditampilkan |
| 3 | Ketik pesan | Pesan terkirim, muncul di chat |

#### Sad Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tidak ada conversation | Empty state "Belum ada percakapan" |

---

### Feature 12: Logout

#### Happy Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Klik "Keluar" button | User logout |
| 2 | Verifikasi redirect | Redirect ke landing page |
| 3 | Cek auth state | User tidak terautentikasi |

---

## Test Summary Checklist

| Feature | Happy Flow | Sad Flow | Status |
|---------|------------|----------|--------|
| Login & Dashboard | ✅ | ✅ | Ready |
| Statistics Cards | ✅ | ✅ | Ready |
| Quick Actions | ✅ | ✅ | Ready |
| Tab Proyek Saya | ✅ | ✅ | Ready |
| Tab Penawaran Masuk | ✅ | ✅ | Ready |
| Tab Timeline | ✅ | ✅ | Ready |
| Tab Dokumen | ✅ | ✅ | Ready |
| Tab Pembayaran | ✅ | ✅ | Ready |
| Tab Favorit | ✅ | ✅ | Ready |
| Notifikasi | ✅ | ✅ | Ready |
| Chat Modal | ✅ | ✅ | Ready |
| Logout | ✅ | - | Ready |

---

## Known Issues / Bugs Found

| Issue ID | Description | Severity | Status |
|----------|-------------|----------|--------|
| BUG-001 | CompareBidsModal crash saat bids undefined | High | **FIXED** |
| BUG-002 | ownerStats.projects filter error | High | **FIXED** |

---

## Test Environment

- **Browser**: Chrome, Firefox, Safari
- **Device**: Desktop, Tablet, Mobile
- **Screen Size**: 1920x1080, 1366x768, 375x667 (mobile)

---

## Notes

1. Semua data test menggunakan seed data dari `prisma/seed.ts`
2. Demo owner: `andriansyah@gmail.com` memiliki 4 proyek (1 OPEN, 2 IN_PROGRESS, 1 COMPLETED)
3. CCTV feature menggunakan placeholder/demo video
4. Real-time features (chat, notifikasi) menggunakan polling/supabase realtime

---

**Document Created**: 2024
**Last Updated**: 2024
**Author**: Development Team
