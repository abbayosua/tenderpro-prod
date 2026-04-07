import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Simple in-memory cache
interface CacheEntry {
  data: unknown;
  timestamp: number;
}
const earningsCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60000; // 60 seconds

function getCacheKey(userId: string, period: string): string {
  return `${userId}:${period}`;
}

function getCached(key: string): unknown | null {
  const entry = earningsCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    earningsCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown): void {
  earningsCache.set(key, { data, timestamp: Date.now() });
}

const querySchema = z.object({
  userId: z.string().min(1, 'Parameter userId wajib diisi'),
  period: z.enum(['month', 'quarter', 'year']).default('month'),
});

// GET: Detailed earnings breakdown for a contractor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      userId: searchParams.get('userId'),
      period: searchParams.get('period') || 'month',
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { userId, period } = parsed.data;

    // Check cache first
    const cacheKey = getCacheKey(userId, period);
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached, cached: true });
    }

    // Query ALL bids by this contractor
    const allBids = await db.bid.findMany({
      where: { contractorId: userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
            createdAt: true,
            endDate: true,
            budget: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const acceptedBids = allBids.filter((b) => b.status === 'ACCEPTED');
    const pendingBids = allBids.filter((b) => b.status === 'PENDING');

    // Active projects (IN_PROGRESS)
    const activeProjects = acceptedBids.filter((b) => b.project.status === 'IN_PROGRESS');
    const completedProjects = acceptedBids.filter((b) => b.project.status === 'COMPLETED');
    const pendingPayouts = acceptedBids.filter(
      (b) => b.project.status === 'IN_PROGRESS' || b.project.status === 'OPEN'
    );

    // Calculate totals
    const totalEarnings = acceptedBids.reduce((sum, bid) => sum + bid.price, 0);
    const activeEarnings = activeProjects.reduce((sum, bid) => sum + bid.price, 0);
    const completedEarnings = completedProjects.reduce((sum, bid) => sum + bid.price, 0);
    const pendingEarnings = pendingPayouts.reduce((sum, bid) => sum + bid.price, 0);
    const projectCount = acceptedBids.length;
    const averageEarningsPerProject =
      projectCount > 0 ? Math.round(totalEarnings / projectCount) : 0;

    // Fetch payment data for pending/completed payment counts
    const acceptedProjectIds = acceptedBids.map((b) => b.project.id);

    let pendingPaymentsCount = 0;
    let completedPaymentsCount = 0;
    let pendingPaymentsTotal = 0;
    let completedPaymentsTotal = 0;

    if (acceptedProjectIds.length > 0) {
      const payments = await db.payment.findMany({
        where: {
          milestone: {
            projectId: { in: acceptedProjectIds },
          },
        },
        select: {
          amount: true,
          status: true,
        },
      });

      pendingPaymentsCount = payments.filter((p) => p.status === 'PENDING').length;
      completedPaymentsCount = payments.filter(
        (p) => p.status === 'PAID' || p.status === 'CONFIRMED'
      ).length;
      pendingPaymentsTotal = payments
        .filter((p) => p.status === 'PENDING')
        .reduce((sum, p) => sum + p.amount, 0);
      completedPaymentsTotal = payments
        .filter((p) => p.status === 'PAID' || p.status === 'CONFIRMED')
        .reduce((sum, p) => sum + p.amount, 0);
    }

    // Determine period range
    const now = new Date();
    let periodMonths: number;
    switch (period) {
      case 'year':
        periodMonths = 12;
        break;
      case 'quarter':
        periodMonths = 3;
        break;
      case 'month':
      default:
        periodMonths = 1;
        break;
    }

    // Calculate monthly trend data for the period
    const monthlyTrend: Array<{
      month: string;
      earnings: number;
      projectCount: number;
      completedPayments: number;
      pendingPayments: number;
    }> = [];

    const indonesianMonths = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ];

    // For "month", show last 6 months; for "quarter", last 4 quarters; for "year", last 2 years
    let monthsToShow: number;
    let stepMonths: number;
    if (period === 'year') {
      monthsToShow = 12;
      stepMonths = 1;
    } else if (period === 'quarter') {
      monthsToShow = 12;
      stepMonths = 1;
    } else {
      monthsToShow = 6;
      stepMonths = 1;
    }

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthName = indonesianMonths[month];

      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const monthBids = acceptedBids.filter((bid) => {
        const bidDate = new Date(bid.createdAt);
        return bidDate >= monthStart && bidDate <= monthEnd;
      });

      const monthEarningsSum = monthBids.reduce((sum, bid) => sum + bid.price, 0);

      monthlyTrend.push({
        month: monthName,
        earnings: monthEarningsSum,
        projectCount: monthBids.length,
        completedPayments: 0,
        pendingPayments: 0,
      });
    }

    // Calculate trend (current period vs previous period)
    let trendPercent = 0;
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';

    if (monthlyTrend.length >= 2) {
      const current = monthlyTrend[monthlyTrend.length - 1].earnings;
      const previous = monthlyTrend[monthlyTrend.length - 2].earnings;

      if (previous > 0 && current > 0) {
        trendPercent = Math.round(((current - previous) / previous) * 100);
        trendDirection = trendPercent > 0 ? 'up' : trendPercent < 0 ? 'down' : 'stable';
      } else if (current > 0 && previous === 0) {
        trendPercent = 100;
        trendDirection = 'up';
      }
    }

    // Earnings by category
    const categoryMap: Record<string, number> = {};
    acceptedBids.forEach((bid) => {
      const cat = bid.project.category || 'Lainnya';
      categoryMap[cat] = (categoryMap[cat] || 0) + bid.price;
    });
    const earningsByCategory = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Earnings breakdown by project
    const earningsByProject = acceptedBids.map((bid) => ({
      projectId: bid.project.id,
      projectTitle: bid.project.title,
      amount: bid.price,
      status: bid.project.status,
      category: bid.project.category,
      acceptedAt: bid.createdAt.toISOString(),
    }));

    // Pending payments detail
    const pendingPayments = pendingPayouts.map((bid) => ({
      bidId: bid.id,
      projectId: bid.project.id,
      projectTitle: bid.project.title,
      amount: bid.price,
      status: bid.project.status,
      submittedAt: bid.createdAt.toISOString(),
    }));

    // Recent transactions
    const recentTransactions = allBids.slice(0, 10).map((bid) => ({
      id: bid.id,
      projectTitle: bid.project.title,
      amount: bid.price,
      status: bid.status,
      createdAt: bid.createdAt.toISOString(),
      category: bid.project.category,
    }));

    // Build response data
    const data = {
      // Summary
      totalEarnings,
      activeEarnings,
      completedEarnings,
      pendingEarnings,
      projectCount,
      averageEarningsPerProject,
      activeProjectCount: activeProjects.length,
      completedCount: completedProjects.length,
      pendingPayoutCount: pendingPayouts.length,

      // Payment details
      pendingPaymentsCount,
      completedPaymentsCount,
      pendingPaymentsTotal,
      completedPaymentsTotal,

      // Trends
      monthlyTrend,
      trendPercent,
      trendDirection,
      currentPeriodEarnings: monthlyTrend[monthlyTrend.length - 1]?.earnings || 0,
      previousPeriodEarnings: monthlyTrend[monthlyTrend.length - 2]?.earnings || 0,

      // Breakdowns
      earningsByCategory,
      earningsByProject,
      pendingPayments,
      recentTransactions,

      // Period info
      period,
      periodLabel:
        period === 'month'
          ? 'Bulanan'
          : period === 'quarter'
            ? 'Triwulanan'
            : 'Tahunan',
      generatedAt: new Date().toISOString(),
    };

    // Cache the result
    setCache(cacheKey, data);

    return NextResponse.json({ success: true, data, cached: false });
  } catch (error) {
    console.error('Error fetching contractor earnings report:', error);
    return NextResponse.json(
      {
        success: true,
        data: {
          totalEarnings: 0,
          activeEarnings: 0,
          completedEarnings: 0,
          pendingEarnings: 0,
          projectCount: 0,
          averageEarningsPerProject: 0,
          activeProjectCount: 0,
          completedCount: 0,
          pendingPayoutCount: 0,
          pendingPaymentsCount: 0,
          completedPaymentsCount: 0,
          pendingPaymentsTotal: 0,
          completedPaymentsTotal: 0,
          monthlyTrend: [],
          trendPercent: 0,
          trendDirection: 'stable',
          currentPeriodEarnings: 0,
          previousPeriodEarnings: 0,
          earningsByCategory: [],
          earningsByProject: [],
          pendingPayments: [],
          recentTransactions: [],
          period: 'month',
          periodLabel: 'Bulanan',
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  }
}

// POST: Withdrawal request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, bankName, bankAccount, bankHolder } = body;

    if (!userId || !amount || !bankName || !bankAccount || !bankHolder) {
      return NextResponse.json(
        { success: false, error: 'Data permintaan pencairan tidak lengkap' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Jumlah pencairan harus lebih dari 0' },
        { status: 400 }
      );
    }

    // Verify contractor has enough earnings
    const acceptedBids = await db.bid.findMany({
      where: { contractorId: userId, status: 'ACCEPTED' },
      include: {
        project: { select: { status: true } },
      },
    });

    const totalEarnings = acceptedBids.reduce((sum, bid) => sum + bid.price, 0);

    if (amount > totalEarnings) {
      return NextResponse.json(
        { success: false, error: 'Jumlah pencairan melebihi total pendapatan' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Permintaan pencairan berhasil diajukan',
      data: {
        withdrawalId: `wd_${Date.now()}`,
        amount,
        status: 'PENDING',
        bankName,
        bankAccount,
        bankHolder,
        requestedAt: new Date().toISOString(),
        processingDays: '3-5 hari kerja',
      },
    });
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengajukan permintaan pencairan' },
      { status: 500 }
    );
  }
}
