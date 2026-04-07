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

    let dashboardData: Record<string, unknown> = {};

    if (user.role === 'CONTRACTOR') {
      // Contractor dashboard stats
      const totalBids = await db.bid.count({
        where: { contractorId: userId },
      });
      const acceptedBids = await db.bid.count({
        where: { contractorId: userId, status: 'ACCEPTED' },
      });
      const pendingBids = await db.bid.count({
        where: { contractorId: userId, status: 'PENDING' },
      });
      const rejectedBids = await db.bid.count({
        where: { contractorId: userId, status: 'REJECTED' },
      });

      // Get monthly bid stats for the past 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const bids = await db.bid.findMany({
        where: {
          contractorId: userId,
          createdAt: { gte: sixMonthsAgo },
        },
        select: {
          status: true,
          price: true,
          createdAt: true,
        },
      });

      // Group by month
      const monthlyStats: Record<string, { total: number; accepted: number; value: number }> = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      bids.forEach((bid) => {
        const monthKey = `${months[bid.createdAt.getMonth()]} ${bid.createdAt.getFullYear()}`;
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = { total: 0, accepted: 0, value: 0 };
        }
        monthlyStats[monthKey].total++;
        monthlyStats[monthKey].value += bid.price;
        if (bid.status === 'ACCEPTED') {
          monthlyStats[monthKey].accepted++;
        }
      });

      // Get recent bids with project info
      const recentBids = await db.bid.findMany({
        where: { contractorId: userId },
        include: {
          project: {
            include: {
              owner: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      // Get available projects for tender
      const availableProjects = await db.project.findMany({
        where: { status: 'OPEN' },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          bids: {
            where: { contractorId: userId },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // ===== NEW: Enhanced contractor stats =====
      
      // Response rate: accepted + rejected vs total
      const responseRate = totalBids > 0
        ? ((acceptedBids + rejectedBids) / totalBids * 100).toFixed(1)
        : '100';

      // Average response time (time between project creation and bid submission)
      const contractorBidsWithDates = await db.bid.findMany({
        where: { contractorId: userId, status: { in: ['ACCEPTED', 'REJECTED'] } },
        include: {
          project: { select: { createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      
      let totalResponseHours = 0;
      let responseCount = 0;
      contractorBidsWithDates.forEach((bid) => {
        const diffMs = bid.createdAt.getTime() - bid.project.createdAt.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours > 0 && diffHours < 720) { // Only count if within 30 days
          totalResponseHours += diffHours;
          responseCount++;
        }
      });
      const responseTimeAvg = responseCount > 0
        ? parseFloat((totalResponseHours / responseCount).toFixed(1))
        : 0;
      const averageResponseTime = responseCount > 0
        ? `${Math.round(totalResponseHours / responseCount)} jam`
        : 'Belum ada data';

      // Earnings: total from accepted bids
      const earningsResult = await db.bid.aggregate({
        where: { contractorId: userId, status: 'ACCEPTED' },
        _sum: { price: true },
      });
      const earnings = earningsResult._sum.price || 0;

      // Active project count: projects with accepted bids that are IN_PROGRESS
      const activeProjectCount = await db.project.count({
        where: {
          status: 'IN_PROGRESS',
          bids: {
            some: {
              contractorId: userId,
              status: 'ACCEPTED',
            },
          },
        },
      });

      // ===== Feature 4 Enhancements =====

      // 1. Upcoming deadlines: milestones due within 7 days
      let upcomingDeadlines: Array<{
        id: string;
        title: string;
        dueDate: Date;
        status: string;
        projectName: string;
        projectId: string;
        daysUntilDue: number;
      }> = [];

      if (db.projectMilestone) {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const activeProjectIds = await db.project.findMany({
          where: {
            status: 'IN_PROGRESS',
            bids: { some: { contractorId: userId, status: 'ACCEPTED' } },
          },
          select: { id: true, title: true },
        });

        if (activeProjectIds.length > 0) {
          const projectMap = new Map(activeProjectIds.map((p) => [p.id, p.title]));
          const upcomingMilestones = await db.projectMilestone.findMany({
            where: {
              projectId: { in: Array.from(projectMap.keys()) },
              status: { in: ['PENDING', 'IN_PROGRESS'] },
              dueDate: { lte: sevenDaysFromNow, gte: new Date() },
            },
            orderBy: { dueDate: 'asc' },
            take: 10,
          });

          upcomingDeadlines = upcomingMilestones.map((m) => {
            const now = new Date();
            const diffMs = m.dueDate.getTime() - now.getTime();
            const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            return {
              id: m.id,
              title: m.title,
              dueDate: m.dueDate,
              status: m.status,
              projectName: projectMap.get(m.projectId) || 'Proyek Tidak Dikenal',
              projectId: m.projectId,
              daysUntilDue,
            };
          });
        }
      }

      // 2. Recent feedback: last 3 reviews received
      let recentFeedback: Array<{
        id: string;
        rating: number;
        review: string | null;
        professionalism: number;
        quality: number;
        timeliness: number;
        createdAt: Date;
        fromUser: { id: string; name: string; avatar: string | null; };
        project: { id: string; title: string; category: string; };
      }> = [];

      try {
        const lastReviews = await db.review.findMany({
          where: { toContractorId: userId },
          include: {
            fromUser: { select: { id: true, name: true, avatar: true } },
            project: { select: { id: true, title: true, category: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        });
        recentFeedback = lastReviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          review: r.review,
          professionalism: r.professionalism,
          quality: r.quality,
          timeliness: r.timeliness,
          createdAt: r.createdAt,
          fromUser: r.fromUser,
          project: r.project,
        }));
      } catch {
        // Reviews not available
      }

      // 3. Monthly earnings: last 6 months breakdown
      const monthlyEarnings: Array<{ month: string; amount: number }> = [];
      const indonesianMonths = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
      ];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthName = indonesianMonths[month];

        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const monthAcceptedBids = await db.bid.aggregate({
          where: {
            contractorId: userId,
            status: 'ACCEPTED',
            createdAt: { gte: monthStart, lte: monthEnd },
          },
          _sum: { price: true },
        });

        monthlyEarnings.push({
          month: monthName,
          amount: monthAcceptedBids._sum.price || 0,
        });
      }

      // 4. Completion rate: completed milestones vs total milestones
      let completionRate = 0;
      if (db.projectMilestone) {
        const contractorProjects = await db.project.findMany({
          where: {
            bids: { some: { contractorId: userId, status: 'ACCEPTED' } },
          },
          select: { id: true },
        });

        if (contractorProjects.length > 0) {
          const projectIds = contractorProjects.map((p) => p.id);
          const [totalMilestones, completedMilestones] = await Promise.all([
            db.projectMilestone.count({
              where: { projectId: { in: projectIds } },
            }),
            db.projectMilestone.count({
              where: { projectId: { in: projectIds }, status: 'COMPLETED' },
            }),
          ]);
          completionRate = totalMilestones > 0
            ? Math.round((completedMilestones / totalMilestones) * 100)
            : 0;
        }
      }

      dashboardData = {
        totalBids,
        acceptedBids,
        pendingBids,
        rejectedBids,
        winRate: totalBids > 0 ? ((acceptedBids / totalBids) * 100).toFixed(1) : 0,
        monthlyStats,
        recentBids: recentBids.map((b) => ({
          id: b.id,
          price: b.price,
          status: b.status,
          createdAt: b.createdAt,
          project: {
            id: b.project.id,
            title: b.project.title,
            category: b.project.category,
            location: b.project.location,
            budget: b.project.budget,
            owner: {
              name: b.project.owner.name,
            },
          },
        })),
        availableProjects: availableProjects.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          location: p.location,
          budget: p.budget,
          duration: p.duration,
          bidCount: p.bids.length,
          hasBid: p.bids.length > 0,
          owner: {
            name: p.owner.name,
          },
        })),
        // NEW fields
        responseRate: parseFloat(responseRate as string),
        averageResponseTime,
        responseTimeAvg,
        earnings,
        activeProjectCount,
        // Feature 4 enhancements
        upcomingDeadlines,
        recentFeedback,
        monthlyEarnings,
        completionRate,
      };
    } else if (user.role === 'OWNER') {
      // Owner dashboard stats
      const totalProjects = await db.project.count({
        where: { ownerId: userId },
      });
      const activeProjects = await db.project.count({
        where: { ownerId: userId, status: 'IN_PROGRESS' },
      });
      const openProjects = await db.project.count({
        where: { ownerId: userId, status: 'OPEN' },
      });
      const completedProjects = await db.project.count({
        where: { ownerId: userId, status: 'COMPLETED' },
      });

      // Get projects with bid counts
      const projects = await db.project.findMany({
        where: { ownerId: userId },
        include: {
          bids: {
            include: {
              contractor: {
                include: { contractor: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get total pending bids on owner's projects
      const totalPendingBids = await db.bid.count({
        where: {
          project: { ownerId: userId },
          status: 'PENDING',
        },
      });

      // Calculate trends
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const currentMonthProjects = await db.project.count({
        where: { ownerId: userId, createdAt: { gte: startOfCurrentMonth } },
      });

      const previousMonthProjects = await db.project.count({
        where: { ownerId: userId, createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth } },
      });

      const currentMonthActive = await db.project.count({
        where: { ownerId: userId, status: 'IN_PROGRESS', updatedAt: { gte: startOfCurrentMonth } },
      });

      const previousMonthActive = await db.project.count({
        where: { ownerId: userId, status: 'IN_PROGRESS', updatedAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth } },
      });

      const currentMonthOpen = await db.project.count({
        where: { ownerId: userId, status: 'OPEN', createdAt: { gte: startOfCurrentMonth } },
      });

      const previousMonthOpen = await db.project.count({
        where: { ownerId: userId, status: 'OPEN', createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth } },
      });

      const currentMonthPendingBids = await db.bid.count({
        where: { project: { ownerId: userId }, status: 'PENDING', createdAt: { gte: startOfCurrentMonth } },
      });

      const previousMonthPendingBids = await db.bid.count({
        where: { project: { ownerId: userId }, status: 'PENDING', createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth } },
      });

      const calculateTrend = (current: number, previous: number): { value: string; isUp: boolean } => {
        if (previous === 0) {
          return { value: current > 0 ? `+${current}` : '0%', isUp: current > 0 };
        }
        const change = ((current - previous) / previous) * 100;
        const roundedChange = Math.round(change);
        return {
          value: `${change >= 0 ? '+' : ''}${roundedChange}%`,
          isUp: change >= 0,
        };
      };

      const totalProjectsTrend = calculateTrend(currentMonthProjects, previousMonthProjects);
      const activeProjectsTrend = calculateTrend(currentMonthActive, previousMonthActive);
      const openProjectsTrend = calculateTrend(currentMonthOpen, previousMonthOpen);
      const pendingBidsTrend = calculateTrend(currentMonthPendingBids, previousMonthPendingBids);

      // ===== NEW: Enhanced owner stats =====

      // Budget utilization
      const totalBudgetResult = await db.project.aggregate({
        where: { ownerId: userId },
        _sum: { budget: true },
      });
      const totalBudget = totalBudgetResult._sum.budget || 0;

      const activeBudgetResult = await db.project.aggregate({
        where: { ownerId: userId, status: 'IN_PROGRESS' },
        _sum: { budget: true },
      });
      const activeBudget = activeBudgetResult._sum.budget || 0;

      const budgetUtilization = totalBudget > 0
        ? Math.round((activeBudget / totalBudget) * 100)
        : 0;

      // Average project duration
      const completedProjectsWithDates = await db.project.findMany({
        where: { ownerId: userId, status: 'COMPLETED', startDate: { not: null }, endDate: { not: null } },
        select: { startDate: true, endDate: true },
      });
      
      let totalDurationDays = 0;
      completedProjectsWithDates.forEach((p) => {
        if (p.startDate && p.endDate) {
          const diffDays = Math.ceil((p.endDate.getTime() - p.startDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays > 0) totalDurationDays += diffDays;
        }
      });
      const averageProjectDuration = completedProjectsWithDates.length > 0
        ? Math.round(totalDurationDays / completedProjectsWithDates.length)
        : 0;

      // Recent activity (last 5 actions)
      let recentActivity: Array<{ action: string; description: string; createdAt: Date; projectName?: string }> = [];
      if (db.activityLog) {
        const recentActivityLogs = await db.activityLog.findMany({
          where: { userId },
          include: {
            project: { select: { title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });
        recentActivity = recentActivityLogs.map((log) => ({
          action: log.action,
          description: log.description,
          createdAt: log.createdAt,
          projectName: log.project?.title || undefined,
        }));
      }

      dashboardData = {
        totalProjects,
        activeProjects,
        openProjects,
        completedProjects,
        totalPendingBids,
        trends: {
          totalProjects: totalProjectsTrend,
          activeProjects: activeProjectsTrend,
          openProjects: openProjectsTrend,
          pendingBids: pendingBidsTrend,
        },
        projects: projects.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          location: p.location,
          budget: p.budget,
          status: p.status,
          bidCount: p.bids.length,
          bids: p.bids.map((b) => ({
            id: b.id,
            price: b.price,
            duration: b.duration,
            status: b.status,
            proposal: b.proposal,
            createdAt: b.createdAt,
            contractor: {
              id: b.contractor.id,
              name: b.contractor.name,
              isVerified: b.contractor.isVerified,
              company: b.contractor.contractor?.companyName,
              rating: b.contractor.contractor?.rating,
              totalProjects: b.contractor.contractor?.totalProjects,
            },
          })),
        })),
        // NEW fields
        budgetUtilization,
        averageProjectDuration,
        recentActivity,
      };
    }

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
