import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Contractor ID diperlukan' },
        { status: 400 }
      );
    }

    // Fetch full contractor profile
    const contractor = await db.user.findUnique({
      where: { id },
      include: {
        contractor: {
          include: {
            portfolios: {
              orderBy: { createdAt: 'desc' },
            },
            certifications: {
              orderBy: { createdAt: 'desc' },
            },
            badges: {
              orderBy: { earnedAt: 'desc' },
            },
          },
        },
        documents: {
          where: { verified: true },
        },
        bids: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                category: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        receivedReviews: {
          include: {
            fromUser: {
              select: {
                id: true,
                name: true,
                avatar: true,
                owner: {
                  select: { companyName: true },
                },
              },
            },
            project: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!contractor || contractor.role !== 'CONTRACTOR') {
      return NextResponse.json(
        { success: false, error: 'Kontraktor tidak ditemukan' },
        { status: 404 }
      );
    }

    if (!contractor.contractor) {
      return NextResponse.json(
        { success: false, error: 'Profil kontraktor belum lengkap' },
        { status: 404 }
      );
    }

    const profile = contractor.contractor;

    // Calculate response rate and metrics
    const totalBids = contractor.bids.length;
    const acceptedBids = contractor.bids.filter(b => b.status === 'ACCEPTED').length;
    const pendingBids = contractor.bids.filter(b => b.status === 'PENDING').length;
    const rejectedBids = contractor.bids.filter(b => b.status === 'REJECTED').length;
    const responseRate = totalBids > 0 ? Math.round((totalBids / (totalBids + pendingBids)) * 100) : 0;
    const winRate = totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 0;

    // Reviews summary
    const totalReviews = contractor.receivedReviews.length;
    const avgRating = totalReviews > 0
      ? parseFloat((contractor.receivedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : profile.rating;

    const avgProfessionalism = totalReviews > 0
      ? parseFloat((contractor.receivedReviews.reduce((sum, r) => sum + r.professionalism, 0) / totalReviews).toFixed(1))
      : 0;
    const avgQuality = totalReviews > 0
      ? parseFloat((contractor.receivedReviews.reduce((sum, r) => sum + r.quality, 0) / totalReviews).toFixed(1))
      : 0;
    const avgTimeliness = totalReviews > 0
      ? parseFloat((contractor.receivedReviews.reduce((sum, r) => sum + r.timeliness, 0) / totalReviews).toFixed(1))
      : 0;

    // Check if local contractor (has Indonesian certifications or LOCAL_CHAMPION badge)
    const isLocal = profile.badges.some(b => b.type === 'LOCAL_CHAMPION') ||
      profile.certifications.some(c =>
        ['SIUJK', 'SBU', 'SKA', 'SKT'].includes(c.type) && c.isVerified
      );

    // Format portfolio images
    const formattedPortfolios = profile.portfolios.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      clientName: p.clientName,
      location: p.location,
      year: p.year,
      budget: p.budget,
      images: p.images ? JSON.parse(p.images) : [],
      createdAt: p.createdAt,
    }));

    // Format certifications
    const formattedCertifications = profile.certifications.map(c => ({
      id: c.id,
      type: c.type,
      number: c.number,
      issuedBy: c.issuedBy,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
      isVerified: c.isVerified,
      isExpired: c.expiresAt ? new Date(c.expiresAt) < new Date() : false,
    }));

    // Format badges
    const formattedBadges = profile.badges.map(b => ({
      id: b.id,
      type: b.type,
      label: b.label,
      description: b.description,
      icon: b.icon,
      earnedAt: b.earnedAt,
    }));

    // Completed projects from accepted bids
    const completedProjects = contractor.bids
      .filter(b => b.status === 'ACCEPTED')
      .map(b => ({
        id: b.project.id,
        title: b.project.title,
        category: b.project.category,
        status: b.project.status,
        price: b.price,
        duration: b.duration,
        bidDate: b.createdAt,
      }));

    return NextResponse.json({
      success: true,
      contractor: {
        id: contractor.id,
        name: contractor.name,
        email: contractor.email,
        phone: contractor.phone,
        avatar: contractor.avatar,
        isVerified: contractor.isVerified,
        verificationStatus: contractor.verificationStatus,
        isLocal,

        company: {
          name: profile.companyName,
          type: profile.companyType,
          npwp: profile.npwp,
          nib: profile.nib,
          address: profile.address,
          city: profile.city,
          province: profile.province,
          postalCode: profile.postalCode,
          specialization: profile.specialization,
          experienceYears: profile.experienceYears,
          employeeCount: profile.employeeCount,
          description: profile.description,
        },

        stats: {
          totalProjects: profile.totalProjects,
          completedProjects: profile.completedProjects,
          totalBids,
          acceptedBids,
          pendingBids,
          rejectedBids,
          winRate,
          responseRate,
          rating: avgRating,
          totalReviews,
        },

        ratingBreakdown: {
          averageRating: avgRating,
          professionalism: avgProfessionalism,
          quality: avgQuality,
          timeliness: avgTimeliness,
        },

        certifications: formattedCertifications,
        badges: formattedBadges,
        portfolios: formattedPortfolios,
        completedProjects,
        verifiedDocuments: contractor.documents.length,

        reviews: contractor.receivedReviews.map(r => ({
          id: r.id,
          rating: r.rating,
          review: r.review,
          professionalism: r.professionalism,
          quality: r.quality,
          timeliness: r.timeliness,
          createdAt: r.createdAt,
          fromUser: {
            id: r.fromUser.id,
            name: r.fromUser.name,
            avatar: r.fromUser.avatar,
            company: r.fromUser.owner?.companyName,
          },
          project: r.project,
        })),
      },
    });
  } catch (error) {
    console.error('Get contractor profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat profil kontraktor' },
      { status: 500 }
    );
  }
}
