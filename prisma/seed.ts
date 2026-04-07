import { db } from '../src/lib/db';

async function seed() {
  console.log('🌱 Memulai seed data TenderPro...\n');

  // ============================================
  // 1. Users
  // ============================================
  console.log('👤 Membuat pengguna...');

  const owner = await db.user.create({
    data: {
      email: 'budi.santoso@propertydev.co.id',
      password: '$2b$10$3uMRYXHPmwtYcRxKezYSy.QDNWd7dEchRqZFIgWvCFDB3moGyQ2c6', // demo123
      name: 'Budi Santoso',
      phone: '081234567890',
      role: 'OWNER',
      isVerified: true,
      verificationStatus: 'VERIFIED',
    },
  });
  console.log(`  ✓ Owner: ${owner.name} (${owner.email})`);

  const contractor1 = await db.user.create({
    data: {
      email: 'ahmad.wijaya@karyamandiri.co.id',
      password: '$2b$10$3uMRYXHPmwtYcRxKezYSy.QDNWd7dEchRqZFIgWvCFDB3moGyQ2c6', // demo123
      name: 'Ahmad Wijaya',
      phone: '082345678901',
      role: 'CONTRACTOR',
      isVerified: true,
      verificationStatus: 'VERIFIED',
    },
  });
  console.log(`  ✓ Kontraktor 1: ${contractor1.name} (${contractor1.email})`);

  const contractor2 = await db.user.create({
    data: {
      email: 'siti.nurhaliza@bangunpermai.co.id',
      password: '$2b$10$3uMRYXHPmwtYcRxKezYSy.QDNWd7dEchRqZFIgWvCFDB3moGyQ2c6', // demo123
      name: 'Siti Nurhaliza',
      phone: '083456789012',
      role: 'CONTRACTOR',
      isVerified: true,
      verificationStatus: 'VERIFIED',
    },
  });
  console.log(`  ✓ Kontraktor 2: ${contractor2.name} (${contractor2.email})`);

  // ============================================
  // 2. Contractor Profiles
  // ============================================
  console.log('\n🏢 Membuat profil kontraktor...');

  const profile1 = await db.contractorProfile.create({
    data: {
      userId: contractor1.id,
      companyName: 'PT Karya Mandiri Konstruksi',
      companyType: 'PT',
      npwp: '01.234.567.8-012.000',
      nib: '1234567890123',
      address: 'Jl. Raya Industrial No. 45, Kawasan Industri MM2100',
      city: 'Bekasi',
      province: 'Jawa Barat',
      postalCode: '17520',
      specialization: 'Pembangunan Baru, Konstruksi',
      experienceYears: 12,
      employeeCount: 85,
      rating: 4.7,
      totalProjects: 48,
      completedProjects: 42,
      description: 'PT Karya Mandiri Konstruksi adalah perusahaan kontraktor berpengalaman lebih dari 10 tahun dalam bidang pembangunan gedung bertingkat, perumahan, dan infrastruktur. Berkomitmen pada kualitas tinggi dan ketepatan waktu.',
    },
  });
  console.log(`  ✓ Profil: ${profile1.companyName}`);

  const profile2 = await db.contractorProfile.create({
    data: {
      userId: contractor2.id,
      companyName: 'CV Bangun Permai Sejahtera',
      companyType: 'CV',
      npwp: '02.345.678.9-013.000',
      nib: '2345678901234',
      address: 'Jl. Gatot Subroto KM 5, Komplek Bisnis Cempaka',
      city: 'Surabaya',
      province: 'Jawa Timur',
      postalCode: '60234',
      specialization: 'Renovasi, Interior',
      experienceYears: 8,
      employeeCount: 35,
      rating: 4.5,
      totalProjects: 32,
      completedProjects: 28,
      description: 'CV Bangun Permai Sejahtera spesialis dalam renovasi rumah dan apartemen, desain interior, serta finishing. Kami mengutamakan detail dan kepuasan pelanggan.',
    },
  });
  console.log(`  ✓ Profil: ${profile2.companyName}`);

  // ============================================
  // 3. Owner Profile
  // ============================================
  const ownerProfile = await db.ownerProfile.create({
    data: {
      userId: owner.id,
      companyName: 'PT Property Development Indonesia',
      companyType: 'PT',
      npwp: '03.456.789.0-014.000',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      totalProjects: 5,
      activeProjects: 2,
    },
  });
  console.log(`  ✓ Profil Owner: ${ownerProfile.companyName}`);

  // ============================================
  // 4. Projects
  // ============================================
  console.log('\n🏗️ Membuat proyek...');

  const project1 = await db.project.create({
    data: {
      ownerId: owner.id,
      title: 'Pembangunan Gedung Perkantoran 8 Lantai',
      description: 'Pembangunan gedung perkantoran modern 8 lantai dengan fasilitas parkir basement, sistem MEP terintegrasi, dan sertifikasi green building. Lokasi strategis di kawasan CBD Jakarta.',
      category: 'Pembangunan Baru',
      location: 'Jl. Sudirman No. 123, Jakarta Selatan',
      budget: 25000000000,
      status: 'OPEN',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-12-31'),
      duration: 300,
      requirements: '["Pengalaman gedung minimal 5 lantai", "Sertifikasi ISO 9001", "Memiliki alat berat sendiri", "Tenaga ahli minimal S1 Teknik Sipil"]',
    },
  });
  console.log(`  ✓ Proyek 1: ${project1.title} (OPEN)`);

  const project2 = await db.project.create({
    data: {
      ownerId: owner.id,
      title: 'Renovasi Total Rumah Tinggal Tipe 200',
      description: 'Renovasi total rumah tinggal 2 lantai tipe 200m² meliputi penggantian struktur atap, renovasi dapur dan kamar mandi, serta pemasangan sistem smart home.',
      category: 'Renovasi',
      location: 'Jl. Pondok Indah Raya No. 88, Jakarta Selatan',
      budget: 850000000,
      status: 'IN_PROGRESS',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-05-15'),
      duration: 120,
      requirements: '["Pengalaman renovasi rumah minimal 3 tahun", "Portofolio renovasi serupa", "Tersedia tim interior"]',
    },
  });
  console.log(`  ✓ Proyek 2: ${project2.title} (IN_PROGRESS)`);

  const project3 = await db.project.create({
    data: {
      ownerId: owner.id,
      title: 'Interior Design Apartemen Mewah',
      description: 'Desain dan pemasangan interior apartemen mewah 3BR di kawasan SCBD. Termasuk custom furniture, lighting design, dan smart home automation.',
      category: 'Interior',
      location: 'SCBD Suite 25, Jakarta Selatan',
      budget: 450000000,
      status: 'COMPLETED',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-10-30'),
      duration: 150,
      requirements: '["Pengalaman interior apartemen mewah", "Portfolio desain minimalis modern"]',
    },
  });
  console.log(`  ✓ Proyek 3: ${project3.title} (COMPLETED)`);

  const project4 = await db.project.create({
    data: {
      ownerId: owner.id,
      title: 'Pembangunan Ruko 3 Lantai Komersial',
      description: 'Pembangunan ruko 3 lantai untuk kegiatan komersial di area pinggir jalan utama. Termasuk struktur beton, finishing eksterior, dan instalasi utilitas.',
      category: 'Konstruksi',
      location: 'Jl. Gatot Subroto No. 56, Bandung',
      budget: 1800000000,
      status: 'DRAFT',
      duration: 180,
      requirements: '["Pengalaman bangun ruko minimal 2 unit", "Memiliki SBU Bangunan", "Domisili Jawa Barat"]',
    },
  });
  console.log(`  ✓ Proyek 4: ${project4.title} (DRAFT)`);

  // ============================================
  // 5. Milestones
  // ============================================
  console.log('\n📋 Membuat milestone...');

  const milestones = [
    { projectId: project2.id, title: 'Pekerjaan Persiapan & Perizinan', status: 'COMPLETED', amount: 85000000, order: 1 },
    { projectId: project2.id, title: 'Pekerjaan Struktur Atap', status: 'COMPLETED', amount: 170000000, order: 2 },
    { projectId: project2.id, title: 'Renovasi Dapur & Kamar Mandi', status: 'IN_PROGRESS', amount: 255000000, order: 3 },
    { projectId: project2.id, title: 'Pekerjaan Listrik & Plumbing', status: 'PENDING', amount: 127500000, order: 4 },
    { projectId: project2.id, title: 'Finishing & Smart Home Installation', status: 'PENDING', amount: 212500000, order: 5 },
    { projectId: project1.id, title: 'Pondasi & Struktur Bawah', status: 'PENDING', amount: 5000000000, order: 1 },
  ];

  for (const m of milestones) {
    await db.projectMilestone.create({
      data: {
        ...m,
        dueDate: new Date('2025-04-30'),
        ...(m.status === 'COMPLETED' ? { completedAt: new Date('2025-02-28') } : {}),
      },
    });
    console.log(`  ✓ Milestone: ${m.title} (${m.status})`);
  }

  // ============================================
  // 6. Bids
  // ============================================
  console.log('\n💰 Membuat penawaran...');

  const bids = [
    {
      projectId: project1.id,
      contractorId: contractor1.id,
      proposal: 'PT Karya Mandiri Konstruksi menawarkan solusi pembangunan gedung perkantoran 8 lantai dengan pendekatan metode konstruksi modern. Kami memiliki pengalaman membangun gedung perkantoran serupa di kawasan Jabodetabek. Tim ahli kami terdiri dari insinyur sipil bersertifikasi dan tenaga kerja terampil. Kami menjamin kualitas pekerjaan sesuai standar SNI dan ketepatan waktu penyelesaian.',
      price: 23000000000,
      duration: 280,
      status: 'PENDING',
    },
    {
      projectId: project1.id,
      contractorId: contractor2.id,
      proposal: 'CV Bangun Permai Sejahtera mengajukan penawaran untuk proyek pembangunan gedung perkantoran. Meskipun kami lebih berfokus pada renovasi dan interior, kami memiliki mitra kerja yang berpengalaman dalam proyek berskala besar. Kami menawarkan harga yang kompetitif dengan tetap menjaga kualitas pekerjaan.',
      price: 24500000000,
      duration: 300,
      status: 'PENDING',
    },
    {
      projectId: project2.id,
      contractorId: contractor1.id,
      proposal: 'Kami menawarkan renovasi total rumah tinggal dengan spesifikasi premium. Tim kami telah menangani lebih dari 20 proyek renovasi rumah tinggal di Jakarta. Kami akan menggunakan material berkualitas tinggi dan metode pengerjaan yang efisien untuk memastikan hasil terbaik.',
      price: 780000000,
      duration: 110,
      status: 'ACCEPTED',
    },
    {
      projectId: project2.id,
      contractorId: contractor2.id,
      proposal: 'CV Bangun Permai Sejahtera siap menangani renovasi rumah tinggal Anda dengan fokus pada detail dan kualitas finishing. Kami menawarkan paket lengkap termasuk konsultasi desain interior gratis.',
      price: 820000000,
      duration: 120,
      status: 'REJECTED',
    },
    {
      projectId: project3.id,
      contractorId: contractor2.id,
      proposal: 'Kami spesialis dalam desain interior apartemen mewah. Tim desainer kami akan menciptakan ruangan yang elegan dan fungsional sesuai gaya hidup Anda. Termasuk custom furniture dari bahan premium.',
      price: 420000000,
      duration: 140,
      status: 'ACCEPTED',
    },
  ];

  for (const b of bids) {
    await db.bid.create({ data: b });
    console.log(`  ✓ Penawaran: ${b.contractorId.slice(-6)} → ${b.projectId.slice(-6)} (${b.status}) - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(b.price)}`);
  }

  // ============================================
  // 7. Reviews
  // ============================================
  console.log('\n⭐ Membuat ulasan...');

  const reviews = [
    {
      fromUserId: owner.id,
      toContractorId: contractor2.id,
      projectId: project3.id,
      rating: 5,
      review: 'Sangat puas dengan hasil kerja CV Bangun Permai. Desain interior sangat elegan dan sesuai dengan keinginan kami. Pengerjaan tepat waktu dan komunikasi sangat baik selama proses berlangsung.',
      professionalism: 5,
      quality: 5,
      timeliness: 5,
    },
    {
      fromUserId: owner.id,
      toContractorId: contractor1.id,
      projectId: project2.id,
      rating: 4,
      review: 'Kualitas pekerjaan bagus, struktur atap yang baru sangat kokoh. Sedikit delay pada tahap renovasi dapur, tapi secara keseluruhan hasilnya memuaskan.',
      professionalism: 5,
      quality: 4,
      timeliness: 3,
    },
  ];

  for (const r of reviews) {
    await db.review.create({ data: r });
    console.log(`  ✓ Ulasan: ${r.rating}/5 dari ${r.fromUserId.slice(-6)} → ${r.toContractorId.slice(-6)}`);
  }

  // ============================================
  // 8. Certifications
  // ============================================
  console.log('\n📜 Membuat sertifikasi...');

  const certifications = [
    {
      userId: contractor1.id,
      type: 'SIUJK',
      number: 'SIUJK-0123-JKT-2023',
      issuedBy: 'Dinas Pekerjaan Umum DKI Jakarta',
      issuedAt: new Date('2023-01-15'),
      expiresAt: new Date('2028-01-15'),
      fileUrl: '/certificates/siujk-karyamandiri.pdf',
      isVerified: true,
      verifiedAt: new Date('2023-02-01'),
    },
    {
      userId: contractor2.id,
      type: 'SBU',
      number: 'SBU-0456-SBY-2022',
      issuedBy: 'LPJK Jawa Timur',
      issuedAt: new Date('2022-06-10'),
      expiresAt: new Date('2027-06-10'),
      fileUrl: '/certificates/sbu-bangunpermai.pdf',
      isVerified: true,
      verifiedAt: new Date('2022-07-01'),
    },
  ];

  for (const c of certifications) {
    await db.certification.create({ data: c });
    console.log(`  ✓ Sertifikasi: ${c.type} - ${c.number}`);
  }

  // ============================================
  // 9. Notifications
  // ============================================
  console.log('\n🔔 Membuat notifikasi...');

  const notifications = [
    {
      userId: owner.id,
      title: 'Penawaran Baru Diterima',
      message: 'PT Karya Mandiri Konstruksi mengajukan penawaran untuk proyek "Pembangunan Gedung Perkantoran 8 Lantai" sebesar Rp 23.000.000.000.',
      type: 'BID_RECEIVED',
      relatedId: project1.id,
      isRead: false,
    },
    {
      userId: owner.id,
      title: 'Milestone Diselesaikan',
      message: 'Milestone "Renovasi Dapur & Kamar Mandi" pada proyek renovasi rumah sedang dikerjakan oleh kontraktor.',
      type: 'MILESTONE_UPDATE',
      relatedId: project2.id,
      isRead: false,
    },
    {
      userId: contractor1.id,
      title: 'Penawaran Diterima',
      message: 'Selamat! Penawaran Anda untuk proyek "Renovasi Total Rumah Tinggal Tipe 200" telah diterima. Silakan mulai pengerjaan sesuai jadwal.',
      type: 'BID_ACCEPTED',
      relatedId: project2.id,
      isRead: true,
    },
  ];

  for (const n of notifications) {
    await db.notification.create({ data: n });
    console.log(`  ✓ Notifikasi: ${n.title}`);
  }

  // ============================================
  // 10. Badges
  // ============================================
  console.log('\n🏅 Membuat badge...');

  await db.badge.create({
    data: {
      contractorId: contractor1.id,
      type: 'TOP_RATED',
      label: 'Top Rated',
      description: 'Kontraktor dengan rating tertinggi',
      icon: '⭐',
    },
  });
  console.log('  ✓ Badge: TOP_RATED untuk PT Karya Mandiri');

  await db.badge.create({
    data: {
      contractorId: contractor2.id,
      type: 'LOCAL_CHAMPION',
      label: 'Kontraktor Lokal',
      description: 'Kontraktor lokal Indonesia terverifikasi',
      icon: '🇮🇩',
    },
  });
  console.log('  ✓ Badge: LOCAL_CHAMPION untuk CV Bangun Permai');

  console.log('\n✅ Seed data TenderPro berhasil dibuat!');
  console.log('📊 Ringkasan:');
  console.log(`   - 3 Pengguna (1 Owner, 2 Kontraktor)`);
  console.log(`   - 2 Profil Kontraktor`);
  console.log(`   - 4 Proyek (DRAFT, OPEN, IN_PROGRESS, COMPLETED)`);
  console.log(`   - 6 Milestone`);
  console.log(`   - 5 Penawaran`);
  console.log(`   - 2 Ulasan`);
  console.log(`   - 2 Sertifikasi`);
  console.log(`   - 3 Notifikasi`);
  console.log(`   - 2 Badge`);
}

seed()
  .catch((e) => {
    console.error('❌ Gagal membuat seed data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

export { seed };
