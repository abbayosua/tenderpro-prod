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

    // Query accepted bids by this contractor
    const acceptedBids = await db.bid.findMany({
      where: {
        contractorId: userId,
        status: 'ACCEPTED',
      },
      include: {
        project: {
          select: {
            title: true,
            status: true,
            createdAt: true,
            endDate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate total earnings
    const totalEarnings = acceptedBids.reduce((sum, bid) => sum + bid.price, 0);
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

    // Active projects (IN_PROGRESS or OPEN)
    const activeProjectCount = acceptedBids.filter(
      (bid) =>
        bid.project.status === 'IN_PROGRESS' ||
        bid.project.status === 'OPEN'
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        totalEarnings,
        projectCount,
        averageEarningsPerProject: Math.round(averageEarningsPerProject),
        activeProjectCount,
        monthlyEarnings,
        monthTrend,
        trendDirection,
        currentMonthEarnings: currentMonth.earnings,
        lastMonthEarnings: lastMonth.earnings,
      },
    });
  } catch (error) {
    console.error('Error fetching contractor earnings:', error);
    return NextResponse.json(
      {
        success: true,
        data: {
          totalEarnings: 0,
          projectCount: 0,
          averageEarningsPerProject: 0,
          activeProjectCount: 0,
          monthlyEarnings: [],
          monthTrend: 0,
          trendDirection: 'stable',
          currentMonthEarnings: 0,
          lastMonthEarnings: 0,
        },
      },
      { status: 200 }
    );
  }
}
