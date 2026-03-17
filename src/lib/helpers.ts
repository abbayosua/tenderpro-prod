// Utility helper functions for TenderPro

import { Contractor } from '@/types';

/**
 * Format currency to Indonesian Rupiah
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate match score between contractor and project
 */
export function calculateMatchScore(
  contractor: Contractor | null,
  projectCategory: string,
  projectBudget: number
): number {
  if (!contractor || !contractor.company) return 50;

  let score = 50; // Base score

  // Category match
  if (contractor.company.specialization?.toLowerCase().includes(projectCategory.toLowerCase())) {
    score += 20;
  }

  // Experience bonus
  if (contractor.company.experienceYears >= 5) score += 10;
  if (contractor.company.experienceYears >= 10) score += 5;

  // Rating bonus
  if (contractor.company.rating >= 4.5) score += 10;
  if (contractor.company.rating >= 4.8) score += 5;

  // Completed projects bonus
  if (contractor.company.completedProjects >= 10) score += 5;
  if (contractor.company.completedProjects >= 50) score += 5;

  // Verification bonus
  if (contractor.verificationStatus === 'VERIFIED') score += 10;

  return Math.min(score, 100); // Cap at 100
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  };
  return new Date(date).toLocaleDateString('id-ID', defaultOptions);
}

/**
 * Format date time to Indonesian locale
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status badge color class
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'bg-primary';
    case 'IN_PROGRESS':
      return 'bg-blue-600';
    case 'COMPLETED':
      return 'bg-green-600';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700';
    case 'ACCEPTED':
      return 'bg-primary';
    case 'REJECTED':
      return 'bg-red-100 text-red-700';
    default:
      return '';
  }
}

/**
 * Get status label in Indonesian
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'Tender Terbuka';
    case 'IN_PROGRESS':
      return 'Sedang Berjalan';
    case 'COMPLETED':
      return 'Selesai';
    case 'PENDING':
      return 'Pending';
    case 'ACCEPTED':
      return 'Diterima';
    case 'REJECTED':
      return 'Ditolak';
    default:
      return status;
  }
}

/**
 * Mock data for testimonials
 */
export const testimonialData = [
  {
    name: 'Budi Santoso',
    role: 'Pemilik Proyek',
    company: 'PT Maju Bersama',
    avatar: 'https://loremflickr.com/g/100/100/face,man/all',
    rating: 5,
    text: 'Platform yang sangat membantu! Saya berhasil menemukan kontraktor untuk proyek renovasi kantor dengan harga yang kompetitif dan hasil memuaskan.',
  },
  {
    name: 'Dewi Kartika',
    role: 'Kontraktor',
    company: 'PT Konstrukindo Jaya',
    avatar: 'https://loremflickr.com/g/100/100/face,woman/all',
    rating: 5,
    text: 'Sejak bergabung dengan TenderPro, perusahaan saya mendapatkan akses ke proyek-proyek berkualitas. Proses tender sangat transparan.',
  },
  {
    name: 'Ahmad Wijaya',
    role: 'Pemilik Proyek',
    company: 'Perumahan Griya Asri',
    avatar: 'https://loremflickr.com/g/100/100/face,man/all',
    rating: 5,
    text: 'Kontraktor yang saya dapatkan sangat profesional. Proyek pembangunan rumah selesai tepat waktu dengan kualitas yang excellent!',
  },
  {
    name: 'Siti Rahayu',
    role: 'Pemilik Proyek',
    company: 'Rumah Pribadi',
    avatar: 'https://loremflickr.com/g/100/100/face,woman/all',
    rating: 4,
    text: 'Proses verifikasi yang ketat membuat saya yakin dengan kualitas kontraktor di platform ini. Sangat recommended!',
  },
  {
    name: 'Hendra Pratama',
    role: 'Kontraktor',
    company: 'PT Bangun Persada',
    avatar: 'https://loremflickr.com/g/100/100/face,man/all',
    rating: 5,
    text: 'TenderPro membantu bisnis kami berkembang pesat. Dalam 6 bulan, kami sudah mendapatkan 3 proyek besar dari platform ini.',
  },
  {
    name: 'Maya Anggraini',
    role: 'Pemilik Proyek',
    company: 'Kafe Harmoni',
    avatar: 'https://loremflickr.com/g/100/100/face,woman/all',
    rating: 5,
    text: 'Renovasi kafe saya berjalan lancar berkat TenderPro. Kontraktor yang saya pilih sangat memahami kebutuhan desain interior.',
  },
];

