import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Dashboard analytics overview
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
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    // Base query conditions
    const isOwner = user.role === 'OWNER';
    const whereCondition = isOwner ? { ownerId: userId } : {};

    // Fetch all user projects with related data
    const projects = await db.project.findMany({
      where: whereCondition,
      include: {
        bids: {
          select: {
            id: true,
            status: true,
            price: true,
            contractorId: true,
            contractor: {
              select: {
                id: true,
                name: true,
                contractor: {
                  select: {
                    companyName: true,
                    rating: true,
                    completedProjects: true,
                  },
                },
              },
            },
          },
        },
        milestones: {
          select: {
            status: true,
            amount: true,
            payments: {
              select: {
                amount: true,
                status: true,
                paidAt: true,
              },
            },
          },
        },
        _count: {
          select: { bids: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate overview stats
    const totalProjects = projects.length;
    const activeProjects = projects.filter(
      (p) => p.status === 'OPEN' || p.status === 'IN_PROGRESS'
    ).length;
    const completedProjects = projects.filter(
      (p) => p.status === 'COMPLETED'
    ).length;
    const completionRate =
      totalProjects > 0
        ? Math.round((completedProjects / totalProjects) * 100)
        : 0;

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const averageBudget =
      totalProjects > 0 ? Math.round(totalBudget / totalProjects) : 0;

    // Calculate total spent from paid milestones
    const totalSpent = projects.reduce((sum, p) => {
      const projectSpent = p.milestones.reduce((mSum, m) => {
        const paidAmount = m.payments
          .filter((pay) => pay.status === 'PAID' || pay.status === 'CONFIRMED')
          .reduce((pSum, pay) => pSum + pay.amount, 0);
        return mSum + paidAmount;
      }, 0);
      return sum + projectSpent;
    }, 0);

    // Calculate average project duration
    const projectsWithDuration = projects.filter(
      (p) => p.startDate && p.endDate
    );
    const averageProjectDuration =
      projectsWithDuration.length > 0
        ? Math.round(
            projectsWithDuration.reduce((sum, p) => {
              const start = new Date(p.startDate!).getTime();
              const end = new Date(p.endDate!).getTime();
              return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            }, 0) / projectsWithDuration.length
          )
        : 0;

    const overview = {
      totalProjects,
      activeProjects,
      completedProjects,
      completionRate,
      averageBudget,
      totalSpent,
      averageProjectDuration,
    };

    // Monthly trend (last 6 months)
    const now = new Date();
    const monthlyTrend: Array<{ month: string; projects: number; spent: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

      const monthProjects = projects.filter((p) => {
        const created = new Date(p.createdAt);
        return created >= monthStart && created <= monthEnd;
      });

      const monthSpent = projects.reduce((sum, p) => {
        const projectSpent = p.milestones.reduce((mSum, m) => {
          const milestonePaid = m.payments
            .filter((pay) => {
              if (pay.status !== 'PAID' && pay.status !== 'CONFIRMED') return false;
              if (!pay.paidAt) return false;
              const paidDate = new Date(pay.paidAt);
              return paidDate >= monthStart && paidDate <= monthEnd;
            })
            .reduce((pSum, pay) => pSum + pay.amount, 0);
          return mSum + milestonePaid;
        }, 0);
        return sum + projectSpent;
      }, 0);

      monthlyTrend.push({
        month: monthStr,
        projects: monthProjects.length,
        spent: monthSpent,
      });
    }

    // Category distribution
    const categoryMap = new Map<
      string,
      { count: number; totalBudget: number }
    >();
    for (const project of projects) {
      const cat = project.category || 'Lainnya';
      const existing = categoryMap.get(cat) || { count: 0, totalBudget: 0 };
      existing.count += 1;
      existing.totalBudget += project.budget || 0;
      categoryMap.set(cat, existing);
    }

    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        totalBudget: data.totalBudget,
      }))
      .sort((a, b) => b.totalBudget - a.totalBudget);

    // Top contractors (from bids with contractor data)
    const contractorMap = new Map<
      string,
      {
        name: string;
        rating: number;
        completedProjects: number;
        totalBids: number;
        acceptedBids: number;
      }
    >();

    for (const project of projects) {
      for (const bid of project.bids) {
        if (!bid.contractor) continue;
        const existing = contractorMap.get(bid.contractorId) || {
          name: bid.contractor.name,
          rating: bid.contractor.contractor?.rating || 0,
          completedProjects: bid.contractor.contractor?.completedProjects || 0,
          totalBids: 0,
          acceptedBids: 0,
        };
        existing.totalBids += 1;
        if (bid.status === 'ACCEPTED') existing.acceptedBids += 1;
        contractorMap.set(bid.contractorId, existing);
      }
    }

    const topContractors = Array.from(contractorMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        rating: data.rating,
        completedProjects: data.completedProjects,
        totalBids: data.totalBids,
        acceptedBids: data.acceptedBids,
      }))
      .sort((a, b) => b.acceptedBids - a.acceptedBids || b.rating - a.rating)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      analytics: {
        overview,
        monthlyTrend,
        categoryDistribution,
        topContractors,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data analitik' },
      { status: 500 }
    );
  }
}
