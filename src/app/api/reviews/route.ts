import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// In-memory store for review responses (no schema change needed)
const reviewResponses: Record<string, {
  responseText: string;
  respondedAt: Date;
  contractorId: string;
  contractorName: string;
}> = {};

// GET: Fetch reviews with enhanced filtering and average rating calculation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');
    const projectId = searchParams.get('projectId');
    const minRating = searchParams.get('minRating');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const includeAverage = searchParams.get('includeAverage') === 'true';

    const where: Record<string, unknown> = {};

    if (contractorId) {
      where.toContractorId = contractorId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (minRating) {
      const rating = parseInt(minRating);
      if (rating >= 1 && rating <= 5) {
        where.rating = { gte: rating };
      }
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
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
        skip,
        take: limit,
      }),
      db.review.count({ where }),
    ]);

    // Calculate averages from ALL matching reviews (not just paginated)
    const allReviewsForAvg = await db.review.findMany({
      where,
      select: {
        rating: true,
        professionalism: true,
        quality: true,
        timeliness: true,
      },
    });

    const totalReviewsForAvg = allReviewsForAvg.length;
    const avgRating = totalReviewsForAvg > 0
      ? parseFloat((allReviewsForAvg.reduce((sum, r) => sum + r.rating, 0) / totalReviewsForAvg).toFixed(1))
      : 0;
    const avgProfessionalism = totalReviewsForAvg > 0
      ? parseFloat((allReviewsForAvg.reduce((sum, r) => sum + r.professionalism, 0) / totalReviewsForAvg).toFixed(1))
      : 0;
    const avgQuality = totalReviewsForAvg > 0
      ? parseFloat((allReviewsForAvg.reduce((sum, r) => sum + r.quality, 0) / totalReviewsForAvg).toFixed(1))
      : 0;
    const avgTimeliness = totalReviewsForAvg > 0
      ? parseFloat((allReviewsForAvg.reduce((sum, r) => sum + r.timeliness, 0) / totalReviewsForAvg).toFixed(1))
      : 0;

    // Rating distribution (1-5 stars)
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviewsForAvg.forEach((r) => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });

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
      project: r.project,
      // Include response if exists
      response: reviewResponses[r.id]
        ? {
            text: reviewResponses[r.id].responseText,
            respondedAt: reviewResponses[r.id].respondedAt.toISOString(),
            contractorId: reviewResponses[r.id].contractorId,
            contractorName: reviewResponses[r.id].contractorName,
          }
        : null,
    }));

    // Build response
    const response: Record<string, unknown> = {
      success: true,
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      averageRating: avgRating,
      totalReviews: totalReviewsForAvg,
      categoryAverages: {
        professionalism: avgProfessionalism,
        quality: avgQuality,
        timeliness: avgTimeliness,
      },
      ratingDistribution,
    };

    // If only average rating requested (lightweight endpoint)
    if (includeAverage && !contractorId) {
      return NextResponse.json({
        success: true,
        averageRating: avgRating,
        totalReviews: totalReviewsForAvg,
        categoryAverages: {
          professionalism: avgProfessionalism,
          quality: avgQuality,
          timeliness: avgTimeliness,
        },
        ratingDistribution,
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat ulasan' },
      { status: 500 }
    );
  }
}

const createReviewSchema = z.object({
  fromUserId: z.string().min(1, 'User ID pemberi review wajib diisi'),
  toContractorId: z.string().min(1, 'Contractor ID wajib diisi'),
  projectId: z.string().min(1, 'Project ID wajib diisi'),
  rating: z.number().min(1, 'Rating minimal 1').max(5, 'Rating maksimal 5'),
  review: z.string().max(2000, 'Review maksimal 2000 karakter').optional(),
  professionalism: z.number().min(1).max(5).default(5),
  quality: z.number().min(1).max(5).default(5),
  timeliness: z.number().min(1).max(5).default(5),
});

const respondToReviewSchema = z.object({
  reviewId: z.string().min(1, 'Review ID wajib diisi'),
  contractorId: z.string().min(1, 'Contractor ID wajib diisi'),
  contractorName: z.string().min(1, 'Nama kontraktor wajib diisi'),
  responseText: z.string().min(1, 'Balasan tidak boleh kosong').max(1000, 'Balasan maksimal 1000 karakter'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Determine if this is a review creation or a response to a review
    if (body.reviewId && body.responseText) {
      // === REVIEW RESPONSE ===
      const parsed = respondToReviewSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.errors[0].message },
          { status: 400 }
        );
      }

      const { reviewId, contractorId, contractorName, responseText } = parsed.data;

      // Verify the review exists and belongs to this contractor
      const review = await db.review.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        return NextResponse.json(
          { success: false, error: 'Ulasan tidak ditemukan' },
          { status: 404 }
        );
      }

      if (review.toContractorId !== contractorId) {
        return NextResponse.json(
          { success: false, error: 'Anda hanya dapat membalas ulasan yang ditujukan kepada Anda' },
          { status: 403 }
        );
      }

      if (reviewResponses[reviewId]) {
        return NextResponse.json(
          { success: false, error: 'Anda sudah memberikan balasan untuk ulasan ini' },
          { status: 400 }
        );
      }

      reviewResponses[reviewId] = {
        responseText,
        respondedAt: new Date(),
        contractorId,
        contractorName,
      };

      return NextResponse.json({
        success: true,
        data: {
          reviewId,
          response: {
            text: responseText,
            respondedAt: reviewResponses[reviewId].respondedAt.toISOString(),
            contractorId,
            contractorName,
          },
        },
      });
    }

    // === NEW REVIEW CREATION ===
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      fromUserId,
      toContractorId,
      projectId,
      rating,
      review: reviewText,
      professionalism,
      quality,
      timeliness,
    } = parsed.data;

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

    if (fromUserId === toContractorId) {
      return NextResponse.json(
        { success: false, error: 'Tidak dapat memberikan review kepada diri sendiri' },
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
        rating,
        review: reviewText || null,
        professionalism,
        quality,
        timeliness,
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
