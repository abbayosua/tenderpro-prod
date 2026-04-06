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

    // Fetch all reviews for this contractor
    const reviews = await db.review.findMany({
      where: { toContractorId: contractorId },
      select: {
        rating: true,
        professionalism: true,
        quality: true,
        timeliness: true,
      },
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

    return NextResponse.json({
      success: true,
      averageRating,
      totalReviews,
      breakdown,
      categoryAverages,
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat peringkat' },
      { status: 500 }
    );
  }
}
