import { config } from 'dotenv';
config();

import { PrismaClient, UserRole, ProjectStatus, BidStatus, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
  
  // Clear existing data
  await prisma.bid.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.document.deleteMany();
  await prisma.verificationRequest.deleteMany();
  await prisma.project.deleteMany();
  await prisma.contractorProfile.deleteMany();
  await prisma.ownerProfile.deleteMany();
  await prisma.user.deleteMany();
  console.log('Cleared existing data');

  const hashedPassword = await bcrypt.hash('password123', 10);

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
  console.log('Created admin:', admin.email);

  // Create Contractors
  const contractors = await Promise.all([
    prisma.user.create({
      data: {
        email: 'info@ptbangunpermai.co.id',
        password: hashedPassword,
        name: 'Ahmad Sulaiman',
        phone: '081234567890',
        role: UserRole.CONTRACTOR,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
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
            description: 'Perusahaan konstruksi terpercaya dengan pengalaman lebih dari 15 tahun.',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'info@ptrumahidaman.co.id',
        password: hashedPassword,
        name: 'Budi Santoso',
        phone: '082345678901',
        role: UserRole.CONTRACTOR,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
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
            description: 'Spesialis renovasi dan desain interior rumah tinggal.',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'info@ptkonstrukindo.co.id',
        password: hashedPassword,
        name: 'Dewi Kartika',
        phone: '083456789012',
        role: UserRole.CONTRACTOR,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
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
            description: 'Perusahaan konstruksi skala besar dengan pengalaman 20 tahun.',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'info@ptrenovasi.co.id',
        password: hashedPassword,
        name: 'Eko Prasetyo',
        phone: '084567890123',
        role: UserRole.CONTRACTOR,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
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
            description: 'Ahli renovasi dan pemeliharaan rumah.',
          },
        },
      },
    }),
  ]);
  console.log('Created', contractors.length, 'contractors');

  // Create Project Owners
  const owners = await Promise.all([
    prisma.user.create({
      data: {
        email: 'andriansyah@gmail.com',
        password: hashedPassword,
        name: 'Andriansyah Putra',
        phone: '086789012345',
        role: UserRole.OWNER,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
        owner: {
          create: {
            address: 'Jl. Kemang Raya No. 12',
            city: 'Jakarta Selatan',
            province: 'DKI Jakarta',
            postalCode: '12730',
            totalProjects: 3,
            activeProjects: 1,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'ratna.sari@gmail.com',
        password: hashedPassword,
        name: 'Ratna Sari',
        phone: '087890123456',
        role: UserRole.OWNER,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
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
    prisma.user.create({
      data: {
        email: 'info@ptproperti.co.id',
        password: hashedPassword,
        name: 'Hendri Wijaya',
        phone: '088901234567',
        role: UserRole.OWNER,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
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
    prisma.user.create({
      data: {
        email: 'siti.rahayu@gmail.com',
        password: hashedPassword,
        name: 'Siti Rahayu',
        phone: '089012345678',
        role: UserRole.OWNER,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
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
  console.log('Created', owners.length, 'owners');

  // Create Projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        ownerId: owners[0].id,
        title: 'Pembangunan Rumah 2 Lantai di Depok',
        description: 'Pembangunan rumah 2 lantai dengan luas tanah 150m2 dan luas bangunan 200m2.',
        category: 'Pembangunan Baru',
        location: 'Depok, Jawa Barat',
        budget: 1200000000,
        duration: 180,
        status: ProjectStatus.OPEN,
        requirements: JSON.stringify(['IMB', 'Gambar desain', 'RAB detail']),
        viewCount: 234,
      },
    }),
    prisma.project.create({
      data: {
        ownerId: owners[1].id,
        title: 'Renovasi Total Rumah Type 45',
        description: 'Renovasi total rumah type 45 menjadi lebih modern.',
        category: 'Renovasi',
        location: 'Bandung, Jawa Barat',
        budget: 400000000,
        duration: 60,
        status: ProjectStatus.OPEN,
        requirements: JSON.stringify(['Portofolio', 'Timeline']),
        viewCount: 156,
      },
    }),
    prisma.project.create({
      data: {
        ownerId: owners[2].id,
        title: 'Pembangunan Ruko 2 Lantai',
        description: 'Pembangunan 5 unit ruko 2 lantai di lokasi komersial.',
        category: 'Komersial',
        location: 'Tangerang, Banten',
        budget: 5000000000,
        duration: 270,
        status: ProjectStatus.OPEN,
        requirements: JSON.stringify(['Pengalaman 5 tahun', 'NIB dan SIUP']),
        viewCount: 312,
      },
    }),
    prisma.project.create({
      data: {
        ownerId: owners[3].id,
        title: 'Renovasi Dapur dan Kamar Mandi',
        description: 'Renovasi dapur dan 2 kamar mandi.',
        category: 'Renovasi',
        location: 'Surabaya, Jawa Timur',
        budget: 250000000,
        duration: 45,
        status: ProjectStatus.OPEN,
        requirements: JSON.stringify(['Portofolio renovasi']),
        viewCount: 98,
      },
    }),
    prisma.project.create({
      data: {
        ownerId: owners[0].id,
        title: 'Pembangunan Kolam Renang',
        description: 'Pembangunan kolam renang ukuran 4x8 meter.',
        category: 'Fasilitas',
        location: 'Depok, Jawa Barat',
        budget: 350000000,
        duration: 60,
        status: ProjectStatus.IN_PROGRESS,
        requirements: JSON.stringify(['Sertifikat teknis']),
        viewCount: 67,
      },
    }),
  ]);
  console.log('Created', projects.length, 'projects');

  // Get contractor profile IDs
  const contractorProfiles = await prisma.contractorProfile.findMany({
    where: { userId: { in: contractors.map(c => c.id) } }
  });
  const contractorProfileMap = new Map(contractorProfiles.map(p => [p.userId, p.id]));

  // Create Bids
  const bidsData = [
    {
      projectId: projects[0].id,
      contractorId: contractors[0].id,
      proposal: 'Komitmen membangun rumah impian dengan standar kualitas terbaik.',
      price: 1150000000,
      duration: 175,
      status: BidStatus.PENDING,
    },
    {
      projectId: projects[0].id,
      contractorId: contractors[2].id,
      proposal: 'Dengan pengalaman 20 tahun dalam konstruksi.',
      price: 1180000000,
      duration: 165,
      status: BidStatus.PENDING,
    },
    {
      projectId: projects[1].id,
      contractorId: contractors[1].id,
      proposal: 'Spesialis renovasi dengan hasil memuaskan.',
      price: 380000000,
      duration: 55,
      status: BidStatus.PENDING,
    },
    {
      projectId: projects[2].id,
      contractorId: contractors[0].id,
      proposal: 'Pengalaman luas dalam pembangunan ruko.',
      price: 4850000000,
      duration: 260,
      status: BidStatus.PENDING,
    },
    {
      projectId: projects[3].id,
      contractorId: contractors[1].id,
      proposal: 'Renovasi dapur dan kamar mandi berkualitas.',
      price: 235000000,
      duration: 40,
      status: BidStatus.PENDING,
    },
  ];

  for (const bid of bidsData) {
    await prisma.bid.create({ data: bid });
  }
  console.log('Created', bidsData.length, 'bids');

  // Create Portfolios
  const portfoliosData = [
    {
      contractorId: contractorProfileMap.get(contractors[0].id)!,
      title: 'Rumah Mewah 2 Lantai',
      description: 'Pembangunan rumah mewah dengan 5 kamar tidur.',
      category: 'Pembangunan Baru',
      location: 'Kemang, Jakarta Selatan',
      year: 2023,
      budget: 2500000000,
    },
    {
      contractorId: contractorProfileMap.get(contractors[1].id)!,
      title: 'Renovasi Dapur Modern',
      description: 'Renovasi dapur dengan konsep modern.',
      category: 'Renovasi',
      location: 'Bandung',
      year: 2023,
      budget: 350000000,
    },
    {
      contractorId: contractorProfileMap.get(contractors[2].id)!,
      title: 'Gedung Perkantoran',
      description: 'Pembangunan gedung perkantoran 5 lantai.',
      category: 'Komersial',
      location: 'Surabaya',
      year: 2022,
      budget: 25000000000,
    },
  ];

  for (const portfolio of portfoliosData) {
    await prisma.portfolio.create({ data: portfolio });
  }
  console.log('Created', portfoliosData.length, 'portfolios');

  console.log('\n✅ Seed completed successfully!');
  console.log('\nDemo accounts:');
  console.log('Owner: andriansyah@gmail.com / password123');
  console.log('Contractor: info@ptbangunpermai.co.id / password123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
