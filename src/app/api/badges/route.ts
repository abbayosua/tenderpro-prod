import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');

    if (!contractorId) {
      return NextResponse.json(
        { success: false, error: 'Contractor ID diperlukan' },
        { status: 400 }
      );
    }

    const badges = await db.badge.findMany({
      where: { contractorId },
      orderBy: { earnedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      badges,
      total: badges.length,
    });
  } catch (error) {
    console.error('Get badges error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat badge' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contractorId,
      type,
      label,
      description,
      icon,
    } = body;

    if (!contractorId || !type || !label) {
      return NextResponse.json(
        { success: false, error: 'Data tidak lengkap. Contractor ID, tipe, dan label diperlukan.' },
        { status: 400 }
      );
    }

    // Check if contractor profile exists
    const contractor = await db.contractorProfile.findUnique({
      where: { userId: contractorId },
    });

    if (!contractor) {
      return NextResponse.json(
        { success: false, error: 'Profil kontraktor tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if badge type already exists for this contractor
    const existingBadge = await db.badge.findFirst({
      where: { contractorId, type },
    });

    if (existingBadge) {
      return NextResponse.json(
        { success: false, error: `Badge tipe "${type}" sudah dimiliki oleh kontraktor ini` },
        { status: 400 }
      );
    }

    const badge = await db.badge.create({
      data: {
        contractorId,
        type,
        label,
        description: description || null,
        icon: icon || null,
      },
    });

    return NextResponse.json({
      success: true,
      badge,
    });
  } catch (error) {
    console.error('Create badge error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memberikan badge' },
      { status: 500 }
    );
  }
}
