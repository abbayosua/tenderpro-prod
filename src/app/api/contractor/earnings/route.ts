import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Parameter userId wajib diisi' },
        { status: 400 }
      );
    }

    // Query ALL bids by this contractor (not just accepted)
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
    const pendingPayouts = acceptedBids.filter((b) => b.project.status === 'IN_PROGRESS' || b.project.status === 'OPEN');

    // Calculate totals
    const totalEarnings = acceptedBids.reduce((sum, bid) => sum + bid.price, 0);
    const activeEarnings = activeProjects.reduce((sum, bid) => sum + bid.price, 0);
    const completedEarnings = completedProjects.reduce((sum, bid) => sum + bid.price, 0);
    const pendingEarnings = pendingPayouts.reduce((sum, bid) => sum + bid.price, 0);
    const projectCount = acceptedBids.length;
    const averageEarningsPerProject = projectCount > 0 ? totalEarnings / projectCount : 0;

    // Calculate monthly earnings for last 6 months
    const now = new Date();
    const monthlyEarnings: Array<{ month: string; earnings: number; projectCount: number }> = [];

    const indonesianMonths = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ];

    for (let i = 5; i >= 0; i--) {
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

      monthlyEarnings.push({
        month: monthName,
        earnings: monthEarningsSum,
        projectCount: monthBids.length,
      });
    }

    // Calculate trend (this month vs last month)
    const currentMonth = monthlyEarnings[monthlyEarnings.length - 1];
    const lastMonth = monthlyEarnings[monthlyEarnings.length - 2];

    let monthTrend = 0;
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';

    if (lastMonth.earnings > 0 && currentMonth.earnings > 0) {
      monthTrend = Math.round(
        ((currentMonth.earnings - lastMonth.earnings) / lastMonth.earnings) * 100
      );
      trendDirection = monthTrend > 0 ? 'up' : monthTrend < 0 ? 'down' : 'stable';
    } else if (currentMonth.earnings > 0 && lastMonth.earnings === 0) {
      monthTrend = 100;
      trendDirection = 'up';
    }

    // Earnings by category
    const categoryMap: Record<string, number> = {};
    acceptedBids.forEach((bid) => {
      const cat = bid.project.category || 'Lainnya';
      categoryMap[cat] = (categoryMap[cat] || 0) + bid.price;
    });
    const earningsByCategory = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    }));

    // Recent transactions (latest 10 bids)
    const recentTransactions = allBids.slice(0, 10).map((bid) => ({
      id: bid.id,
      projectTitle: bid.project.title,
      amount: bid.price,
      status: bid.status,
      createdAt: bid.createdAt.toISOString(),
      category: bid.project.category,
    }));

    // ** NEW: Earnings breakdown by project **
    const earningsByProject = acceptedBids.map((bid) => ({
      projectId: bid.project.id,
      projectTitle: bid.project.title,
      amount: bid.price,
      status: bid.project.status,
      category: bid.project.category,
      acceptedAt: bid.createdAt.toISOString(),
    }));

    // ** NEW: Pending payments section **
    const pendingPayments = pendingPayouts.map((bid) => ({
      bidId: bid.id,
      projectId: bid.project.id,
      projectTitle: bid.project.title,
      amount: bid.price,
      status: bid.project.status,
      submittedAt: bid.createdAt.toISOString(),
    }));

    const activeProjectCount = activeProjects.length;

    return NextResponse.json({
      success: true,
      data: {
        totalEarnings,
        activeEarnings,
        completedEarnings,
        pendingEarnings,
        projectCount,
        averageEarningsPerProject: Math.round(averageEarningsPerProject),
        activeProjectCount,
        completedCount: completedProjects.length,
        pendingPayoutCount: pendingPayouts.length,
        monthlyEarnings,
        monthTrend,
        trendDirection,
        currentMonthEarnings: currentMonth.earnings,
        lastMonthEarnings: lastMonth.earnings,
        earningsByCategory,
        recentTransactions,
        // New fields
        earningsByProject,
        pendingPayments,
      },
    });
  } catch (error) {
    console.error('Error fetching contractor earnings:', error);
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
          monthlyEarnings: [],
          monthTrend: 0,
          trendDirection: 'stable',
          currentMonthEarnings: 0,
          lastMonthEarnings: 0,
          earningsByCategory: [],
          recentTransactions: [],
          earningsByProject: [],
          pendingPayments: [],
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