/**
 * Mock data for success projects
 */
export const successProjectData = [
  {
    title: 'Pembangunan Rumah Mewah 2 Lantai',
    location: 'Kemang, Jakarta Selatan',
    category: 'Pembangunan Baru',
    budget: 2500000000,
    duration: '8 bulan',
    contractor: 'PT Bangun Permai Sejahtera',
    image: 'https://loremflickr.com/g/400/300/house,luxury/all',
  },
  {
    title: 'Renovasi Gedung Perkantoran',
    location: 'SCBD, Jakarta',
    category: 'Renovasi',
    budget: 5000000000,
    duration: '6 bulan',
    contractor: 'PT Konstrukindo Maju Jaya',
    image: 'https://loremflickr.com/g/400/300/office,building/all',
  },
  {
    title: 'Pembangunan Ruko Modern',
    location: 'BSD City, Tangerang',
    category: 'Komersial',
    budget: 3500000000,
    duration: '10 bulan',
    contractor: 'PT Rumah Idaman Konstruksi',
    image: 'https://loremflickr.com/g/400/300/shop,modern/all',
  },
  {
    title: 'Desain Interior Restoran',
    location: 'Pondok Indah, Jakarta',
    category: 'Interior',
    budget: 800000000,
    duration: '3 bulan',
    contractor: 'PT Arsitektur Modern Indonesia',
    image: 'https://loremflickr.com/g/400/300/restaurant,interior/all',
  },
  {
    title: 'Pembangunan Cluster Perumahan',
    location: 'Bekasi, Jawa Barat',
    category: 'Perumahan',
    budget: 15000000000,
    duration: '18 bulan',
    contractor: 'PT Bangun Permai Sejahtera',
    image: 'https://loremflickr.com/g/400/300/housing,cluster/all',
  },
  {
    title: 'Renovasi Rumah Tua Heritage',
    location: 'Menteng, Jakarta Pusat',
    category: 'Renovasi',
    budget: 1200000000,
    duration: '5 bulan',
    contractor: 'PT Renovasi Prima',
    image: 'https://loremflickr.com/g/400/300/house,heritage/all',
  },
];

/**
 * Mock data for project categories
 */
export const projectCategoryData = [
  { name: 'Pembangunan Rumah', count: 150, image: 'https://loremflickr.com/g/200/150/house,construction/all' },
  { name: 'Renovasi', count: 89, image: 'https://loremflickr.com/g/200/150/renovation,home/all' },
  { name: 'Komersial', count: 67, image: 'https://loremflickr.com/g/200/150/office,commercial/all' },
  { name: 'Interior', count: 45, image: 'https://loremflickr.com/g/200/150/interior,design/all' },
  { name: 'Fasilitas', count: 32, image: 'https://loremflickr.com/g/200/150/pool,garden/all' },
  { name: 'Industrial', count: 28, image: 'https://loremflickr.com/g/200/150/factory,industrial/all' },
];

/**
 * Mock data for payment history
 */
export const paymentHistoryData = [
  { project: 'Pembangunan Rumah 2 Lantai', milestone: 'Pembayaran Awal (DP 30%)', amount: 225000000, status: 'PAID', date: '15 Jan 2025', method: 'Transfer Bank' },
  { project: 'Pembangunan Rumah 2 Lantai', milestone: 'Pembayaran Progress 1 (20%)', amount: 150000000, status: 'PAID', date: '01 Feb 2025', method: 'Transfer Bank' },
  { project: 'Pembangunan Rumah 2 Lantai', milestone: 'Pembayaran Progress 2 (20%)', amount: 150000000, status: 'PENDING', date: 'Pending', method: '-' },
  { project: 'Renovasi Kantor Pusat', milestone: 'Down Payment (25%)', amount: 125000000, status: 'PAID', date: '10 Jan 2025', method: 'Transfer Bank' },
  { project: 'Renovasi Kantor Pusat', milestone: 'Pembayaran Progress (25%)', amount: 125000000, status: 'PENDING', date: 'Pending', method: '-' },
  { project: 'Pembangunan Gudang Baru', milestone: 'DP Kontrak (20%)', amount: 100000000, status: 'PAID', date: '05 Jan 2025', method: 'Transfer Bank' },
];

