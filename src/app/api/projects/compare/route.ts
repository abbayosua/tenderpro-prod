import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectIds } = body as { projectIds?: string[] };

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'projectIds wajib diisi sebagai array' },
        { status: 400 }
      );
    }

    if (projectIds.length > 3) {
      return NextResponse.json(
        { success: false, error: 'Maksimal 3 proyek yang dapat dibandingkan' },
        { status: 400 }
      );
    }

    // Fetch all projects with bids, milestones, and owner info
    const projects = await db.project.findMany({
      where: {
        id: { in: projectIds },
      },
      include: {
        bids: {
          select: {
            id: true,
            price: true,
            duration: true,
            status: true,
            createdAt: true,
          },
        },
        milestones: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
            completedAt: true,
          },
          orderBy: { dueDate: 'asc' },
        },
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Enrich each project with calculated fields
    const enrichedProjects = projects.map((project) => {
      const bids = project.bids;
      const bidCount = bids.length;
      const bidPrices = bids.map((b) => b.price);
      const lowestBid = bidPrices.length > 0 ? Math.min(...bidPrices) : 0;
      const highestBid = bidPrices.length > 0 ? Math.max(...bidPrices) : 0;
      const averageBid = bidPrices.length > 0 ? bidPrices.reduce((a, b) => a + b, 0) / bidPrices.length : 0;

      const milestones = project.milestones;
      const completedMilestones = milestones.filter((m) => m.status === 'COMPLETED').length;
      const totalMilestones = milestones.length;
      const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

      return {
        id: project.id,
        title: project.title,
        description: project.description,
        category: project.category,
        location: project.location,
        budget: project.budget,
        duration: project.duration,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        createdAt: project.createdAt,
        bidCount,
        averageBid: Math.round(averageBid),
        lowestBid,
        highestBid,
        ownerName: project.owner.name,
        progress,
        milestonesCompleted: completedMilestones,
        milestonesTotal: totalMilestones,
      };
    });

    // Comparison summary
    let cheapestProject: { id: string; title: string; budget: number } | null = null;
    let mostBidsProject: { id: string; title: string; bidCount: number } | null = null;
    let closestToDeadline: { id: string; title: string; endDate: Date | null; daysLeft: number } | null = null;
    let recommendedProject: { id: string; title: string; reason: string } | null = null;

    if (enrichedProjects.length >= 2) {
      // Cheapest project
      const cheapest = enrichedProjects.reduce((min, p) =>
        p.budget < min.budget ? p : min
      );
      cheapestProject = { id: cheapest.id, title: cheapest.title, budget: cheapest.budget };

      // Most bids
      const mostBids = enrichedProjects.reduce((max, p) =>
        p.bidCount > max.bidCount ? p : max
      );
      mostBidsProject = { id: mostBids.id, title: mostBids.title, bidCount: mostBids.bidCount };

      // Closest to deadline (among projects with endDate)
      const withEndDate = enrichedProjects.filter((p) => p.endDate);
      if (withEndDate.length > 0) {
        const now = new Date();
        const closest = withEndDate.reduce((min, p) => {
          const diff = new Date(p.endDate!).getTime() - now.getTime();
          const minDiff = new Date(min.endDate!).getTime() - now.getTime();
          return diff < minDiff ? p : min;
        });
        const daysLeft = Math.max(
          0,
          Math.ceil(
            (new Date(closest.endDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        );
        closestToDeadline = {
          id: closest.id,
          title: closest.title,
          endDate: closest.endDate,
          daysLeft,
        };
      }

      // Recommended: most bids + lowest average bid
      const scored = enrichedProjects
        .filter((p) => p.bidCount > 0)
        .map((p) => ({
          id: p.id,
          title: p.title,
          score: p.bidCount + (p.averageBid > 0 ? p.budget / p.averageBid : 0),
        }))
        .sort((a, b) => b.score - a.score);

      if (scored.length > 0) {
        recommendedProject = {
          id: scored[0].id,
          title: scored[0].title,
          reason: 'Paling banyak bid dan rata-rata bid terendah',
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        projects: enrichedProjects,
        comparison: {
          cheapestProject,
          mostBidsProject,
          closestToDeadline,
          recommendedProject,
        },
      },
    });
  } catch (error) {
    console.error('Error comparing projects:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membandingkan proyek' },
      { status: 500 }
    );
  }
}
