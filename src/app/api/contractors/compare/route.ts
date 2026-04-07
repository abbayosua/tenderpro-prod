import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractorIds } = body;

    if (!contractorIds || !Array.isArray(contractorIds) || contractorIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'contractorIds diperlukan' },
        { status: 400 }
      );
    }

    if (contractorIds.length > 3) {
      return NextResponse.json(
        { success: false, error: 'Maksimal 3 kontraktor untuk perbandingan' },
        { status: 400 }
      );
    }

    const contractors = await db.user.findMany({
      where: {
        id: { in: contractorIds },
        role: 'CONTRACTOR',
      },
      include: {
        contractor: true,
        certifications: {
          where: { isVerified: true },
          select: { type: true, number: true, issuedBy: true },
        },
        givenReviews: {
          select: { rating: true },
        },
        bids: {
          where: { status: 'ACCEPTED' },
          select: { price: true },
        },
        badges: {
          select: { type: true, label: true, icon: true },
        },
        _count: {
          select: {
            bids: true,
            givenReviews: true,
            certifications: true,
          },
        },
      },
    });

    if (contractors.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Kontraktor tidak ditemukan' },
        { status: 404 }
      );
    }

    const comparison = contractors.map((c) => {
      const profile = c.contractor;
      const avgRating = c._count.givenReviews > 0
        ? c.givenReviews.reduce((sum, r) => sum + r.rating, 0) / c._count.givenReviews
        : 0;
      const avgBidPrice = c.bids.length > 0
        ? c.bids.reduce((sum, b) => sum + b.price, 0) / c.bids.length
        : 0;

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        avatar: c.avatar,
        isVerified: c.isVerified,
        verificationStatus: c.verificationStatus,
        rating: parseFloat(avgRating.toFixed(1)),
        totalReviews: c._count.givenReviews,
        totalBids: c._count.bids,
        specialization: profile?.specialization || null,
        experienceYears: profile?.experienceYears || 0,
        completedProjects: profile?.completedProjects || 0,
        totalProjects: profile?.totalProjects || 0,
        city: profile?.city || null,
        province: profile?.province || null,
        companyName: profile?.companyName || null,
        certifications: c.certifications.map((cert) => ({
          type: cert.type,
          number: cert.number,
          issuedBy: cert.issuedBy,
        })),
        certificationCount: c._count.certifications,
        averageBidPrice: avgBidPrice,
        badges: c.badges.map((b) => ({
          type: b.type,
          label: b.label,
          icon: b.icon,
        })),
        badgeCount: c.badges.length,
      };
    });

    return NextResponse.json({
      success: true,
      contractors: comparison,
    });
  } catch (error) {
    console.error('Error comparing contractors:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membandingkan kontraktor' },
      { status: 500 }
    );
  }
}
