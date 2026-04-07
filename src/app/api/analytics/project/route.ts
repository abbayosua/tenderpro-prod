import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Parameter userId wajib diisi' },
        { status: 400 }
      );
    }

    // Fetch projects owned by this user
    const whereClause: Record<string, unknown> = { ownerId: userId };
    if (projectId) whereClause.id = projectId;

    const projects = await db.project.findMany({
      where: whereClause,
      include: {
        bids: {
          include: {
            contractor: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        milestones: {
          include: {
            payments: true,
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { bids: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (projects.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalProjects: 0,
          overallBudget: 0,
          totalSpent: 0,
          budgetUtilization: 0,
          milestoneCompletionRate: 0,
          riskScore: 0,
          bidAnalysis: { average: 0, min: 0, max: 0, count: 0, distribution: [] },
          contractorInterest: [],
          projectTimeline: [],
          budgetComparison: [],
        },
      });
    }

    // Calculate overall stats
    const totalProjects = projects.length;
    const overallBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const allMilestones = projects.flatMap(p => p.milestones);
    const totalSpent = allMilestones.flatMap(m => m.payments)
      .filter(p => p.status === 'PAID' || p.status === 'CONFIRMED')
      .reduce((sum, p) => sum + p.amount, 0);
    const budgetUtilization = overallBudget > 0 ? Math.round((totalSpent / overallBudget) * 100) : 0;
    const completedMilestones = allMilestones.filter(m => m.status === 'COMPLETED').length;
    const milestoneCompletionRate = allMilestones.length > 0
      ? Math.round((completedMilestones / allMilestones.length) * 100) : 0;

    // Bid analysis across all projects
    const allBids = projects.flatMap(p => p.bids);
    const acceptedBids = allBids.filter(b => b.status === 'ACCEPTED');
    const bidPrices = allBids.map(b => b.price);
    const bidAverage = bidPrices.length > 0 ? bidPrices.reduce((a, b) => a + b, 0) / bidPrices.length : 0;
    const bidMin = bidPrices.length > 0 ? Math.min(...bidPrices) : 0;
    const bidMax = bidPrices.length > 0 ? Math.max(...bidPrices) : 0;

    // Bid distribution histogram
    const ranges = [
      { label: '< 50 Jt', min: 0, max: 50000000 },
      { label: '50-100 Jt', min: 50000000, max: 100000000 },
      { label: '100-250 Jt', min: 100000000, max: 250000000 },
      { label: '250-500 Jt', min: 250000000, max: 500000000 },
      { label: '> 500 Jt', min: 500000000, max: Infinity },
    ];
    const bidDistribution = ranges.map(r => ({
      range: r.label,
      count: bidPrices.filter(p => p >= r.min && p < r.max).length,
    }));

    // Contractor interest over time (last 6 months)
    const now = new Date();
    const indonesianMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const contractorInterest: Array<{ month: string; newBids: number; newContractors: number }> = [];
    const seenContractors = new Set<string>();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const monthBids = allBids.filter(b => {
        const bd = new Date(b.createdAt);
        return bd >= monthStart && bd <= monthEnd;
      });

      const newContractorIds = new Set<string>();
      monthBids.forEach(b => {
        if (!seenContractors.has(b.contractorId)) {
          newContractorIds.add(b.contractorId);
        }
      });
      monthBids.forEach(b => seenContractors.add(b.contractorId));

      contractorInterest.push({
        month: indonesianMonths[month],
        newBids: monthBids.length,
        newContractors: newContractorIds.size,
      });
    }

    // Project timeline (Gantt-like)
    const projectTimeline = projects.slice(0, 10).map((p, idx) => {
      const start = p.startDate ? new Date(p.startDate) : p.createdAt;
      const end = p.endDate || new Date(start.getTime() + (p.duration || 30) * 86400000);
      const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
      const completedMs = p.milestones.filter(m => m.status === 'COMPLETED').length;
      const totalMs = p.milestones.length;
      const progress = totalMs > 0 ? Math.round((completedMs / totalMs) * 100) : 0;

      return {
        id: p.id,
        title: p.title,
        status: p.status,
        budget: p.budget,
        startOffset: idx * 5, // stagger for Gantt effect
        duration: Math.max(1, totalDays),
        progress,
        bidCount: p._count.bids,
      };
    });

    // Budget vs actual per project
    const budgetComparison = projects.slice(0, 8).map(p => {
      const projectPayments = p.milestones.flatMap(m => m.payments)
        .filter(pay => pay.status === 'PAID' || pay.status === 'CONFIRMED');
      const spent = projectPayments.reduce((sum, pay) => sum + pay.amount, 0);
      return {
        name: p.title.length > 15 ? p.title.slice(0, 15) + '...' : p.title,
        budget: p.budget,
        spent,
        remaining: Math.max(0, p.budget - spent),
        percentage: p.budget > 0 ? Math.round((spent / p.budget) * 100) : 0,
      };
    });

    // Risk assessment
    let riskScore = 0;
    // Budget overrun risk
    const overBudgetProjects = budgetComparison.filter(b => b.percentage >= 80);
    riskScore += overBudgetProjects.length * 15;
    // Timeline delay risk
    const delayedMilestones = allMilestones.filter(m => {
      if (m.status === 'COMPLETED' || !m.dueDate) return false;
      return new Date(m.dueDate) < new Date();
    });
    riskScore += delayedMilestones.length * 10;
    // Low completion risk
    if (milestoneCompletionRate < 30) riskScore += 20;
    else if (milestoneCompletionRate < 60) riskScore += 10;
    // Cap at 100
    riskScore = Math.min(100, riskScore);

    const riskLabel = riskScore >= 70 ? 'TINGGI' : riskScore >= 40 ? 'SEDANG' : 'RENDAH';

    return NextResponse.json({
      success: true,
      data: {
        totalProjects,
        overallBudget,
        totalSpent,
        budgetUtilization,
        milestoneCompletionRate,
        riskScore,
        riskLabel,
        bidAnalysis: {
          average: Math.round(bidAverage),
          min: bidMin,
          max: bidMax,
          count: allBids.length,
          acceptedCount: acceptedBids.length,
          distribution: bidDistribution,
        },
        contractorInterest,
        projectTimeline,
        budgetComparison,
      },
    });
  } catch (error) {
    console.error('Error fetching project analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat analitik proyek' },
      { status: 500 }
    );
  }
}
