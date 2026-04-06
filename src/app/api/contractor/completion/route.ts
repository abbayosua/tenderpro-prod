import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId wajib diisi' },
        { status: 400 }
      );
    }

    // Fetch user with contractor profile and related data
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatar: true,
        isVerified: true,
        verificationStatus: true,
        contractor: {
          select: {
            companyName: true,
            companyType: true,
            specialization: true,
            experienceYears: true,
            description: true,
            city: true,
            province: true,
            npwp: true,
          },
        },
        certifications: {
          select: { id: true },
          take: 1,
        },
        portfolios: {
          select: { id: true },
          take: 1,
        },
        documents: {
          select: { id: true, type: true, verified: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    const contractor = user.contractor;

    // Calculate completion for each section
    const sections = [
      {
        name: 'Data Dasar',
        completed: !!(user.name && user.name.trim().length > 0),
        weight: 20,
      },
      {
        name: 'Profil Perusahaan',
        completed: !!(
          contractor?.companyName &&
          contractor?.companyName.trim().length > 0 &&
          contractor?.specialization &&
          contractor?.specialization.trim().length > 0
        ),
        weight: 20,
      },
      {
        name: 'Sertifikasi',
        completed: user.certifications.length > 0,
        weight: 15,
        hint: 'Unggah minimal 1 sertifikasi',
      },
      {
        name: 'Portfolio',
        completed: user.portfolios.length > 0,
        weight: 15,
        hint: 'Tambahkan minimal 1 portfolio',
      },
      {
        name: 'Foto Profil',
        completed: !!user.avatar,
        weight: 10,
        hint: 'Unggah foto profil',
      },
      {
        name: 'Verifikasi',
        completed: user.isVerified || user.verificationStatus === 'VERIFIED',
        weight: 10,
        hint: 'Lengkapi verifikasi dokumen',
      },
      {
        name: 'NPWP',
        completed: !!contractor?.npwp && contractor.npwp.trim().length > 0,
        weight: 10,
        hint: 'Masukkan NPWP perusahaan',
      },
    ];

    const completedWeight = sections
      .filter(s => s.completed)
      .reduce((sum, s) => sum + s.weight, 0);
    const totalWeight = sections.reduce((sum, s) => sum + s.weight, 0);
    const percentage = Math.round((completedWeight / totalWeight) * 100);

    // Generate suggestions based on incomplete sections
    const suggestions: string[] = [];
    for (const section of sections) {
      if (!section.completed && section.hint) {
        switch (section.name) {
          case 'Sertifikasi':
            suggestions.push('Unggah sertifikasi untuk meningkatkan kepercayaan pemilik proyek');
            break;
          case 'Portfolio':
            suggestions.push('Tambahkan portfolio untuk showcase kemampuan dan pengalaman Anda');
            break;
          case 'Foto Profil':
            suggestions.push('Unggah foto profil agar lebih dikenal dan dipercaya klien');
            break;
          case 'Verifikasi':
            suggestions.push('Lengkapi verifikasi identitas untuk mendapatkan badge terverifikasi');
            break;
          case 'NPWP':
            suggestions.push('Masukkan NPWP perusahaan untuk kemudahan proses pembayaran');
            break;
          case 'Profil Perusahaan':
            suggestions.push('Lengkapi profil perusahaan dengan spesialisasi yang jelas');
            break;
          default:
            suggestions.push(section.hint);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        percentage,
        sections,
        suggestions,
        completedSections: sections.filter(s => s.completed).length,
        totalSections: sections.length,
      },
    });
  } catch (error) {
    console.error('Gagal memuat data profil completion:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memuat data' },
      { status: 500 }
    );
  }
}
