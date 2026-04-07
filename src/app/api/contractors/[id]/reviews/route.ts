import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch reviews for a contractor with pagination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Contractor ID diperlukan' },
        { status: 400 }
      );
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'newest'; // newest, highest, lowest
    const filterRating = searchParams.get('filterRating') || 'all'; // 1-5 or 'all'
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { toContractorId: id };
    if (filterRating !== 'all') {
      where.rating = parseInt(filterRating);
    }

    // Build orderBy
    const orderBy = sortBy === 'highest'
      ? { rating: 'desc' as const }
      : sortBy === 'lowest'
        ? { rating: 'asc' as const }
        : { createdAt: 'desc' as const };

    // Fetch reviews with pagination
    const reviews = await db.review.findMany({
      where,
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
      orderBy,
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await db.review.count({ where });

    // Calculate averages across ALL reviews (not filtered)
    const allReviews = await db.review.findMany({
      where: { toContractorId: id },
      select: { rating: true, professionalism: true, quality: true, timeliness: true },
    });

    const totalReviews = allReviews.length;
    const avgRating = totalReviews > 0
      ? parseFloat((allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

    const categoryAverages = {
      professionalism: totalReviews > 0
        ? parseFloat((allReviews.reduce((sum, r) => sum + r.professionalism, 0) / totalReviews).toFixed(1))
        : 0,
      quality: totalReviews > 0
        ? parseFloat((allReviews.reduce((sum, r) => sum + r.quality, 0) / totalReviews).toFixed(1))
        : 0,
      timeliness: totalReviews > 0
        ? parseFloat((allReviews.reduce((sum, r) => sum + r.timeliness, 0) / totalReviews).toFixed(1))
        : 0,
    };

    // Rating distribution (5 stars to 1 star)
    const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
      rating: star,
      count: allReviews.filter((r) => r.rating === star).length,
      percentage: totalReviews > 0
        ? parseFloat(((allReviews.filter((r) => r.rating === star).length / totalReviews) * 100).toFixed(1))
        : 0,
    }));

    // Format reviews
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
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + reviews.length < total,
      },
      summary: {
        averageRating: avgRating,
        totalReviews,
        categoryAverages,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching contractor reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat ulasan kontraktor' },
      { status: 500 }
    );
  }
}

// POST - Submit a new review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      fromUserId,
      projectId,
      rating,
      review,
      professionalism = 5,
      quality = 5,
      timeliness = 5,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Contractor ID diperlukan' },
        { status: 400 }
      );
    }

    if (!fromUserId || !projectId || !rating) {
      return NextResponse.json(
        { success: false, error: 'Data tidak lengkap. User ID, Project ID, dan rating diperlukan.' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating harus antara 1-5' },
        { status: 400 }
      );
    }

    if (fromUserId === id) {
      return NextResponse.json(
        { success: false, error: 'Tidak dapat memberikan ulasan kepada diri sendiri' },
        { status: 400 }
      );
    }

    // Check if review already exists
    const existingReview = await db.review.findUnique({
      where: {
        fromUserId_projectId: { fromUserId, projectId },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'Anda sudah memberikan ulasan untuk proyek ini' },
        { status: 400 }
      );
    }

    // Verify contractor exists
    const contractor = await db.user.findUnique({
      where: { id },
      include: { contractor: true },
    });

    if (!contractor || contractor.role !== 'CONTRACTOR') {
      return NextResponse.json(
        { success: false, error: 'Kontraktor tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validate category ratings
    const clampRating = (val: number) => Math.min(5, Math.max(1, parseInt(String(val))));

    // Create review
    const newReview = await db.review.create({
      data: {
        fromUserId,
        toContractorId: id,
        projectId,
        rating: parseInt(String(rating)),
        review: review || null,
        professionalism: clampRating(professionalism),
        quality: clampRating(quality),
        timeliness: clampRating(timeliness),
      },
    });

    // Update contractor average rating
    const allReviews = await db.review.findMany({
      where: { toContractorId: id },
      select: { rating: true },
    });
    const newAvgRating = allReviews.length > 0
      ? parseFloat((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1))
      : 0;

    if (contractor.contractor) {
      await db.contractorProfile.update({
        where: { userId: id },
        data: { rating: newAvgRating },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Ulasan berhasil ditambahkan',
      review: newReview,
      updatedRating: newAvgRating,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan ulasan' },
      { status: 500 }
    );
  }
}
