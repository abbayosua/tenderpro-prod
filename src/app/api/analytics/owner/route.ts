import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID wajib diisi' }, { status: 400 });
    }

    // Fetch all owner projects with milestones, bids, and payments
    const projects = await db.project.findMany({
      where: { ownerId: userId },
      include: {
        milestones: {
          include: { payments: true },
          orderBy: { order: 'asc' },
        },
        bids: {
          include: {
            contractor: {
              select: { id: true, name: true, rating: true, contractor: { select: { completedProjects: true, experienceYears: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalProjects = projects.length;
    const overallBudget = projects.reduce((s, p) => s + p.budget, 0);

    // Calculate spent from paid payments
    let totalSpent = 0;
    let completedMilestones = 0;
    let totalMilestones = 0;

    projects.forEach((p) => {
      p.milestones.forEach((m) => {
        totalMilestones++;
        if (m.status === 'COMPLETED') {
          completedMilestones++;
          m.payments.forEach((pay) => {
            if (pay.status === 'PAID' || pay.status === 'CONFIRMED') {
              totalSpent += pay.amount;
            }
          });
        }
      });
    });

    const budgetUtilization = overallBudget > 0 ? Math.round((totalSpent / overallBudget) * 100) : 0;
    const milestoneCompletionRate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    // Risk score calculation
    let riskScore = 0;
    if (budgetUtilization > 90) riskScore += 40;
    else if (budgetUtilization > 70) riskScore += 20;
    else riskScore += 5;

    const overdueMilestones = projects.reduce((count, p) => {
      return count + p.milestones.filter((m) => {
        if (m.status === 'COMPLETED') return false;
        if (!m.dueDate) return false;
        return new Date(m.dueDate) < new Date();
      }).length;
    }, 0);
    riskScore += Math.min(overdueMilestones * 10, 30);

    if (milestoneCompletionRate < 30) riskScore += 30;
    else if (milestoneCompletionRate < 60) riskScore += 15;
    else riskScore += 5;

    const riskScoreCapped = Math.min(riskScore, 100);
    const riskLabel = riskScoreCapped >= 70 ? 'TINGGI' : riskScoreCapped >= 40 ? 'SEDANG' : 'RENDAH';

    // Bid analysis
    const allBids = projects.flatMap((p) => p.bids);
    const bidPrices = allBids.map((b) => b.price).filter((p) => p > 0);
    const acceptedBids = allBids.filter((b) => b.status === 'ACCEPTED');
    const avgBid = bidPrices.length > 0 ? bidPrices.reduce((s, p) => s + p, 0) / bidPrices.length : 0;
    const minBid = bidPrices.length > 0 ? Math.min(...bidPrices) : 0;
    const maxBid = bidPrices.length > 0 ? Math.max(...bidPrices) : 0;

    // Bid distribution
    const bidRanges = [
      { range: '< 50Jt', min: 0, max: 50000000 },
      { range: '50-100Jt', min: 50000000, max: 100000000 },
      { range: '100-250Jt', min: 100000000, max: 250000000 },
      { range: '250-500Jt', min: 250000000, max: 500000000 },
      { range: '> 500Jt', min: 500000000, max: Infinity },
    ];
    const bidDistribution = bidRanges.map((r) => ({
      range: r.range,
      count: allBids.filter((b) => b.price >= r.min && b.price < r.max).length,
    }));

    // Contractor interest over time (last 6 months)
    const now = new Date();
    const indonesianMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const contractorInterest: Array<{ month: string; newBids: number; newContractors: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthBids = allBids.filter((b) => {
        const bd = new Date(b.createdAt);
        return bd >= monthStart && bd <= monthEnd;
      });

      const uniqueContractors = new Set(monthBids.map((b) => b.contractorId));

      contractorInterest.push({
        month: indonesianMonths[date.getMonth()],
        newBids: monthBids.length,
        newContractors: uniqueContractors.size,
      });
    }

    // Budget comparison per project (active projects)
    const budgetComparison = projects
      .filter((p) => p.status === 'IN_PROGRESS' || p.status === 'OPEN')
      .map((p) => {
        const projectSpent = p.milestones.reduce((ms, m) => {
          if (m.status !== 'COMPLETED') return ms;
          return ms + m.payments.filter((pay) => pay.status === 'PAID' || pay.status === 'CONFIRMED').reduce((s, pay) => s + pay.amount, 0);
        }, 0);
        return {
          name: p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title,
          budget: p.budget,
          spent: projectSpent,
          remaining: p.budget - projectSpent,
          percentage: p.budget > 0 ? Math.round((projectSpent / p.budget) * 100) : 0,
        };
      });

    // Project timeline data
    const projectTimeline = projects.map((p) => {
      const completedMs = p.milestones.filter((m) => m.status === 'COMPLETED').length;
      const totalMs = p.milestones.length || 1;
      const progress = Math.round((completedMs / totalMs) * 100);

      let startOffset = 0;
      if (p.createdAt) {
        const oldest = new Date(Math.min(...projects.filter((x) => x.createdAt).map((x) => new Date(x.createdAt).getTime())));
        startOffset = Math.round((new Date(p.createdAt).getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        id: p.id,
        title: p.title.length > 25 ? p.title.substring(0, 25) + '...' : p.title,
        status: p.status,
        budget: p.budget,
        startOffset: Math.max(startOffset, 0),
        duration: p.duration || 30,
        progress,
        bidCount: p.bids.length,
      };
    });

    // ** NEW: Monthly project creation trend (bar chart)**
    const monthlyCreation: Array<{ month: string; projects: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      const count = projects.filter((p) => {
        const cd = new Date(p.createdAt);
        return cd >= monthStart && cd <= monthEnd;
      }).length;
      monthlyCreation.push({ month: indonesianMonths[date.getMonth()], projects: count });
    }

    // ** NEW: Budget donut chart data **
    const budgetRemaining = overallBudget - totalSpent;

    // ** NEW: Top contractor performance ranking**
    const contractorPerformanceMap = new Map<string, {
      contractorId: string;
      name: string;
      rating: number;
      totalBids: number;
      acceptedBids: number;
      completedProjects: number;
      experienceYears: number;
      totalBidAmount: number;
    }>();

    allBids.forEach((b) => {
      const existing = contractorPerformanceMap.get(b.contractorId);
      const cInfo = b.contractor;
      if (!existing) {
        contractorPerformanceMap.set(b.contractorId, {
          contractorId: b.contractorId,
          name: cInfo.name,
          rating: cInfo.rating,
          totalBids: 1,
          acceptedBids: b.status === 'ACCEPTED' ? 1 : 0,
          completedProjects: cInfo.contractor?.completedProjects || 0,
          experienceYears: cInfo.contractor?.experienceYears || 0,
          totalBidAmount: b.price,
        });
      } else {
        existing.totalBids++;
        if (b.status === 'ACCEPTED') existing.acceptedBids++;
        existing.totalBidAmount += b.price;
      }
    });

    const topContractors = Array.from(contractorPerformanceMap.values())
      .sort((a, b) => b.acceptedBids - a.acceptedBids || b.rating - a.rating)
      .slice(0, 5)
      .map((c) => ({
        ...c,
        winRate: c.totalBids > 0 ? Math.round((c.acceptedBids / c.totalBids) * 100) : 0,
        avgBid: c.totalBids > 0 ? Math.round(c.totalBidAmount / c.totalBids) : 0,
      }));

    // ** NEW: Risk assessment cards for active projects**
    const riskAssessment = projects
      .filter((p) => p.status === 'IN_PROGRESS')
      .map((p) => {
        const projSpent = p.milestones.reduce((ms, m) => {
          if (m.status !== 'COMPLETED') return ms;
          return ms + m.payments.filter((pay) => pay.status === 'PAID' || pay.status === 'CONFIRMED').reduce((s, pay) => s + pay.amount, 0);
        }, 0);
        const projBudgetUtil = p.budget > 0 ? (projSpent / p.budget) * 100 : 0;

        const completedMs = p.milestones.filter((m) => m.status === 'COMPLETED').length;
        const totalMs = p.milestones.length || 1;
        const projProgress = (completedMs / totalMs) * 100;

        const overdueMs = p.milestones.filter((m) => {
          if (m.status === 'COMPLETED' || !m.dueDate) return false;
          return new Date(m.dueDate) < new Date();
        }).length;

        let projRisk = 0;
        if (projBudgetUtil > 90) projRisk += 40;
        else if (projBudgetUtil > 70) projRisk += 20;
        if (overdueMs > 0) projRisk += overdueMs * 15;
        if (projProgress < 30 && p.milestones.length > 0) projRisk += 20;

        projRisk = Math.min(projRisk, 100);
        const projRiskLabel = projRisk >= 70 ? 'Tinggi' : projRisk >= 40 ? 'Sedang' : 'Rendah';
        const projRiskColor = projRisk >= 70 ? 'red' : projRisk >= 40 ? 'amber' : 'emerald';

        return {
          projectId: p.id,
          projectTitle: p.title,
          budgetUtilization: Math.round(projBudgetUtil),
          progress: Math.round(projProgress),
          overdueMilestones: overdueMs,
          riskScore: projRisk,
          riskLabel: projRiskLabel,
          riskColor: projRiskColor,
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        totalProjects,
        overallBudget,
        totalSpent,
        budgetUtilization,
        milestoneCompletionRate,
        riskScore: riskScoreCapped,
        riskLabel,
        bidAnalysis: {
          average: Math.round(avgBid),
          min: minBid,
          max: maxBid,
          count: allBids.length,
          acceptedCount: acceptedBids.length,
          distribution: bidDistribution,
        },
        contractorInterest,
        projectTimeline,
        budgetComparison,
        // New fields
        monthlyCreation,
        budgetOverview: {
          allocated: overallBudget,
          spent: totalSpent,
          remaining: budgetRemaining,
        },
        topContractors,
        riskAssessment,
      },
    });
  } catch (error) {
    console.error('Error fetching owner analytics:', error);
    return NextResponse.json({
      success: true,
      data: {
        totalProjects: 0,
        overallBudget: 0,
        totalSpent: 0,
        budgetUtilization: 0,
        milestoneCompletionRate: 0,
        riskScore: 0,
        riskLabel: 'RENDAH',
        bidAnalysis: { average: 0, min: 0, max: 0, count: 0, acceptedCount: 0, distribution: [] },
        contractorInterest: [],
        projectTimeline: [],
        budgetComparison: [],
        monthlyCreation: [],
        budgetOverview: { allocated: 0, spent: 0, remaining: 0 },
        topContractors: [],
        riskAssessment: [],
      },
    });
  }
}
