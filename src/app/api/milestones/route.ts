import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get project milestones with status filter and progress percentage
export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    const status = request.nextUrl.searchParams.get('status');

    if (!projectId) {
      return NextResponse.json({ error: 'Parameter projectId wajib diisi' }, { status: 400 });
    }

    // Check if projectMilestone model exists
    if (!db.projectMilestone) {
      return NextResponse.json({ milestones: [], progress: 0, total: 0, completed: 0 });
    }

    // Build where clause
    const whereClause: Record<string, unknown> = { projectId };
    if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      whereClause.status = status;
    }

    const milestones = await db.projectMilestone.findMany({
      where: whereClause,
      orderBy: { order: 'asc' },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Calculate overall progress (from ALL milestones, not filtered)
    const allMilestones = await db.projectMilestone.findMany({
      where: { projectId },
    });

    const total = allMilestones.length;
    const completed = allMilestones.filter(m => m.status === 'COMPLETED').length;
    const inProgress = allMilestones.filter(m => m.status === 'IN_PROGRESS').length;
    const pending = allMilestones.filter(m => m.status === 'PENDING').length;

    // Progress calculation: COMPLETED = 100%, IN_PROGRESS = 50%, PENDING = 0%
    const rawProgress = allMilestones.reduce((sum, m) => {
      if (m.status === 'COMPLETED') return sum + 100;
      if (m.status === 'IN_PROGRESS') return sum + 50;
      return sum + 0;
    }, 0);
    const progress = total > 0 ? Math.round(rawProgress / total) : 0;

    // Calculate payment stats
    const totalBudget = allMilestones.reduce((sum, m) => sum + (m.amount || 0), 0);
    const totalPaid = allMilestones.reduce((sum, m) => {
      const paid = m.payments?.filter((p: { status: string }) => p.status === 'CONFIRMED').reduce((s: number, p: { amount: number }) => s + p.amount, 0) || 0;
      return sum + paid;
    }, 0);

    // Status breakdown
    const statusBreakdown = {
      pending,
      inProgress,
      completed,
    };

    return NextResponse.json({
      milestones,
      progress,
      total,
      completed,
      statusBreakdown,
      paymentStats: {
        totalBudget,
        totalPaid,
        percentage: totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json({ milestones: [], progress: 0, total: 0, completed: 0 });
  }
}

// POST - Create a milestone with amount and order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, title, description, amount, dueDate, order } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: 'Parameter projectId dan title wajib diisi' }, { status: 400 });
    }

    // Check if projectMilestone model exists
    if (!db.projectMilestone) {
      return NextResponse.json({ error: 'Fitur belum tersedia' }, { status: 503 });
    }

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan' }, { status: 404 });
    }

    // Get max order if not specified
    const maxOrder = order
      ? { order }
      : await db.projectMilestone.findFirst({
          where: { projectId },
          orderBy: { order: 'desc' },
          select: { order: true },
        }).then(r => ({ order: (r?.order ?? 0) + 1 }));

    const milestone = await db.projectMilestone.create({
      data: {
        projectId,
        title,
        description: description || null,
        amount: amount ? parseFloat(String(amount)) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        order: maxOrder.order,
        status: 'PENDING',
      },
    });

    // Recalculate project progress
    await recalculateProjectProgress(projectId);

    return NextResponse.json({ success: true, milestone });
  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json({ error: 'Gagal membuat milestone' }, { status: 500 });
  }
}

