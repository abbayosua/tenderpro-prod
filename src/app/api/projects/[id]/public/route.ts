import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID diperlukan' },
        { status: 400 }
      );
    }

    const project = await db.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isVerified: true,
            owner: {
              select: {
                companyName: true,
                totalProjects: true,
                activeProjects: true,
              },
            },
          },
        },
        milestones: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { bids: true },
        },
        bids: {
          take: 1,
          orderBy: { price: 'asc' },
          select: { price: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyek tidak ditemukan' },
        { status: 404 }
      );
    }

    // Increment view count
    await db.project.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Get related projects (same category, different id)
    const relatedProjects = await db.project.findMany({
      where: {
        id: { not: id },
        category: project.category,
        status: 'OPEN',
      },
      take: 4,
      include: {
        owner: {
          select: { name: true, avatar: true, isVerified: true },
        },
        _count: {
          select: { bids: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse requirements from JSON string if exists
    let requirements: string[] = [];
    if (project.requirements) {
      try {
        requirements = JSON.parse(project.requirements);
      } catch {
        // If not JSON, treat as single item
        if (project.requirements.trim()) {
          requirements = [project.requirements];
        }
      }
    }

    // Calculate project progress from milestones
    const totalMilestones = project.milestones.length;
    const completedMilestones = project.milestones.filter(
      (m) => m.status === 'COMPLETED'
    ).length;
    const progress =
      totalMilestones > 0
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
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
        viewCount: project.viewCount + 1,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        requirements,
        owner: {
          id: project.owner.id,
          name: project.owner.name,
          avatar: project.owner.avatar,
          isVerified: project.owner.isVerified,
          company: project.owner.owner?.companyName || null,
          totalProjects: project.owner.owner?.totalProjects || 0,
          activeProjects: project.owner.owner?.activeProjects || 0,
        },
        milestones: project.milestones.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          amount: m.amount,
          dueDate: m.dueDate,
          completedAt: m.completedAt,
          status: m.status,
          order: m.order,
        })),
        progress,
        bidCount: project._count.bids,
        lowestBid: project.bids[0]?.price || null,
        relatedProjects: relatedProjects.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          location: p.location,
          budget: p.budget,
          bidCount: p._count.bids,
          owner: p.owner,
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Public project detail error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
