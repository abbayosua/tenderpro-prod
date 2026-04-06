import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isVerified = searchParams.get('isVerified');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { userId };
    if (isVerified === 'true') {
      where.isVerified = true;
    }

    const certifications = await db.certification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      certifications,
      total: certifications.length,
      verifiedCount: certifications.filter(c => c.isVerified).length,
    });
  } catch (error) {
    console.error('Get certifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat sertifikasi' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      type,
      number,
      issuedBy,
      issuedAt,
      expiresAt,
      fileUrl,
    } = body;

    if (!userId || !type || !number || !issuedBy || !issuedAt || !fileUrl) {
      return NextResponse.json(
        { success: false, error: 'Data tidak lengkap. User ID, jenis sertifikasi, nomor, penerbit, tanggal terbit, dan file diperlukan.' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { contractor: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if certification with same number already exists
    const existingCert = await db.certification.findFirst({
      where: { number },
    });

    if (existingCert) {
      return NextResponse.json(
        { success: false, error: 'Sertifikasi dengan nomor ini sudah terdaftar' },
        { status: 400 }
      );
    }

    const certification = await db.certification.create({
      data: {
        userId,
        type,
        number,
        issuedBy,
        issuedAt: new Date(issuedAt),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        fileUrl,
      },
    });

    // Award CERTIFIED badge if contractor has 3+ verified certifications
    const allCerts = await db.certification.findMany({
      where: { userId, isVerified: true },
    });

    if (user.contractor && allCerts.length >= 2) {
      const existingBadge = await db.badge.findFirst({
        where: {
          contractorId: userId,
          type: 'CERTIFIED',
        },
      });

      if (!existingBadge) {
        await db.badge.create({
          data: {
            contractorId: userId,
            type: 'CERTIFIED',
            label: 'Tersertifikasi',
            description: 'Kontraktor memiliki sertifikasi resmi yang terverifikasi',
            icon: '🏆',
          },
        });
      }
    }

    // Award LOCAL_CHAMPION badge for specific Indonesian certifications
    const localCertTypes = ['SIUJK', 'SBU', 'SKA', 'SKT'];
    const hasLocalCerts = await db.certification.findMany({
      where: {
        userId,
        type: { in: localCertTypes },
        isVerified: true,
      },
    });

    if (user.contractor && hasLocalCerts.length >= 1) {
      const existingLocalBadge = await db.badge.findFirst({
        where: {
          contractorId: userId,
          type: 'LOCAL_CHAMPION',
        },
      });

      if (!existingLocalBadge) {
        await db.badge.create({
          data: {
            contractorId: userId,
            type: 'LOCAL_CHAMPION',
            label: 'Kontraktor Lokal',
            description: 'Memiliki sertifikasi resmi Indonesia (SIUJK/SBU/SKA/SKT)',
            icon: '🇮🇩',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      certification,
    });
  } catch (error) {
    console.error('Create certification error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat sertifikasi' },
      { status: 500 }
    );
  }
}
