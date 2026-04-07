import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Support both userId and contractorId params
    const contractorId = searchParams.get('userId') || searchParams.get('contractorId');

    if (!contractorId) {
      return NextResponse.json(
        { success: false, error: 'User ID atau Contractor ID diperlukan' },
        { status: 400 }
      );
    }

    // Fetch individual reviews with reviewer and project data
    const reviews = await db.review.findMany({
      where: { toContractorId: contractorId },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isVerified: true,
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
    });

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return NextResponse.json({
        success: true,
        averageRating: 0,
        totalReviews: 0,
        breakdown: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
        categoryAverages: {
          professionalism: 0,
          quality: 0,
          timeliness: 0,
        },
        reviews: [],
      });
    }

    // Calculate overall average rating
    const averageRating = parseFloat(
      (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    );

    // Calculate star breakdown
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const review of reviews) {
      const star = Math.min(5, Math.max(1, review.rating));
      breakdown[star as keyof typeof breakdown]++;
    }

    // Calculate category averages
    const categoryAverages = {
      professionalism: parseFloat(
        (reviews.reduce((sum, r) => sum + r.professionalism, 0) / totalReviews).toFixed(1)
      ),
      quality: parseFloat(
        (reviews.reduce((sum, r) => sum + r.quality, 0) / totalReviews).toFixed(1)
      ),
      timeliness: parseFloat(
        (reviews.reduce((sum, r) => sum + r.timeliness, 0) / totalReviews).toFixed(1)
      ),
    };

    // Format individual reviews
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
        isVerified: r.fromUser.isVerified,
        company: r.fromUser.owner?.companyName,
      },
      project: {
        id: r.project.id,
        title: r.project.title,
        category: r.project.category,
      },
    }));

    return NextResponse.json({
      success: true,
      averageRating,
      totalReviews,
      breakdown,
      categoryAverages,
      reviews: formattedReviews,
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat peringkat' },
      { status: 500 }
    );
  }
}
