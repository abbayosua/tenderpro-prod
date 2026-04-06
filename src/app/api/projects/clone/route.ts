import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, ownerId } = body;

    if (!projectId || !ownerId) {
      return NextResponse.json(
        { success: false, error: 'projectId dan ownerId wajib diisi' },
        { status: 400 }
      );
    }

    // Find the original project
    const originalProject = await db.project.findUnique({
      where: { id: projectId },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!originalProject) {
      return NextResponse.json(
        { success: false, error: 'Proyek asli tidak ditemukan' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (originalProject.ownerId !== ownerId) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki akses ke proyek ini' },
        { status: 403 }
      );
    }

    // Create cloned project with modified data
    const clonedProject = await db.project.create({
      data: {
        ownerId,
        title: `${originalProject.title} (Salinan)`,
        description: originalProject.description,
        category: originalProject.category,
        location: originalProject.location,
        budget: originalProject.budget,
        duration: originalProject.duration,
        requirements: originalProject.requirements,
        status: 'DRAFT',
        // New milestones (without payments or completion status)
        milestones: {
          create: originalProject.milestones.map((ms) => ({
            title: ms.title,
            description: ms.description,
            amount: ms.amount,
            dueDate: ms.dueDate,
            status: 'PENDING',
            order: ms.order,
            completedAt: null,
          })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      projectId: clonedProject.id,
      message: 'Proyek berhasil diduplikasi sebagai draf',
    });
  } catch (error) {
    console.error('Gagal mengkloning proyek:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengkloning proyek' },
      { status: 500 }
    );
  }
}
