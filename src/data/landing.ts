/**
 * Landing page static data for TenderPro
 * Contains testimonials, success projects, categories, partners, and FAQ
 * Note: In production, this data can be moved to database/API for dynamic management
 */

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  text: string;
}

export interface SuccessProject {
  title: string;
  location: string;
  category: string;
  budget: number;
  duration: string;
  contractor: string;
  image: string;
}

export interface ProjectCategory {
  name: string;
  count: number;
  image: string;
}

export interface Partner {
  name: string;
  logo: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

/**
 * Testimonial data for landing page
 */
export const testimonials: Testimonial[] = [
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
 * Success project showcase data
 */
export const successProjects: SuccessProject[] = [
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
 * Project category data for landing page
 */
export const projectCategories: ProjectCategory[] = [
  { name: 'Pembangunan Rumah', count: 150, image: 'https://loremflickr.com/g/200/150/house,construction/all' },
  { name: 'Renovasi', count: 89, image: 'https://loremflickr.com/g/200/150/renovation,home/all' },
  { name: 'Komersial', count: 67, image: 'https://loremflickr.com/g/200/150/office,commercial/all' },
  { name: 'Interior', count: 45, image: 'https://loremflickr.com/g/200/150/interior,design/all' },
  { name: 'Fasilitas', count: 32, image: 'https://loremflickr.com/g/200/150/pool,garden/all' },
  { name: 'Industrial', count: 28, image: 'https://loremflickr.com/g/200/150/factory,industrial/all' },
];

/**
 * Partner logos
 */
export const partners: Partner[] = [
  { name: 'Bank Mandiri', logo: 'https://www.bankmandiri.co.id/documents/20143/44881086/ag-branding-logo-2.png/30f0204c-d3c1-7237-0e97-6d9c137b2866?t=1623309819189' },
  { name: 'PT. PP', logo: 'https://cdn0-production-images-kly.akamaized.net/6GcJr3TRs0pd8H0QSxXdRAS18QQ=/1200x675/smart/filters:quality(75):strip_icc():format(jpeg)/kly-media-production/medias/4263522/original/042139000_1671182198-PP_logo.jpg' },
  { name: 'Wijaya Karya', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9OfR4w8x8TJiPQ6AX-ky3-j1WmW3LQ_o4yw&s' },
  { name: 'Asosiasi Kontraktor Indonesia', logo: 'https://aki.or.id/wp-content/uploads/Logo-AKI.png' },
];

/**
 * FAQ data for landing page
 */
export const faqItems: FAQItem[] = [
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

// Legacy exports for backward compatibility
export const testimonialData = testimonials;
export const successProjectData = successProjects;
export const projectCategoryData = projectCategories;
export const partnerData = partners;
export const faqData = faqItems;
