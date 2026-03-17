import { config } from 'dotenv';
config();

import { PrismaClient, UserRole, ProjectStatus, BidStatus, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting comprehensive seed...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
  
  // Clear existing data (order matters due to foreign keys)
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.projectMilestone.deleteMany();
  await prisma.projectDocument.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.document.deleteMany();
  await prisma.verificationRequest.deleteMany();
  await prisma.project.deleteMany();
  await prisma.contractorProfile.deleteMany();
  await prisma.ownerProfile.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleared existing data');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ==================== USERS ====================
  
  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@tenderpro.id',
      password: hashedPassword,
      name: 'Admin TenderPro',
      phone: '021-12345678',
      role: UserRole.ADMIN,
      isVerified: true,
      verificationStatus: VerificationStatus.VERIFIED,
    },
  });
  console.log('✅ Created admin:', admin.email);

  // Create Contractors (4 companies)
  const contractors = await Promise.all([
    // Contractor 1 - PT Bangun Permai (Demo Contractor)
    prisma.user.create({
      data: {
        email: 'info@ptbangunpermai.co.id',
        password: hashedPassword,
        name: 'Ahmad Sulaiman',
        phone: '081234567890',
        role: UserRole.CONTRACTOR,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
        avatar: 'https://ui-avatars.com/api/?name=Ahmad+Sulaiman&background=0D8ABC&color=fff',
        contractor: {
          create: {
            companyName: 'PT Bangun Permai Sejahtera',
            companyType: 'PT',
            npwp: '01.234.567.8-012.345',
            nib: 'NIB1234567890',
            address: 'Jl. Sudirman No. 123, Blok A',
            city: 'Jakarta Selatan',
            province: 'DKI Jakarta',
            postalCode: '12190',
            specialization: 'Pembangunan Rumah, Renovasi',
            experienceYears: 15,
            employeeCount: 50,
            rating: 4.8,
            totalProjects: 120,
            completedProjects: 115,
            description: 'Perusahaan konstruksi terpercaya dengan pengalaman lebih dari 15 tahun. Spesialis pembangunan rumah tinggal dan renovasi berkualitas tinggi.',
          },
        },
      },
    }),
    // Contractor 2 - PT Rumah Idaman
    prisma.user.create({
      data: {
        email: 'info@ptrumahidaman.co.id',
        password: hashedPassword,
        name: 'Budi Santoso',
        phone: '082345678901',
        role: UserRole.CONTRACTOR,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
        avatar: 'https://ui-avatars.com/api/?name=Budi+Santoso&background=16A34A&color=fff',
        contractor: {
          create: {
            companyName: 'PT Rumah Idaman Konstruksi',
            companyType: 'PT',
            npwp: '02.345.678.9-012.345',
            nib: 'NIB2345678901',
            address: 'Jl. Gatot Subroto No. 45',
            city: 'Bandung',
            province: 'Jawa Barat',
            postalCode: '40123',
            specialization: 'Renovasi, Interior',
            experienceYears: 10,
            employeeCount: 35,
            rating: 4.6,
            totalProjects: 85,
            completedProjects: 80,
            description: 'Spesialis renovasi dan desain interior rumah tinggal dengan sentuhan modern dan fungsional.',
          },
        },
      },
    }),
    // Contractor 3 - PT Konstrukindo (Highest Rating)
    prisma.user.create({
      data: {
        email: 'info@ptkonstrukindo.co.id',
        password: hashedPassword,
        name: 'Dewi Kartika',
        phone: '083456789012',
        role: UserRole.CONTRACTOR,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
        avatar: 'https://ui-avatars.com/api/?name=Dewi+Kartika&background=7C3AED&color=fff',
        contractor: {
          create: {
            companyName: 'PT Konstrukindo Maju Jaya',
            companyType: 'PT',
            npwp: '03.456.789.0-123.456',
            nib: 'NIB3456789012',
            address: 'Jl. Pemuda No. 78',
            city: 'Surabaya',
            province: 'Jawa Timur',
            postalCode: '60123',
            specialization: 'Pembangunan Baru, Komersial',
            experienceYears: 20,
            employeeCount: 100,
            rating: 4.9,
            totalProjects: 200,
            completedProjects: 195,
            description: 'Perusahaan konstruksi skala besar dengan pengalaman 20 tahun. Mengerjakan proyek komersial dan residensial premium.',
          },
        },
      },
    }),
    // Contractor 4 - PT Renovasi Prima
    prisma.user.create({
      data: {
        email: 'info@ptrenovasi.co.id',
        password: hashedPassword,
        name: 'Eko Prasetyo',
        phone: '084567890123',
        role: UserRole.CONTRACTOR,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
        avatar: 'https://ui-avatars.com/api/?name=Eko+Prasetyo&background=EA580C&color=fff',
        contractor: {
          create: {
            companyName: 'PT Renovasi Prima',
            companyType: 'PT',
            npwp: '04.567.890.1-234.567',
            nib: 'NIB4567890123',
            address: 'Jl. Diponegoro No. 56',
            city: 'Semarang',
            province: 'Jawa Tengah',
            postalCode: '50123',
            specialization: 'Renovasi, Pemeliharaan',
            experienceYears: 8,
            employeeCount: 25,
            rating: 4.5,
            totalProjects: 60,
            completedProjects: 58,
            description: 'Ahli renovasi dan pemeliharaan rumah dengan harga terjangkau dan kualitas terjamin.',
          },
        },
      },
    }),
  ]);
  console.log('✅ Created', contractors.length, 'contractors');

  // Create Project Owners (4 owners)
  const owners = await Promise.all([
    // Owner 1 - Andriansyah (Demo Owner)
    prisma.user.create({
      data: {
        email: 'andriansyah@gmail.com',
        password: hashedPassword,
        name: 'Andriansyah Putra',
        phone: '086789012345',
        role: UserRole.OWNER,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
        avatar: 'https://ui-avatars.com/api/?name=Andriansyah+Putra&background=0D8ABC&color=fff',
        owner: {
          create: {
            address: 'Jl. Kemang Raya No. 12',
            city: 'Jakarta Selatan',
            province: 'DKI Jakarta',
            postalCode: '12730',
            totalProjects: 4,
            activeProjects: 2,
          },
        },
      },
    }),
    // Owner 2 - Ratna Sari
    prisma.user.create({
      data: {
        email: 'ratna.sari@gmail.com',
        password: hashedPassword,
        name: 'Ratna Sari',
        phone: '087890123456',
        role: UserRole.OWNER,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
        avatar: 'https://ui-avatars.com/api/?name=Ratna+Sari&background=EC4899&color=fff',
        owner: {
          create: {
            address: 'Jl. Dago Atas No. 34',
            city: 'Bandung',
            province: 'Jawa Barat',
            postalCode: '40135',
            totalProjects: 2,
            activeProjects: 1,
          },
        },
      },
    }),
    // Owner 3 - PT Properti Nusantara (Corporate Owner)
    prisma.user.create({
      data: {
        email: 'info@ptproperti.co.id',
        password: hashedPassword,
        name: 'Hendri Wijaya',
        phone: '088901234567',
        role: UserRole.OWNER,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
        avatar: 'https://ui-avatars.com/api/?name=Hendri+Wijaya&background=1E40AF&color=fff',
        owner: {
          create: {
            companyName: 'PT Properti Nusantara',
            companyType: 'PT',
            npwp: '06.789.012.3-456.789',
            address: 'Jl. HR Rasuna Said No. 100',
            city: 'Jakarta Selatan',
            province: 'DKI Jakarta',
            postalCode: '12950',
            totalProjects: 15,
            activeProjects: 3,
          },
        },
      },
    }),
    // Owner 4 - Siti Rahayu
    prisma.user.create({
      data: {
        email: 'siti.rahayu@gmail.com',
        password: hashedPassword,
        name: 'Siti Rahayu',
        phone: '089012345678',
        role: UserRole.OWNER,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
        avatar: 'https://ui-avatars.com/api/?name=Siti+Rahayu&background=059669&color=fff',
        owner: {
          create: {
            address: 'Jl. Pahlawan No. 45',
            city: 'Surabaya',
            province: 'Jawa Timur',
            postalCode: '60123',
            totalProjects: 1,
            activeProjects: 1,
          },
        },
      },
    }),
  ]);
  console.log('✅ Created', owners.length, 'owners');

  // Get contractor profile IDs
  const contractorProfiles = await prisma.contractorProfile.findMany({
    where: { userId: { in: contractors.map(c => c.id) } }
  });
  const contractorProfileMap = new Map(contractorProfiles.map(p => [p.userId, p.id]));

  // ==================== PROJECTS ====================
  
  // Projects for Demo Owner (Andriansyah)
  const owner1Projects = await Promise.all([
    // Project 1 - OPEN (receiving bids)
    prisma.project.create({
      data: {
        ownerId: owners[0].id,
        title: 'Pembangunan Rumah 2 Lantai di Depok',
        description: 'Pembangunan rumah 2 lantai dengan luas tanah 150m2 dan luas bangunan 200m2. Desain modern minimalis dengan 4 kamar tidur, 3 kamar mandi, ruang keluarga, dapur, dan carport untuk 2 mobil.',
        category: 'Pembangunan Baru',
        location: 'Depok, Jawa Barat',
        budget: 1200000000,
        duration: 180,
        status: ProjectStatus.OPEN,
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-08-01'),
        requirements: JSON.stringify(['IMB/ PBG', 'Gambar desain arsitektur', 'RAB detail', 'Garansi 1 tahun']),
        viewCount: 234,
      },
    }),
    // Project 2 - IN_PROGRESS (with milestones and payments)
    prisma.project.create({
      data: {
        ownerId: owners[0].id,
        title: 'Renovasi Total Rumah Type 45',
        description: 'Renovasi total rumah type 45 menjadi lebih modern. Termasuk renovasi atap, plafon, lantai, kusen dan pintu, serta penambahan kanopi.',
        category: 'Renovasi',
        location: 'Jakarta Selatan',
        budget: 450000000,
        duration: 90,
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-04-15'),
        requirements: JSON.stringify(['Portofolio renovasi', 'Timeline detail', 'Material berkualitas']),
        viewCount: 156,
      },
    }),
    // Project 3 - COMPLETED
    prisma.project.create({
      data: {
        ownerId: owners[0].id,
        title: 'Pembangunan Kolam Renang',
        description: 'Pembangunan kolam renang ukuran 4x8 meter dengan sistem filtrasi modern dan deck kayu.',
        category: 'Fasilitas',
        location: 'Depok, Jawa Barat',
        budget: 350000000,
        duration: 60,
        status: ProjectStatus.COMPLETED,
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-11-01'),
        requirements: JSON.stringify(['Sertifikat teknis', 'Garanti tidak bocor']),
        viewCount: 89,
      },
    }),
    // Project 4 - IN_PROGRESS (for CCTV demo)
    prisma.project.create({
      data: {
        ownerId: owners[0].id,
        title: 'Pembangunan Garasi dan Carport',
        description: 'Pembangunan garasi tertutup dan carport untuk 3 mobil dengan atap polycarbonate.',
        category: 'Renovasi',
        location: 'Depok, Jawa Barat',
        budget: 200000000,
        duration: 45,
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-02-10'),
        endDate: new Date('2025-03-27'),
        requirements: JSON.stringify(['Desain minimalis', 'Material tahan lama']),
        viewCount: 67,
      },
    }),
  ]);
  console.log('✅ Created', owner1Projects.length, 'projects for Demo Owner');

  // Projects for other owners
  const otherProjects = await Promise.all([
    // Ratna's project - OPEN
    prisma.project.create({
      data: {
        ownerId: owners[1].id,
        title: 'Renovasi Dapur dan Kamar Mandi',
        description: 'Renovasi dapur dengan kitchen set baru dan 2 kamar mandi dengan desain modern.',
        category: 'Renovasi',
        location: 'Bandung, Jawa Barat',
        budget: 280000000,
        duration: 45,
        status: ProjectStatus.OPEN,
        startDate: new Date('2025-03-01'),
        requirements: JSON.stringify(['Portofolio renovasi dapur dan kamar mandi']),
        viewCount: 98,
      },
    }),
    // PT Properti - OPEN (big project)
    prisma.project.create({
      data: {
        ownerId: owners[2].id,
        title: 'Pembangunan Ruko 2 Lantai (5 Unit)',
        description: 'Pembangunan 5 unit ruko 2 lantai di lokasi komersial strategis. Setiap unit luas 6x15 meter.',
        category: 'Komersial',
        location: 'Tangerang, Banten',
        budget: 5000000000,
        duration: 270,
        status: ProjectStatus.OPEN,
        startDate: new Date('2025-04-01'),
        requirements: JSON.stringify(['Pengalaman minimal 10 tahun', 'NIB dan SIUP', 'Portofolio proyek komersial']),
        viewCount: 312,
      },
    }),
    // Siti's project - IN_PROGRESS
    prisma.project.create({
      data: {
        ownerId: owners[3].id,
        title: 'Interior Design Rumah Baru',
        description: 'Desain interior lengkap untuk rumah baru termasuk furniture custom.',
        category: 'Interior',
        location: 'Surabaya, Jawa Timur',
        budget: 180000000,
        duration: 60,
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-01-20'),
        endDate: new Date('2025-03-20'),
        requirements: JSON.stringify(['Portofolio desain interior', '3D rendering']),
        viewCount: 145,
      },
    }),
  ]);
  console.log('✅ Created', otherProjects.length, 'projects for other owners');

  const allProjects = [...owner1Projects, ...otherProjects];

  // ==================== MILESTONES ====================
  
  // Milestones for Project 2 (Renovasi Total Rumah - IN_PROGRESS)
  const project2Milestones = await Promise.all([
    prisma.projectMilestone.create({
      data: {
        projectId: owner1Projects[1].id,
        title: 'Persiapan dan Pembongkaran',
        description: 'Pembongkaran bagian yang akan direnovasi dan persiapan material',
        amount: 50000000,
        dueDate: new Date('2025-01-25'),
        completedAt: new Date('2025-01-24'),
        status: 'COMPLETED',
        order: 1,
      },
    }),
    prisma.projectMilestone.create({
      data: {
        projectId: owner1Projects[1].id,
        title: 'Pekerjaan Struktur dan Atap',
        description: 'Perbaikan struktur, penggantian atap, dan pemasangan rangka plafon',
        amount: 120000000,
        dueDate: new Date('2025-02-15'),
        completedAt: new Date('2025-02-14'),
        status: 'COMPLETED',
        order: 2,
      },
    }),
    prisma.projectMilestone.create({
      data: {
        projectId: owner1Projects[1].id,
        title: 'Pemasangan Lantai dan Dinding',
        description: 'Pemasangan keramik lantai, dinding, dan pengecatan',
        amount: 100000000,
        dueDate: new Date('2025-03-10'),
        status: 'IN_PROGRESS',
        order: 3,
      },
    }),
    prisma.projectMilestone.create({
      data: {
        projectId: owner1Projects[1].id,
        title: 'Pemasangan Kusen dan Pintu',
        description: 'Pemasangan kusen, pintu, dan jendela baru',
        amount: 80000000,
        dueDate: new Date('2025-03-25'),
        status: 'PENDING',
        order: 4,
      },
    }),
    prisma.projectMilestone.create({
      data: {
        projectId: owner1Projects[1].id,
        title: 'Finishing dan Serah Terima',
        description: 'Pekerjaan finishing akhir dan serah terima proyek',
        amount: 100000000,
        dueDate: new Date('2025-04-15'),
        status: 'PENDING',
        order: 5,
      },
    }),
  ]);
  console.log('✅ Created', project2Milestones.length, 'milestones for Project 2');

  // Milestones for Project 4 (Garasi - IN_PROGRESS)
  const project4Milestones = await Promise.all([
    prisma.projectMilestone.create({
      data: {
        projectId: owner1Projects[3].id,
        title: 'Pondasi dan Struktur',
        description: 'Pembuatan pondasi dan struktur kolom',
        amount: 60000000,
        dueDate: new Date('2025-02-25'),
        completedAt: new Date('2025-02-23'),
        status: 'COMPLETED',
        order: 1,
      },
    }),
    prisma.projectMilestone.create({
      data: {
        projectId: owner1Projects[3].id,
        title: 'Pemasangan Atap dan Plafon',
        description: 'Pemasangan rangka atap dan plafon carport',
        amount: 80000000,
        dueDate: new Date('2025-03-10'),
        status: 'IN_PROGRESS',
        order: 2,
      },
    }),
    prisma.projectMilestone.create({
      data: {
        projectId: owner1Projects[3].id,
        title: 'Finishing dan Paving',
        description: 'Pengecatan dan pemasangan paving block',
        amount: 60000000,
        dueDate: new Date('2025-03-27'),
        status: 'PENDING',
        order: 3,
      },
    }),
  ]);
  console.log('✅ Created', project4Milestones.length, 'milestones for Project 4');

  // Milestones for Siti's project (Interior - IN_PROGRESS)
  const project7Milestones = await Promise.all([
    prisma.projectMilestone.create({
      data: {
        projectId: otherProjects[2].id,
        title: 'Desain dan 3D Rendering',
        description: 'Pembuatan desain interior dan 3D rendering',
        amount: 30000000,
        dueDate: new Date('2025-02-05'),
        completedAt: new Date('2025-02-03'),
        status: 'COMPLETED',
        order: 1,
      },
    }),
    prisma.projectMilestone.create({
      data: {
        projectId: otherProjects[2].id,
        title: 'Produksi Furniture Custom',
        description: 'Produksi furniture custom di workshop',
        amount: 80000000,
        dueDate: new Date('2025-03-01'),
        status: 'IN_PROGRESS',
        order: 2,
      },
    }),
    prisma.projectMilestone.create({
      data: {
        projectId: otherProjects[2].id,
        title: 'Instalasi dan Finishing',
        description: 'Instalasi furniture dan finishing akhir',
        amount: 70000000,
        dueDate: new Date('2025-03-20'),
        status: 'PENDING',
        order: 3,
      },
    }),
  ]);
  console.log('✅ Created', project7Milestones.length, 'milestones for Siti project');

  // ==================== PAYMENTS ====================
  
  // Payments for Project 2 milestones
  await Promise.all([
    // Payment for milestone 1 (COMPLETED)
    prisma.payment.create({
      data: {
        milestoneId: project2Milestones[0].id,
        amount: 50000000,
        method: 'BANK_TRANSFER',
        status: 'CONFIRMED',
        transactionId: 'TRX001-' + Date.now(),
        paidAt: new Date('2025-01-24'),
        confirmedAt: new Date('2025-01-25'),
      },
    }),
    // Payment for milestone 2 (COMPLETED)
    prisma.payment.create({
      data: {
        milestoneId: project2Milestones[1].id,
        amount: 120000000,
        method: 'BANK_TRANSFER',
        status: 'CONFIRMED',
        transactionId: 'TRX002-' + Date.now(),
        paidAt: new Date('2025-02-14'),
        confirmedAt: new Date('2025-02-15'),
      },
    }),
    // Payment for milestone 3 (IN_PROGRESS - partial)
    prisma.payment.create({
      data: {
        milestoneId: project2Milestones[2].id,
        amount: 50000000,
        method: 'BANK_TRANSFER',
        status: 'PAID',
        transactionId: 'TRX003-' + Date.now(),
        paidAt: new Date('2025-02-28'),
      },
    }),
  ]);
  console.log('✅ Created payments for Project 2');

  // Payments for Project 4 milestones
  await Promise.all([
    prisma.payment.create({
      data: {
        milestoneId: project4Milestones[0].id,
        amount: 60000000,
        method: 'BANK_TRANSFER',
        status: 'CONFIRMED',
        transactionId: 'TRX004-' + Date.now(),
        paidAt: new Date('2025-02-23'),
        confirmedAt: new Date('2025-02-24'),
      },
    }),
  ]);
  console.log('✅ Created payments for Project 4');

  // ==================== BIDS ====================
  
  // Bids for Project 1 (OPEN - Pembangunan Rumah 2 Lantai)
  await Promise.all([
    prisma.bid.create({
      data: {
        projectId: owner1Projects[0].id,
        contractorId: contractors[0].id,
        proposal: 'Kami berkomitmen membangun rumah impian Anda dengan standar kualitas terbaik. Tim profesional dengan pengalaman 15 tahun siap mewujudkan rumah idaman Anda.',
        price: 1150000000,
        duration: 175,
        status: BidStatus.PENDING,
      },
    }),
    prisma.bid.create({
      data: {
        projectId: owner1Projects[0].id,
        contractorId: contractors[2].id,
        proposal: 'Dengan pengalaman 20 tahun dalam konstruksi dan rating tertinggi, kami menjamin kualitas pembangunan terbaik dengan timeline yang tepat.',
        price: 1180000000,
        duration: 165,
        status: BidStatus.PENDING,
      },
    }),
    prisma.bid.create({
      data: {
        projectId: owner1Projects[0].id,
        contractorId: contractors[1].id,
        proposal: 'Spesialis pembangunan rumah dengan sentuhan modern. Kami menawarkan harga kompetitif dengan kualitas premium.',
        price: 1120000000,
        duration: 180,
        status: BidStatus.PENDING,
      },
    }),
  ]);
  console.log('✅ Created bids for Project 1');

  // Bids for Project 2 (already accepted one - IN_PROGRESS)
  await Promise.all([
    prisma.bid.create({
      data: {
        projectId: owner1Projects[1].id,
        contractorId: contractors[1].id,
        proposal: 'Spesialis renovasi dengan hasil memuaskan. Kami akan mengubah rumah type 45 Anda menjadi rumah impian.',
        price: 450000000,
        duration: 90,
        status: BidStatus.ACCEPTED,
      },
    }),
    prisma.bid.create({
      data: {
        projectId: owner1Projects[1].id,
        contractorId: contractors[3].id,
        proposal: 'Renovasi profesional dengan harga terjangkau. Garansi kepuasan pelanggan.',
        price: 420000000,
        duration: 95,
        status: BidStatus.REJECTED,
      },
    }),
  ]);
  console.log('✅ Created bids for Project 2');

  // Bids for Project 4 (Garasi)
  await Promise.all([
    prisma.bid.create({
      data: {
        projectId: owner1Projects[3].id,
        contractorId: contractors[0].id,
        proposal: 'Pembangunan garasi dan carport dengan desain minimalis modern.',
        price: 195000000,
        duration: 45,
        status: BidStatus.ACCEPTED,
      },
    }),
  ]);
  console.log('✅ Created bids for Project 4');

  // Bids for Ratna's project (Renovasi Dapur)
  await Promise.all([
    prisma.bid.create({
      data: {
        projectId: otherProjects[0].id,
        contractorId: contractors[1].id,
        proposal: 'Renovasi dapur dan kamar mandi dengan material premium dan desain modern.',
        price: 275000000,
        duration: 42,
        status: BidStatus.PENDING,
      },
    }),
    prisma.bid.create({
      data: {
        projectId: otherProjects[0].id,
        contractorId: contractors[3].id,
        proposal: 'Spesialis renovasi dapur dan kamar mandi dengan harga kompetitif.',
        price: 260000000,
        duration: 45,
        status: BidStatus.PENDING,
      },
    }),
  ]);
  console.log('✅ Created bids for Ratna project');

  // Bids for PT Properti project (Ruko)
  await Promise.all([
    prisma.bid.create({
      data: {
        projectId: otherProjects[1].id,
        contractorId: contractors[0].id,
        proposal: 'Pengalaman luas dalam pembangunan ruko. Menawarkan kualitas premium dengan timeline ketat.',
        price: 4850000000,
        duration: 260,
        status: BidStatus.PENDING,
      },
    }),
    prisma.bid.create({
      data: {
        projectId: otherProjects[1].id,
        contractorId: contractors[2].id,
        proposal: 'Kontraktor skala besar dengan pengalaman 20 tahun. Siap mengerjakan proyek komersial.',
        price: 4950000000,
        duration: 250,
        status: BidStatus.PENDING,
      },
    }),
  ]);
  console.log('✅ Created bids for PT Properti project');

  // Bids for Siti's project (Interior)
  await Promise.all([
    prisma.bid.create({
      data: {
        projectId: otherProjects[2].id,
        contractorId: contractors[1].id,
        proposal: 'Desain interior modern dengan furniture custom berkualitas.',
        price: 175000000,
        duration: 55,
        status: BidStatus.ACCEPTED,
      },
    }),
  ]);
  console.log('✅ Created bids for Siti project');

  // ==================== PORTFOLIOS ====================
  
  // Portfolios for Demo Contractor (PT Bangun Permai)
  await Promise.all([
    prisma.portfolio.create({
      data: {
        contractorId: contractorProfileMap.get(contractors[0].id)!,
        title: 'Rumah Mewah 2 Lantai di Kemang',
        description: 'Pembangunan rumah mewah 2 lantai dengan 5 kamar tidur, kolam renang, dan taman. Luas bangunan 450m2.',
        category: 'Pembangunan Baru',
        clientName: 'Bapak Tono Wijaya',
        location: 'Kemang, Jakarta Selatan',
        year: 2023,
        budget: 3500000000,
        images: JSON.stringify(['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800']),
      },
    }),
    prisma.portfolio.create({
      data: {
        contractorId: contractorProfileMap.get(contractors[0].id)!,
        title: 'Renovasi Rumah Type 70',
        description: 'Renovasi total rumah type 70 menjadi lebih modern dengan penambahan lantai.',
        category: 'Renovasi',
        clientName: 'Ibu Ratna',
        location: 'Pondok Indah, Jakarta Selatan',
        year: 2023,
        budget: 800000000,
        images: JSON.stringify(['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800']),
      },
    }),
    prisma.portfolio.create({
      data: {
        contractorId: contractorProfileMap.get(contractors[0].id)!,
        title: 'Pembangunan Villa di Puncak',
        description: 'Pembangunan villa 3 kamar dengan view pegunungan dan kolam infinity.',
        category: 'Pembangunan Baru',
        clientName: 'Bapak Hendri',
        location: 'Puncak, Bogor',
        year: 2022,
        budget: 2500000000,
        images: JSON.stringify(['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800']),
      },
    }),
    prisma.portfolio.create({
      data: {
        contractorId: contractorProfileMap.get(contractors[0].id)!,
        title: 'Rumah Minimalis Modern',
        description: 'Pembangunan rumah minimalis 1 lantai dengan konsep open space.',
        category: 'Pembangunan Baru',
        clientName: 'Bapak Agus',
        location: 'BSD City, Tangerang',
        year: 2024,
        budget: 950000000,
        images: JSON.stringify(['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800']),
      },
    }),
  ]);
  console.log('✅ Created portfolios for Demo Contractor');

  // Portfolios for other contractors
  await Promise.all([
    // PT Rumah Idaman portfolios
    prisma.portfolio.create({
      data: {
        contractorId: contractorProfileMap.get(contractors[1].id)!,
        title: 'Renovasi Dapur Modern',
        description: 'Renovasi dapur dengan kitchen set custom dan peralatan modern.',
        category: 'Renovasi',
        location: 'Bandung',
        year: 2023,
        budget: 150000000,
      },
    }),
    prisma.portfolio.create({
      data: {
        contractorId: contractorProfileMap.get(contractors[1].id)!,
        title: 'Interior Rumah Minimalis',
        description: 'Desain interior lengkap untuk rumah minimalis 100m2.',
        category: 'Interior',
        location: 'Bandung',
        year: 2024,
        budget: 200000000,
      },
    }),
    // PT Konstrukindo portfolios
    prisma.portfolio.create({
      data: {
        contractorId: contractorProfileMap.get(contractors[2].id)!,
        title: 'Gedung Perkantoran 5 Lantai',
        description: 'Pembangunan gedung perkantoran modern dengan fasilitas lengkap.',
        category: 'Komersial',
        location: 'Surabaya',
        year: 2022,
        budget: 25000000000,
      },
    }),
    prisma.portfolio.create({
      data: {
        contractorId: contractorProfileMap.get(contractors[2].id)!,
        title: 'Hotel Bintang 4',
        description: 'Pembangunan hotel dengan 80 kamar dan fasilitas convention hall.',
        category: 'Komersial',
        location: 'Surabaya',
        year: 2023,
        budget: 45000000000,
      },
    }),
    // PT Renovasi Prima portfolios
    prisma.portfolio.create({
      data: {
        contractorId: contractorProfileMap.get(contractors[3].id)!,
        title: 'Renovasi Rumah Tua',
        description: 'Renovasi total rumah tua menjadi rumah modern.',
        category: 'Renovasi',
        location: 'Semarang',
        year: 2023,
        budget: 300000000,
      },
    }),
  ]);
  console.log('✅ Created portfolios for other contractors');

  // ==================== PROJECT DOCUMENTS ====================
  
  // Documents for Project 2 (Renovasi)
  await Promise.all([
    prisma.projectDocument.create({
      data: {
        projectId: owner1Projects[1].id,
        uploadedBy: owners[0].id,
        name: 'Kontrak Kerja Renovasi',
        type: 'KONTRAK',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
        fileSize: 2450,
        description: 'Kontrak kerja renovasi rumah type 45',
        isApproved: true,
        approvedAt: new Date('2025-01-14'),
        approvedBy: owners[0].id,
        viewCount: 12,
        downloadCount: 5,
      },
    }),
    prisma.projectDocument.create({
      data: {
        projectId: owner1Projects[1].id,
        uploadedBy: owners[0].id,
        name: 'Gambar Desain Renovasi',
        type: 'GAMBAR',
        fileUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
        fileSize: 3500,
        description: 'Gambar desain renovasi lantai 1 dan 2',
        isApproved: true,
        approvedAt: new Date('2025-01-14'),
        approvedBy: owners[0].id,
        viewCount: 28,
        downloadCount: 8,
      },
    }),
    prisma.projectDocument.create({
      data: {
        projectId: owner1Projects[1].id,
        uploadedBy: owners[0].id,
        name: 'RAB Renovasi Detail',
        type: 'RAB',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
        fileSize: 1200,
        description: 'Rencana Anggaran Biaya renovasi',
        isApproved: true,
        approvedAt: new Date('2025-01-14'),
        approvedBy: owners[0].id,
        viewCount: 15,
        downloadCount: 7,
      },
    }),
    prisma.projectDocument.create({
      data: {
        projectId: owner1Projects[1].id,
        uploadedBy: owners[0].id,
        name: 'Invoice Milestone 1',
        type: 'INVOICE',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
        fileSize: 850,
        description: 'Invoice untuk milestone persiapan dan pembongkaran',
        isApproved: true,
        approvedAt: new Date('2025-01-25'),
        approvedBy: owners[0].id,
        viewCount: 8,
        downloadCount: 3,
      },
    }),
    prisma.projectDocument.create({
      data: {
        projectId: owner1Projects[1].id,
        uploadedBy: owners[0].id,
        name: 'SPK Pekerjaan Struktur',
        type: 'SPK',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
        fileSize: 650,
        description: 'Surat Perintah Kerja untuk pekerjaan struktur',
        isApproved: false,
        viewCount: 5,
        downloadCount: 2,
      },
    }),
  ]);
  console.log('✅ Created documents for Project 2');

  // Documents for Project 4 (Garasi)
  await Promise.all([
    prisma.projectDocument.create({
      data: {
        projectId: owner1Projects[3].id,
        uploadedBy: owners[0].id,
        name: 'Kontrak Pembangunan Garasi',
        type: 'KONTRAK',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
        fileSize: 2100,
        description: 'Kontrak pembangunan garasi dan carport',
        isApproved: true,
        approvedAt: new Date('2025-02-09'),
        approvedBy: owners[0].id,
        viewCount: 7,
        downloadCount: 3,
      },
    }),
    prisma.projectDocument.create({
      data: {
        projectId: owner1Projects[3].id,
        uploadedBy: owners[0].id,
        name: 'Gambar Desain Garasi',
        type: 'GAMBAR',
        fileUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        fileSize: 2800,
        description: 'Gambar desain garasi dan carport minimalis',
        isApproved: true,
        approvedAt: new Date('2025-02-09'),
        approvedBy: owners[0].id,
        viewCount: 14,
        downloadCount: 4,
      },
    }),
  ]);
  console.log('✅ Created documents for Project 4');

  // ==================== FAVORITES ====================
  
  // Demo Owner favorites
  await Promise.all([
    prisma.favorite.create({
      data: {
        userId: owners[0].id,
        contractorId: contractors[0].id,
        notes: 'Kontraktor terpercaya, sudah 2x bekerja sama',
      },
    }),
    prisma.favorite.create({
      data: {
        userId: owners[0].id,
        contractorId: contractors[2].id,
        notes: 'Rating tertinggi, untuk proyek besar',
      },
    }),
  ]);
  console.log('✅ Created favorites for Demo Owner');

  // ==================== NOTIFICATIONS ====================
  
  // Notifications for Demo Owner
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: owners[0].id,
        title: 'Penawaran Baru Diterima',
        message: 'PT Rumah Idaman Konstruksi mengirimkan penawaran untuk proyek "Pembangunan Rumah 2 Lantai di Depok"',
        type: 'BID_RECEIVED',
        relatedId: owner1Projects[0].id,
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: owners[0].id,
        title: 'Penawaran Baru Diterima',
        message: 'PT Konstrukindo Maju Jaya mengirimkan penawaran untuk proyek "Pembangunan Rumah 2 Lantai di Depok"',
        type: 'BID_RECEIVED',
        relatedId: owner1Projects[0].id,
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: owners[0].id,
        title: 'Milestone Selesai',
        message: 'Milestone "Pekerjaan Struktur dan Atap" pada proyek "Renovasi Total Rumah Type 45" telah selesai.',
        type: 'PROJECT_UPDATE',
        relatedId: owner1Projects[1].id,
        isRead: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: owners[0].id,
        title: 'Pembayaran Dikonfirmasi',
        message: 'Pembayaran Rp 120.000.000 untuk milestone "Pekerjaan Struktur dan Atap" telah dikonfirmasi.',
        type: 'PAYMENT',
        isRead: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: owners[0].id,
        title: 'Proyek Diperbarui',
        message: 'Progress proyek "Renovasi Total Rumah Type 45" mencapai 40%.',
        type: 'PROJECT_UPDATE',
        relatedId: owner1Projects[1].id,
        isRead: true,
      },
    }),
  ]);
  console.log('✅ Created notifications for Demo Owner');

  // Notifications for Demo Contractor
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: contractors[0].id,
        title: 'Penawaran Diterima',
        message: 'Penawaran Anda untuk proyek "Pembangunan Garasi dan Carport" telah diterima!',
        type: 'BID_ACCEPTED',
        relatedId: owner1Projects[3].id,
        isRead: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: contractors[0].id,
        title: 'Pembayaran Diterima',
        message: 'Pembayaran Rp 60.000.000 telah diterima untuk milestone "Pondasi dan Struktur".',
        type: 'PAYMENT',
        isRead: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: contractors[0].id,
        title: 'Proyek Baru Tersedia',
        message: 'Proyek baru "Pembangunan Rumah 2 Lantai di Depok" sesuai dengan spesialisasi Anda.',
        type: 'NEW_PROJECT',
        relatedId: owner1Projects[0].id,
        isRead: false,
      },
    }),
  ]);
  console.log('✅ Created notifications for Demo Contractor');

  // ==================== CONVERSATIONS & MESSAGES ====================
  
  // Conversation between Demo Owner and Demo Contractor
  const conversation1 = await prisma.conversation.create({
    data: {
      user1Id: owners[0].id,
      user2Id: contractors[0].id,
      projectId: owner1Projects[3].id,
      lastMessage: 'Baik Pak, saya akan koordinasi dengan tim untuk mempercepat pemasangan atap.',
      lastMessageAt: new Date('2025-02-27T10:30:00'),
    },
  });

  // Messages for conversation 1
  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conversation1.id,
        senderId: owners[0].id,
        content: 'Selamat pagi Pak Ahmad, bagaimana progress pemasangan atap carport?',
        createdAt: new Date('2025-02-27T09:00:00'),
        isRead: true,
        readAt: new Date('2025-02-27T09:15:00'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation1.id,
        senderId: contractors[0].id,
        content: 'Selamat pagi Pak Andriansyah. Progress sudah 60%, kami sedang memasang rangka atap polycarbonate.',
        createdAt: new Date('2025-02-27T09:15:00'),
        isRead: true,
        readAt: new Date('2025-02-27T09:20:00'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation1.id,
        senderId: owners[0].id,
        content: 'Apakah bisa dipercepat? Saya berharap selesai sebelum bulan Ramadhan.',
        createdAt: new Date('2025-02-27T09:30:00'),
        isRead: true,
        readAt: new Date('2025-02-27T10:00:00'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation1.id,
        senderId: contractors[0].id,
        content: 'Baik Pak, saya akan koordinasi dengan tim untuk mempercepat pemasangan atap.',
        createdAt: new Date('2025-02-27T10:30:00'),
        isRead: true,
        readAt: new Date('2025-02-27T10:35:00'),
      },
    }),
  ]);
  console.log('✅ Created conversation 1 with messages');

  // Conversation between Demo Owner and PT Rumah Idaman
  const conversation2 = await prisma.conversation.create({
    data: {
      user1Id: owners[0].id,
      user2Id: contractors[1].id,
      projectId: owner1Projects[1].id,
      lastMessage: 'Terima kasih Pak Budi, saya akan cek di lokasi besok.',
      lastMessageAt: new Date('2025-02-26T16:00:00'),
    },
  });

  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conversation2.id,
        senderId: contractors[1].id,
        content: 'Pak, milestone kedua sudah selesai. Bisa dicek hasil pekerjaan struktur dan atap.',
        createdAt: new Date('2025-02-25T14:00:00'),
        isRead: true,
        readAt: new Date('2025-02-25T15:00:00'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation2.id,
        senderId: owners[0].id,
        content: 'Baik Pak Budi, hasilnya bagus. Invoice sudah saya proses.',
        createdAt: new Date('2025-02-26T10:00:00'),
        isRead: true,
        readAt: new Date('2025-02-26T10:30:00'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation2.id,
        senderId: contractors[1].id,
        content: 'Terima kasih Pak. Untuk milestone 3, kami akan mulai pemasangan lantai besok.',
        createdAt: new Date('2025-02-26T15:00:00'),
        isRead: true,
        readAt: new Date('2025-02-26T15:30:00'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation2.id,
        senderId: owners[0].id,
        content: 'Terima kasih Pak Budi, saya akan cek di lokasi besok.',
        createdAt: new Date('2025-02-26T16:00:00'),
        isRead: true,
        readAt: new Date('2025-02-26T16:30:00'),
      },
    }),
  ]);
  console.log('✅ Created conversation 2 with messages');

  // Conversation between Demo Owner and PT Konstrukindo (about bid)
  const conversation3 = await prisma.conversation.create({
    data: {
      user1Id: owners[0].id,
      user2Id: contractors[2].id,
      projectId: owner1Projects[0].id,
      lastMessage: 'Baik Bu Dewi, saya akan pertimbangkan penawarannya.',
      lastMessageAt: new Date('2025-02-28T11:00:00'),
    },
  });

  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conversation3.id,
        senderId: contractors[2].id,
        content: 'Selamat siang Pak, saya dari PT Konstrukindo. Tertarik dengan proyek pembangunan rumah di Depok.',
        createdAt: new Date('2025-02-27T13:00:00'),
        isRead: true,
        readAt: new Date('2025-02-27T14:00:00'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation3.id,
        senderId: owners[0].id,
        content: 'Selamat siang Bu Dewi. Ya, proyeknya masih open untuk penawaran.',
        createdAt: new Date('2025-02-27T14:30:00'),
        isRead: true,
        readAt: new Date('2025-02-27T15:00:00'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation3.id,
        senderId: contractors[2].id,
        content: 'Kami sudah kirim penawaran dengan harga Rp 1.180.000.000 dan durasi 165 hari. Dengan pengalaman 20 tahun, kami jamin kualitas terbaik.',
        createdAt: new Date('2025-02-28T10:00:00'),
        isRead: true,
        readAt: new Date('2025-02-28T10:30:00'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation3.id,
        senderId: owners[0].id,
        content: 'Baik Bu Dewi, saya akan pertimbangkan penawarannya.',
        createdAt: new Date('2025-02-28T11:00:00'),
        isRead: false,
      },
    }),
  ]);
  console.log('✅ Created conversation 3 with messages');

  // ==================== USER DOCUMENTS ====================
  
  // User documents for verification
  await Promise.all([
    prisma.document.create({
      data: {
        userId: owners[0].id,
        type: 'KTP',
        name: 'KTP Andriansyah Putra',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
        verified: true,
        verifiedAt: new Date('2024-12-01'),
      },
    }),
    prisma.document.create({
      data: {
        userId: contractors[0].id,
        type: 'KTP',
        name: 'KTP Ahmad Sulaiman',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
        verified: true,
        verifiedAt: new Date('2024-11-15'),
      },
    }),
    prisma.document.create({
      data: {
        userId: contractors[0].id,
        type: 'SIUP',
        name: 'SIUP PT Bangun Permai Sejahtera',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
        verified: true,
        verifiedAt: new Date('2024-11-15'),
      },
    }),
  ]);
  console.log('✅ Created user documents');

  console.log('\n========================================');
  console.log('✅ SEED COMPLETED SUCCESSFULLY!');
  console.log('========================================');
  console.log('\n📋 Demo Accounts:');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ Demo Owner:                                                │');
  console.log('│   Email: andriansyah@gmail.com                             │');
  console.log('│   Password: password123                                    │');
  console.log('│                                                            │');
  console.log('│ Demo Contractor:                                           │');
  console.log('│   Email: info@ptbangunpermai.co.id                         │');
  console.log('│   Password: password123                                    │');
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log('\n📊 Data Summary:');
  console.log(`   - ${await prisma.user.count()} users`);
  console.log(`   - ${await prisma.project.count()} projects`);
  console.log(`   - ${await prisma.bid.count()} bids`);
  console.log(`   - ${await prisma.projectMilestone.count()} milestones`);
  console.log(`   - ${await prisma.payment.count()} payments`);
  console.log(`   - ${await prisma.projectDocument.count()} project documents`);
  console.log(`   - ${await prisma.portfolio.count()} portfolios`);
  console.log(`   - ${await prisma.notification.count()} notifications`);
  console.log(`   - ${await prisma.conversation.count()} conversations`);
  console.log(`   - ${await prisma.message.count()} messages`);
  console.log(`   - ${await prisma.favorite.count()} favorites`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
