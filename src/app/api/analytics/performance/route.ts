import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Performance metrics for dashboard charts
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    // Check user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    const now = new Date();
    const months: Array<{ month: string; label: string }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const label = `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
      months.push({ month: monthStr, label });
    }

    // Helper: get month range for filtering
    const getMonthRange = (monthStr: string) => {
      const [year, month] = monthStr.split('-').map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      return { start, end };
    };

    let projectCompletionTrend: Array<{ month: string; label: string; completed: number; total: number }>;
    let bidSuccessRateTrend: Array<{ month: string; label: string; rate: number }>;
    let ratingTrend: Array<{ month: string; label: string; rating: number }>;
    let responseTimeTrend: Array<{ month: string; label: string; hours: number }>;

    if (user.role === 'OWNER') {
      // ===== OWNER METRICS =====

      // 1. Project Completion Trend
      const ownerProjects = await db.project.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          createdAt: true,
          status: true,
          milestones: {
            select: {
              status: true,
              completedAt: true,
            },
          },
        },
      });

      projectCompletionTrend = months.map(({ month, label }) => {
        const { start, end } = getMonthRange(month);
        const monthProjects = ownerProjects.filter((p) => {
          const created = new Date(p.createdAt);
          return created >= start && created <= end;
        });
        const completedInMonth = monthProjects.filter((p) => {
          if (p.status !== 'COMPLETED') return false;
          const completedMilestone = p.milestones.find((m) => m.status === 'COMPLETED' && m.completedAt);
          if (!completedMilestone?.completedAt) return false;
          const completedDate = new Date(completedMilestone.completedAt);
          return completedDate >= start && completedDate <= end;
        });
        return { month, label, completed: completedInMonth.length, total: monthProjects.length };
      });

      // 2. Bid Success Rate (accepted vs total received)
      const ownerProjectIds = ownerProjects.map((p) => p.id);
      const allBids = ownerProjectIds.length > 0
        ? await db.bid.findMany({
            where: { projectId: { in: ownerProjectIds } },
            select: { createdAt: true, status: true },
          })
        : [];

      bidSuccessRateTrend = months.map(({ month, label }) => {
        const { start, end } = getMonthRange(month);
        const monthBids = allBids.filter((b) => {
          const created = new Date(b.createdAt);
          return created >= start && created <= end;
        });
        const accepted = monthBids.filter((b) => b.status === 'ACCEPTED').length;
        const rate = monthBids.length > 0 ? Math.round((accepted / monthBids.length) * 100) : 0;
        return { month, label, rate };
      });

      // 3. Rating Trend (average rating of reviews on owner's projects)
      const ownerReviews = ownerProjectIds.length > 0
        ? await db.review.findMany({
            where: { projectId: { in: ownerProjectIds } },
            select: { createdAt: true, rating: true },
          })
        : [];

      ratingTrend = months.map(({ month, label }) => {
        const { start, end } = getMonthRange(month);
        const monthReviews = ownerReviews.filter((r) => {
          const created = new Date(r.createdAt);
          return created >= start && created <= end;
        });
        const avgRating = monthReviews.length > 0
          ? parseFloat((monthReviews.reduce((sum, r) => sum + r.rating, 0) / monthReviews.length).toFixed(1))
          : 0;
        return { month, label, rating: avgRating };
      });

      // 4. Response Time (time between project creation and first bid)
      responseTimeTrend = await Promise.all(months.map(async ({ month, label }) => {
        const { start, end } = getMonthRange(month);
        const monthProjects = ownerProjects.filter((p) => {
          const created = new Date(p.createdAt);
          return created >= start && created <= end;
        });
        const projectIds = monthProjects.map((p) => p.id);
        const firstBids = projectIds.length > 0
          ? await db.bid.findMany({
              where: {
                projectId: { in: projectIds },
              },
              select: { createdAt: true, projectId: true },
              orderBy: { createdAt: 'asc' },
            })
          : [];

        const responseTimes = monthProjects.map((p) => {
          const firstBid = firstBids.find((b) => b.projectId === p.id);
          if (!firstBid) return null;
          const diffMs = new Date(firstBid.createdAt).getTime() - new Date(p.createdAt).getTime();
          return diffMs / (1000 * 60 * 60); // hours
        }).filter((t): t is number => t !== null);

        const avgHours = responseTimes.length > 0
          ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          : 0;
        return { month, label, hours: avgHours };
      }));

    } else {
      // ===== CONTRACTOR METRICS =====

      // 1. Project Completion Trend
      const contractorBids = await db.bid.findMany({
        where: { contractorId: userId, status: 'ACCEPTED' },
        select: {
          id: true,
          createdAt: true,
          project: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              milestones: {
                select: { status: true, completedAt: true },
              },
            },
          },
        },
      });

      projectCompletionTrend = months.map(({ month, label }) => {
        const { start, end } = getMonthRange(month);
        const acceptedBids = contractorBids.filter((b) => {
          const created = new Date(b.createdAt);
          return created >= start && created <= end;
        });
        const completedProjects = acceptedBids.filter((b) => b.project.status === 'COMPLETED');
        return { month, label, completed: completedProjects.length, total: acceptedBids.length };
      });

      // 2. Bid Success Rate
      const allContractorBids = await db.bid.findMany({
        where: { contractorId: userId },
        select: { createdAt: true, status: true },
      });

      bidSuccessRateTrend = months.map(({ month, label }) => {
        const { start, end } = getMonthRange(month);
        const monthBids = allContractorBids.filter((b) => {
          const created = new Date(b.createdAt);
          return created >= start && created <= end;
        });
        const accepted = monthBids.filter((b) => b.status === 'ACCEPTED').length;
        const rate = monthBids.length > 0 ? Math.round((accepted / monthBids.length) * 100) : 0;
        return { month, label, rate };
      });

      // 3. Rating Trend (received reviews)
      const contractorReviews = await db.review.findMany({
        where: { toContractorId: userId },
        select: { createdAt: true, rating: true },
      });

      ratingTrend = months.map(({ month, label }) => {
        const { start, end } = getMonthRange(month);
        const monthReviews = contractorReviews.filter((r) => {
          const created = new Date(r.createdAt);
          return created >= start && created <= end;
        });
        const avgRating = monthReviews.length > 0
          ? parseFloat((monthReviews.reduce((sum, r) => sum + r.rating, 0) / monthReviews.length).toFixed(1))
          : 0;
        return { month, label, rating: avgRating };
      });

      // 4. Response Time (time between project creation and contractor's bid)
      responseTimeTrend = await Promise.all(months.map(async ({ month, label }) => {
        const { start, end } = getMonthRange(month);
        const monthBids = allContractorBids.filter((b) => {
          const created = new Date(b.createdAt);
          return created >= start && created <= end;
        });

        const responseTimesPromises = monthBids.map(async (bid) => {
          const project = await db.project.findUnique({
            where: { id: bid.projectId },
            select: { createdAt: true },
          });
          if (!project) return null;
          const diffMs = new Date(bid.createdAt).getTime() - new Date(project.createdAt).getTime();
          return diffMs / (1000 * 60 * 60);
        });

        const resolved = await Promise.all(responseTimesPromises);
        const validTimes = resolved.filter((t): t is number => t !== null && t >= 0);
        const avgHours = validTimes.length > 0
          ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
          : 0;
        return { month, label, hours: avgHours };
      }));
    }

    // Calculate trend indicators (compare last month vs previous month)
    const getTrend = (data: number[], isLowerBetter = false) => {
      if (data.length < 2) return { value: 0, direction: 'stable' as const };
      const current = data[data.length - 1];
      const previous = data[data.length - 2];
      if (previous === 0 && current === 0) return { value: 0, direction: 'stable' as const };
      if (previous === 0) return { value: 100, direction: 'up' as const };
      const change = parseFloat((((current - previous) / previous) * 100).toFixed(1));
      if (Math.abs(change) < 0.5) return { value: 0, direction: 'stable' as const };
      const isPositive = isLowerBetter ? change < 0 : change > 0;
      return { value: Math.abs(change), direction: isPositive ? 'up' as const : 'down' as const };
    };

    const completionTrend = getTrend(projectCompletionTrend.map(d => d.completed));
    const bidTrend = getTrend(bidSuccessRateTrend.map(d => d.rate));
    const ratingTrendVal = getTrend(ratingTrend.map(d => d.rating));
    const responseTrend = getTrend(responseTimeTrend.map(d => d.hours), true);

    return NextResponse.json({
      success: true,
      data: {
        projectCompletionTrend,
        bidSuccessRateTrend,
        ratingTrend,
        responseTimeTrend,
        trends: {
          completion: completionTrend,
          bidSuccess: bidTrend,
          rating: ratingTrendVal,
          responseTime: responseTrend,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat metrik performa' },
      { status: 500 }
    );
  }
}
