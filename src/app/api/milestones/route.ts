import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get project milestones
export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Check if projectMilestone model exists
    if (!db.projectMilestone) {
      return NextResponse.json({ milestones: [], progress: 0, total: 0, completed: 0 });
    }

    const milestones = await db.projectMilestone.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Calculate progress
    const total = milestones.length;
    const completed = milestones.filter(m => m.status === 'COMPLETED').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate payment stats
    const totalBudget = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
    const totalPaid = milestones.reduce((sum, m) => {
      const paid = m.payments?.filter((p: { status: string }) => p.status === 'CONFIRMED').reduce((s: number, p: { amount: number }) => s + p.amount, 0) || 0;
      return sum + paid;
    }, 0);

    return NextResponse.json({ 
      milestones, 
      progress, 
      total, 
      completed,
      paymentStats: {
        totalBudget,
        totalPaid,
        percentage: totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json({ milestones: [], progress: 0, total: 0, completed: 0 });
  }
}

// POST - Create a milestone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, title, description, dueDate, order } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: 'Project ID and title required' }, { status: 400 });
    }

    // Check if projectMilestone model exists
    if (!db.projectMilestone) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    // Get max order
    const maxOrder = await db.projectMilestone.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const milestone = await db.projectMilestone.create({
      data: {
        projectId,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        order: order ?? (maxOrder?.order ?? 0) + 1
      }
    });

    return NextResponse.json({ success: true, milestone });
  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
  }
}

// PUT - Update milestone status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { milestoneId, status, completedAt } = body;

    if (!milestoneId) {
      return NextResponse.json({ error: 'Milestone ID required' }, { status: 400 });
    }

    // Check if projectMilestone model exists
    if (!db.projectMilestone) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    const updateData: { status: string; completedAt?: Date | null } = { status: status ?? 'IN_PROGRESS' };
    
    if (status === 'COMPLETED') {
      updateData.completedAt = completedAt ? new Date(completedAt) : new Date();
    } else if (status === 'PENDING') {
      updateData.completedAt = null;
    }

    const milestone = await db.projectMilestone.update({
      where: { id: milestoneId },
      data: updateData
    });

    return NextResponse.json({ success: true, milestone });
  } catch (error) {
    console.error('Error updating milestone:', error);
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
  }
}

// DELETE - Delete a milestone
export async function DELETE(request: NextRequest) {
  try {
    const milestoneId = request.nextUrl.searchParams.get('id');

    if (!milestoneId) {
      return NextResponse.json({ error: 'Milestone ID required' }, { status: 400 });
    }

    // Check if projectMilestone model exists
    if (!db.projectMilestone) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    await db.projectMilestone.delete({
      where: { id: milestoneId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
  }
}
