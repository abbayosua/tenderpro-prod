import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!contractorId) {
      return NextResponse.json(
        { success: false, error: 'Contractor ID diperlukan' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { toContractorId: contractorId };

    if (projectId) {
      where.projectId = projectId;
    }

    const reviews = await db.review.findMany({
      where,
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
            owner: {
              select: {
                companyName: true,
              },
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
      take: limit,
    });

    // Calculate averages
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 0;
    const avgProfessionalism = totalReviews > 0
      ? parseFloat((reviews.reduce((sum, r) => sum + r.professionalism, 0) / totalReviews).toFixed(1))
      : 0;
    const avgQuality = totalReviews > 0
      ? parseFloat((reviews.reduce((sum, r) => sum + r.quality, 0) / totalReviews).toFixed(1))
      : 0;
    const avgTimeliness = totalReviews > 0
      ? parseFloat((reviews.reduce((sum, r) => sum + r.timeliness, 0) / totalReviews).toFixed(1))
      : 0;

    const formattedReviews = reviews.map((r) => ({
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
    }));

    return NextResponse.json({
      success: true,
      reviews: formattedReviews,
      averageRating: avgRating,
      totalReviews,
      categoryAverages: {
        professionalism: avgProfessionalism,
        quality: avgQuality,
        timeliness: avgTimeliness,
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat ulasan' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fromUserId,
      toContractorId,
      projectId,
      rating,
      review,
      professionalism = 5,
      quality = 5,
      timeliness = 5,
    } = body;

    // Validation
    if (!fromUserId || !toContractorId || !projectId || !rating) {
      return NextResponse.json(
        { success: false, error: 'Data tidak lengkap. User ID, Contractor ID, Project ID, dan rating diperlukan.' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating harus antara 1-5' },
        { status: 400 }
      );
    }

    if (fromUserId === toContractorId) {
      return NextResponse.json(
        { success: false, error: 'Tidak dapat memberikan review kepada diri sendiri' },
        { status: 400 }
      );
    }

    // Check if review already exists for this user-project combination
    const existingReview = await db.review.findUnique({
      where: {
        fromUserId_projectId: {
          fromUserId,
          projectId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'Anda sudah memberikan ulasan untuk proyek ini' },
        { status: 400 }
      );
    }

    // Check if contractor exists
    const contractor = await db.user.findUnique({
      where: { id: toContractorId },
      include: { contractor: true },
    });

    if (!contractor || contractor.role !== 'CONTRACTOR') {
      return NextResponse.json(
        { success: false, error: 'Kontraktor tidak ditemukan' },
        { status: 404 }
      );
    }

    // Create the review
    const newReview = await db.review.create({
      data: {
        fromUserId,
        toContractorId,
        projectId,
        rating: parseInt(String(rating)),
        review: review || null,
        professionalism: Math.min(5, Math.max(1, parseInt(String(professionalism)))),
        quality: Math.min(5, Math.max(1, parseInt(String(quality)))),
        timeliness: Math.min(5, Math.max(1, parseInt(String(timeliness)))),
      },
    });

    // Update contractor's average rating
    const allReviews = await db.review.findMany({
      where: { toContractorId },
      select: { rating: true },
    });
    const newAvgRating = allReviews.length > 0
      ? parseFloat((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1))
      : 0;

    if (contractor.contractor) {
      await db.contractorProfile.update({
        where: { userId: toContractorId },
        data: { rating: newAvgRating },
      });
    }

    return NextResponse.json({
      success: true,
      review: newReview,
      updatedRating: newAvgRating,
    });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat ulasan' },
      { status: 500 }
    );
  }
}
