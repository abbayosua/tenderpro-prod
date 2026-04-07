import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
  userId: z.string().optional(),
  days: z.coerce.number().min(1).max(365).default(30),
  role: z.enum(['OWNER', 'CONTRACTOR']).optional(),
});

// GET: Return projects with upcoming deadlines
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      userId: searchParams.get('userId') || undefined,
      days: searchParams.get('days') || '30',
      role: searchParams.get('role') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { userId, days, role } = parsed.data;
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Build where clause for active projects with deadlines
    const where: Record<string, unknown> = {
      status: { in: ['OPEN', 'IN_PROGRESS'] },
      endDate: { lte: futureDate },
    };

    if (userId && role === 'OWNER') {
      where.ownerId = userId;
    }

    // Fetch projects with upcoming deadlines
    const projects = await db.project.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        milestones: {
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            dueDate: { lte: futureDate },
          },
          select: {
            id: true,
            title: true,
            dueDate: true,
            status: true,
            amount: true,
          },
          orderBy: { dueDate: 'asc' },
        },
        bids: {
          where: { status: 'ACCEPTED' },
          select: {
            contractorId: true,
            contractor: {
              select: {
                id: true,
                name: true,
                avatar: true,
                contractor: {
                  select: { companyName: true },
                },
              },
            },
          },
          take: 1,
        },
        _count: {
          select: { bids: true },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    // If contractor role, filter projects where contractor has accepted bid
    let filteredProjects = projects;
    if (userId && role === 'CONTRACTOR') {
      filteredProjects = projects.filter(
        (p) => p.bids.some((b) => b.contractorId === userId)
      );
    }

    // Process projects and calculate deadline info
    type WarningLevel = 'urgent' | 'warning' | 'normal';

    const processedProjects = await Promise.all(filteredProjects.map(async (project) => {
      const endDate = project.endDate;
      if (!endDate) return null;

      const daysRemaining = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      let warningLevel: WarningLevel = 'normal';
      if (daysRemaining < 3) {
        warningLevel = 'urgent';
      } else if (daysRemaining < 7) {
        warningLevel = 'warning';
      }

      // Process milestones
      const milestoneDeadlines = project.milestones
        .filter((m) => m.dueDate)
        .map((milestone) => {
          const msDueDate = new Date(milestone.dueDate!);
          const msDaysRemaining = Math.ceil(
            (msDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          let msWarningLevel: WarningLevel = 'normal';
          if (msDaysRemaining < 3) {
            msWarningLevel = 'urgent';
          } else if (msDaysRemaining < 7) {
            msWarningLevel = 'warning';
          }

          return {
            id: milestone.id,
            title: milestone.title,
            dueDate: milestone.dueDate!.toISOString(),
            daysRemaining: msDaysRemaining,
            warningLevel: msWarningLevel,
            status: milestone.status,
            amount: milestone.amount,
          };
        })
        .sort((a, b) => a.daysRemaining - b.daysRemaining);

      // Calculate project progress based on milestones
      const totalMilestones = project.milestones.length > 0
        ? await db.projectMilestone.count({ where: { projectId: project.id } })
        : 0;
      const completedMilestones = totalMilestones > 0
        ? await db.projectMilestone.count({
            where: { projectId: project.id, status: 'COMPLETED' },
          })
        : 0;
      const progress = totalMilestones > 0
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0;

      return {
        id: project.id,
        title: project.title,
        category: project.category,
        status: project.status,
        endDate: endDate.toISOString(),
        daysRemaining,
        warningLevel,
        warningLabel:
          warningLevel === 'urgent'
            ? 'Segera!'
            : warningLevel === 'warning'
              ? 'Perhatian'
              : 'Normal',
        budget: project.budget,
        progress,
        bidCount: project._count.bids,
        owner: project.owner,
        contractor: project.bids[0]?.contractor
          ? {
              id: project.bids[0].contractor.id,
              name: project.bids[0].contractor.name,
              avatar: project.bids[0].contractor.avatar,
              companyName: project.bids[0].contractor.contractor?.companyName,
            }
          : null,
        milestoneDeadlines,
        upcomingMilestoneCount: milestoneDeadlines.length,
      };
    }));

    // Filter out nulls and sort by daysRemaining
    const validProjects = processedProjects
      .filter((p) => p !== null && p.daysRemaining >= 0)
      .sort((a, b) => a!.daysRemaining - b!.daysRemaining);

    // Summary statistics
    const urgentCount = validProjects.filter((p) => p!.warningLevel === 'urgent').length;
    const warningCount = validProjects.filter((p) => p!.warningLevel === 'warning').length;
    const normalCount = validProjects.filter((p) => p!.warningLevel === 'normal').length;

    // Upcoming milestone summary across all projects
    const allMilestones = validProjects.flatMap((p) => p!.milestoneDeadlines);
    const urgentMilestones = allMilestones.filter((m) => m.warningLevel === 'urgent').length;

    return NextResponse.json({
      success: true,
      data: {
        projects: validProjects,
        summary: {
          totalProjects: validProjects.length,
          urgentCount,
          warningCount,
          normalCount,
          totalMilestones: allMilestones.length,
          urgentMilestones,
        },
        filters: {
          days,
          userId: userId || null,
          role: role || null,
        },
      },
    });
  } catch (error) {
    console.error('Gagal memuat pengingat deadline:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat pengingat deadline' },
      { status: 500 }
    );
  }
}