// PUT - Update milestone status and dueDate
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { milestoneId, status, dueDate, title, description, amount, completedAt } = body;

    if (!milestoneId) {
      return NextResponse.json({ error: 'Parameter milestoneId wajib diisi' }, { status: 400 });
    }

    // Check if projectMilestone model exists
    if (!db.projectMilestone) {
      return NextResponse.json({ error: 'Fitur belum tersedia' }, { status: 503 });
    }

    // Fetch existing milestone
    const existing = await db.projectMilestone.findUnique({
      where: { id: milestoneId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Milestone tidak ditemukan' }, { status: 404 });
    }

    // Validate status transitions
    if (status) {
      const validTransitions: Record<string, string[]> = {
        'PENDING': ['IN_PROGRESS'],
        'IN_PROGRESS': ['COMPLETED', 'PENDING'],
        'COMPLETED': [], // Cannot revert from completed
      };
      const allowed = validTransitions[existing.status] || [];
      if (allowed.length > 0 && !allowed.includes(status)) {
        return NextResponse.json({
          error: `Transisi status tidak valid: ${existing.status} → ${status}. Perubahan yang diizinkan: ${allowed.join(', ') || 'tidak ada'}`,
        }, { status: 400 });
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = completedAt ? new Date(completedAt) : new Date();
      } else if (status === 'PENDING') {
        updateData.completedAt = null;
      }
    }

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (title !== undefined) {
      updateData.title = title;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (amount !== undefined) {
      updateData.amount = amount ? parseFloat(String(amount)) : null;
    }

    const milestone = await db.projectMilestone.update({
      where: { id: milestoneId },
      data: updateData,
    });

    // Recalculate project progress
    await recalculateProjectProgress(existing.projectId);

    return NextResponse.json({ success: true, milestone });
  } catch (error) {
    console.error('Error updating milestone:', error);
    return NextResponse.json({ error: 'Gagal mengupdate milestone' }, { status: 500 });
  }
}

// DELETE - Remove milestone (only if PENDING)
export async function DELETE(request: NextRequest) {
  try {
    const milestoneId = request.nextUrl.searchParams.get('id');

    if (!milestoneId) {
      return NextResponse.json({ error: 'Parameter milestoneId wajib diisi' }, { status: 400 });
    }

    // Check if projectMilestone model exists
    if (!db.projectMilestone) {
      return NextResponse.json({ error: 'Fitur belum tersedia' }, { status: 503 });
    }

    const milestone = await db.projectMilestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone tidak ditemukan' }, { status: 404 });
    }

    // Only allow deletion of PENDING milestones
    if (milestone.status !== 'PENDING') {
      return NextResponse.json({
        error: `Hanya milestone dengan status PENDING yang bisa dihapus. Milestone ini berstatus ${milestone.status}`,
      }, { status: 400 });
    }

    await db.projectMilestone.delete({
      where: { id: milestoneId },
    });

    // Recalculate project progress
    await recalculateProjectProgress(milestone.projectId);

    return NextResponse.json({ success: true, message: 'Milestone berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json({ error: 'Gagal menghapus milestone' }, { status: 500 });
  }
}

// Helper function to recalculate project progress
async function recalculateProjectProgress(projectId: string) {
  try {
    const milestones = await db.projectMilestone.findMany({
      where: { projectId },
    });

    const total = milestones.length;
    if (total === 0) return;

    const completed = milestones.filter(m => m.status === 'COMPLETED').length;

    // Calculate weighted progress
    const rawProgress = milestones.reduce((sum, m) => {
      if (m.status === 'COMPLETED') return sum + 100;
      if (m.status === 'IN_PROGRESS') return sum + 50;
      return sum + 0;
    }, 0);
    const progress = Math.round(rawProgress / total);

    // Auto-update project status based on milestones
    let projectStatus: string | null = null;
    if (progress === 100 && completed === total) {
      projectStatus = 'COMPLETED';
    } else if (progress > 0) {
      projectStatus = 'IN_PROGRESS';
    }

    const updateData: Record<string, unknown> = {};
    if (projectStatus) updateData.status = projectStatus;

    if (Object.keys(updateData).length > 0) {
      await db.project.update({
        where: { id: projectId },
        data: updateData,
      });
    }
  } catch (e) {
    // Log but don't fail the main operation
    console.error('Gagal menghitung ulang progress proyek:', e);
  }
}
