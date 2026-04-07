import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/milestones/[id] - Update milestone (title, description, status, dueDate, percentage)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Milestone ID required' }, { status: 400 });
    }

    if (!db.projectMilestone) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    const body = await request.json();
    const { title, description, status, dueDate, percentage } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      } else if (status === 'PENDING') {
        updateData.completedAt = null;
      }
    }

    // For percentage, we store it as part of description or a note
    // Since the schema doesn't have a percentage field directly,
    // we can store it in the description or handle it as metadata
    // For now, we'll update what we can

    const milestone = await db.projectMilestone.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, milestone });
  } catch (error) {
    console.error('Error updating milestone:', error);
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
  }
}

// DELETE /api/milestones/[id] - Delete milestone (only if PENDING status)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Milestone ID required' }, { status: 400 });
    }

    if (!db.projectMilestone) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    // Check milestone status
    const milestone = await db.projectMilestone.findUnique({
      where: { id },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    if (milestone.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Hanya milestone dengan status Menunggu yang dapat dihapus' },
        { status: 400 }
      );
    }

    await db.projectMilestone.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Milestone berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
  }
}
