import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID proyek wajib diisi' },
        { status: 400 }
      );
    }

    // Fetch milestones for the project
    const milestones = await db.projectMilestone.findMany({
      where: { projectId: id },
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        dueDate: true,
        completedAt: true,
        amount: true,
        order: true,
      },
    });

    // Calculate overall progress
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(
      (m) => m.status === 'COMPLETED'
    ).length;
    const inProgressMilestones = milestones.filter(
      (m) => m.status === 'IN_PROGRESS'
    ).length;
    const progress = totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        milestones,
        progress,
        totalMilestones,
        completedMilestones,
        inProgressMilestones,
        pendingMilestones: totalMilestones - completedMilestones - inProgressMilestones,
      },
    });
  } catch (error) {
    console.error('Error fetching project timeline:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat timeline proyek' },
      { status: 500 }
    );
  }
}