/**
 * Mock data for documents
 */
export const mockDocumentsData = [
  { name: 'Kontrak_Kerja_Rumah_2Lantai.pdf', type: 'KONTRAK', project: 'Pembangunan Rumah 2 Lantai', date: '15 Jan 2025', size: '2.4 MB', approved: true },
  { name: 'Gambar_Teknis_Floor_Plan.pdf', type: 'GAMBAR', project: 'Pembangunan Rumah 2 Lantai', date: '14 Jan 2025', size: '5.1 MB', approved: true },
  { name: 'RAB_Renovasi_Kantor.pdf', type: 'RAB', project: 'Renovasi Kantor Pusat', date: '10 Jan 2025', size: '1.2 MB', approved: false },
  { name: 'Invoice_Pembayaran_1.pdf', type: 'INVOICE', project: 'Pembangunan Rumah 2 Lantai', date: '08 Jan 2025', size: '340 KB', approved: true },
  { name: 'SPK_Pembangunan_Gudang.pdf', type: 'SPK', project: 'Pembangunan Gudang Baru', date: '05 Jan 2025', size: '890 KB', approved: true },
];

/**
 * Partner logos data
 */
export const partnerData = [
  { name: 'Bank Mandiri', logo: 'https://www.bankmandiri.co.id/documents/20143/44881086/ag-branding-logo-2.png/30f0204c-d3c1-7237-0e97-6d9c137b2866?t=1623309819189' },
  { name: 'PT. PP', logo: 'https://cdn0-production-images-kly.akamaized.net/6GcJr3TRs0pd8H0QSxXdRAS18QQ=/1200x675/smart/filters:quality(75):strip_icc():format(jpeg)/kly-media-production/medias/4263522/original/042139000_1671182198-PP_logo.jpg' },
  { name: 'Wijaya Karya', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9OfR4w8x8TJiPQ6AX-ky3-j1WmW3LQ_o4yw&s' },
  { name: 'Asosiasi Kontraktor Indonesia', logo: 'https://aki.or.id/wp-content/uploads/Logo-AKI.png' },
];

/**
 * FAQ data
 */
export const faqData = [
  {
    q: 'Bagaimana cara mendaftar di TenderPro?',
    a: 'Pendaftaran sangat mudah! Klik tombol "Masuk" di pojok kanan atas, pilih peran Anda (Pemilik Proyek atau Kontraktor), lalu isi formulir pendaftaran dengan data yang valid. Setelah itu, Anda perlu mengunggah dokumen verifikasi untuk mengaktifkan akun.',
  },
  {
    q: 'Apakah ada biaya pendaftaran?',
    a: 'Tidak ada biaya pendaftaran untuk pemilik proyek. Kontraktor terverifikasi dapat mengakses proyek premium dengan berlangganan paket mulai dari Rp 500.000/bulan.',
  },
  {
    q: 'Bagaimana proses verifikasi akun?',
    a: 'Setelah mendaftar, Anda perlu mengunggah dokumen legalitas (KTP, NPWP, SIUP, NIB, dll). Tim kami akan memverifikasi dokumen dalam 1-3 hari kerja. Anda akan mendapat notifikasi setelah verifikasi selesai.',
  },
  {
    q: 'Bagaimana jika terjadi sengketa dengan kontraktor?',
    a: 'TenderPro menyediakan layanan mediasi untuk membantu menyelesaikan sengketa. Kami juga menahan dana proyek dalam escrow hingga pekerjaan selesai sesuai kesepakatan.',
  },
  {
    q: 'Apa jaminan keamanan pembayaran?',
    a: 'Semua pembayaran dilakukan melalui sistem escrow TenderPro. Dana akan ditahan hingga proyek selesai dan disetujui oleh kedua belah pihak. Kami bekerja sama dengan bank terpercaya di Indonesia.',
  },
  {
    q: 'Bagaimana cara memilih kontraktor yang tepat?',
    a: 'Anda dapat melihat profil lengkap kontraktor termasuk portofolio, rating, dan testimoni dari klien sebelumnya. Gunakan fitur perbandingan untuk membandingkan penawaran dari beberapa kontraktor sekaligus.',
  },
];
