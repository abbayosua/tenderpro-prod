import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    if (user.role === 'OWNER') {
      // Get all projects for this owner with milestones and payments
      const projects = await db.project.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          category: true,
          status: true,
          budget: true,
          createdAt: true,
          completedAt: true,
          milestones: {
            select: {
              status: true,
              payments: {
                select: {
                  amount: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      // Calculate category distribution
      const categoryCount: Record<string, number> = {};
      projects.forEach((p) => {
        const cat = p.category || 'Lainnya';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      const totalProjects = projects.length;
      const categoryData = Object.entries(categoryCount).map(([name, count]) => ({
        name,
        value: totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0,
        count,
      }));

      // Sort by count descending
      categoryData.sort((a, b) => b.count - a.count);

      // Calculate spending by category
      const spendingByCategory: Record<string, { budget: number; spent: number; category: string }> = {};
      
      projects.forEach((p) => {
        const cat = p.category || 'Lainnya';
        if (!spendingByCategory[cat]) {
          spendingByCategory[cat] = { budget: 0, spent: 0, category: cat };
        }
        spendingByCategory[cat].budget += p.budget || 0;
        
        // Calculate spent amount from milestone payments
        p.milestones.forEach(m => {
          m.payments.forEach(pay => {
            if (pay.status === 'PAID') {
              spendingByCategory[cat].spent += pay.amount;
            }
          });
        });
      });

      const spendingCategoryData = Object.values(spendingByCategory).map(item => ({
        name: item.category,
        budget: item.budget,
        spent: item.spent,
        percentage: item.budget > 0 ? Math.round((item.spent / item.budget) * 100) : 0,
      }));

      // Sort by spent descending
      spendingCategoryData.sort((a, b) => b.spent - a.spent);

      // Calculate monthly progress (last 6 months) with completion rate
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      
      // Initialize monthly data
      const monthlyDataMap: Record<string, { proyek: number; selesai: number; completionRate: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = months[d.getMonth()];
        monthlyDataMap[key] = { proyek: 0, selesai: 0, completionRate: 0 };
      }

      // Fill with actual data
      projects.forEach((p) => {
        const monthKey = months[p.createdAt.getMonth()];
        if (monthlyDataMap[monthKey] !== undefined) {
          monthlyDataMap[monthKey].proyek++;
          if (p.status === 'COMPLETED') {
            monthlyDataMap[monthKey].selesai++;
          }
        }
      });

      // Calculate completion rates and prepare data
      const monthlyProgressData = Object.entries(monthlyDataMap).map(([month, data]) => ({
        month,
        proyek: data.proyek,
        selesai: data.selesai,
        completionRate: data.proyek > 0 ? Math.round((data.selesai / data.proyek) * 100) : 0,
      }));

      // Calculate trend line (linear regression for completion trend)
      const completionRates = monthlyProgressData.map(d => d.completionRate);
      const n = completionRates.length;
      const avgCompletion = completionRates.reduce((a, b) => a + b, 0) / n;
      
      // Simple trend: average of last 3 months vs first 3 months
      const firstHalf = completionRates.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const secondHalf = completionRates.slice(3).reduce((a, b) => a + b, 0) / 3;
      const trendDirection = secondHalf > firstHalf ? 'up' : secondHalf < firstHalf ? 'down' : 'stable';
      const trendValue = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

      // Calculate trends (compare with previous period)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentProjects = projects.filter(p => new Date(p.createdAt) >= thirtyDaysAgo).length;
      const previousProjects = projects.filter(p => {
        const date = new Date(p.createdAt);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
      }).length;

      const projectTrend = previousProjects > 0 
        ? Math.round(((recentProjects - previousProjects) / previousProjects) * 100) 
        : (recentProjects > 0 ? 100 : 0);

      // Calculate bid trend
      const recentBids = await db.bid.count({
        where: {
          project: { ownerId: userId },
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      const previousBids = await db.bid.count({
        where: {
          project: { ownerId: userId },
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      });

      const bidTrend = previousBids > 0
        ? Math.round(((recentBids - previousBids) / previousBids) * 100)
        : (recentBids > 0 ? 100 : 0);

      return NextResponse.json({
        categoryData,
        spendingCategoryData,
        monthlyProgressData,
        completionTrend: {
          direction: trendDirection,
          value: Math.abs(trendValue),
          avgCompletion: Math.round(avgCompletion),
        },
        trends: {
          projectTrend,
          bidTrend,
        },
      });
    }

    if (user.role === 'CONTRACTOR') {
      // Get contractor performance metrics
      const bids = await db.bid.findMany({
        where: { contractorId: userId },
        select: {
          status: true,
          price: true,
          createdAt: true,
        },
      });

      const totalBids = bids.length;
      const acceptedBids = bids.filter(b => b.status === 'ACCEPTED').length;
      const rejectedBids = bids.filter(b => b.status === 'REJECTED').length;
      const pendingBids = bids.filter(b => b.status === 'PENDING').length;

      // Monthly bid submissions (last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthlyBidData: Record<string, { total: number; accepted: number; rejected: number; pending: number }> = {};
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = months[d.getMonth()];
        monthlyBidData[key] = { total: 0, accepted: 0, rejected: 0, pending: 0 };
      }

      bids.forEach((bid) => {
        const monthKey = months[bid.createdAt.getMonth()];
        if (monthlyBidData[monthKey] !== undefined) {
          monthlyBidData[monthKey].total++;
          if (bid.status === 'ACCEPTED') monthlyBidData[monthKey].accepted++;
          else if (bid.status === 'REJECTED') monthlyBidData[monthKey].rejected++;
          else if (bid.status === 'PENDING') monthlyBidData[monthKey].pending++;
        }
      });

      const monthlyBidSubmissions = Object.entries(monthlyBidData).map(([month, data]) => ({
        month,
        total: data.total,
        accepted: data.accepted,
        rejected: data.rejected,
        pending: data.pending,
        winRate: data.total > 0 ? Math.round((data.accepted / data.total) * 100) : 0,
      }));

      // Win rate trend (last 3 months vs previous 3 months)
      const last3Months = monthlyBidSubmissions.slice(-3);
      const prev3Months = monthlyBidSubmissions.slice(0, 3);
      
      const last3WinRate = last3Months.reduce((sum, m) => sum + m.winRate, 0) / 3;
      const prev3WinRate = prev3Months.reduce((sum, m) => sum + m.winRate, 0) / 3;
      
      const winRateTrend = {
        direction: last3WinRate > prev3WinRate ? 'up' : last3WinRate < prev3WinRate ? 'down' : 'stable',
        value: prev3WinRate > 0 ? Math.round(((last3WinRate - prev3WinRate) / prev3WinRate) * 100) : 0,
        current: Math.round(last3WinRate),
        previous: Math.round(prev3WinRate),
      };

      // Performance comparison data
      const performanceComparison = {
        accepted: acceptedBids,
        rejected: rejectedBids,
        pending: pendingBids,
        acceptanceRate: totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 0,
        rejectionRate: totalBids > 0 ? Math.round((rejectedBids / totalBids) * 100) : 0,
      };

      // Win rate history (monthly)
      const winRateHistory = monthlyBidSubmissions.map(m => ({
        month: m.month,
        winRate: m.winRate,
      }));

      return NextResponse.json({
        totalBids,
        acceptedBids,
        rejectedBids,
        pendingBids,
        overallWinRate: totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 0,
        monthlyBidSubmissions,
        winRateTrend,
        performanceComparison,
        winRateHistory,
      });
    }

    return NextResponse.json({ error: 'Role tidak didukung' }, { status: 400 });
  } catch (error) {
    console.error('Get charts error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
