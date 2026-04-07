import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ProjectStatus } from '@prisma/client';

// PUT - Change project status with validation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, reason, userId } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status baru diperlukan' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID diperlukan untuk mencatat perubahan' },
        { status: 400 }
      );
    }

    // Validate status is a valid ProjectStatus enum value
    const validStatuses: string[] = ['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Status tidak valid: ${status}. Status yang tersedia: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch project with owner info and milestones
    const project = await db.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        bids: {
          where: { status: 'ACCEPTED' },
          include: {
            contractor: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        milestones: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Proyek tidak ditemukan' },
        { status: 404 }
      );
    }

    const currentStatus = project.status as string;
    const newStatus = status as string;

    // Validate status transitions
    const statusLabels: Record<string, string> = {
      DRAFT: 'Draf',
      OPEN: 'Terbuka',
      IN_PROGRESS: 'Berjalan',
      COMPLETED: 'Selesai',
      CANCELLED: 'Dibatalkan',
    };

    // DRAFT → DRAFT (save draft) - always allowed
    if (currentStatus === 'DRAFT' && newStatus === 'DRAFT') {
      // Allow, just update the project
    }
    // DRAFT → OPEN - requires title, description, budget, category, location
    else if (currentStatus === 'DRAFT' && newStatus === 'OPEN') {
      if (!project.title || project.title.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Judul proyek wajib diisi sebelum mempublish' },
          { status: 400 }
        );
      }
      if (!project.description || project.description.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Deskripsi proyek wajib diisi sebelum mempublish' },
          { status: 400 }
        );
      }
      if (!project.budget || project.budget <= 0) {
        return NextResponse.json(
          { success: false, error: 'Anggaran proyek wajib diisi sebelum mempublish' },
          { status: 400 }
        );
      }
      if (!project.category || project.category.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Kategori proyek wajib diisi sebelum mempublish' },
          { status: 400 }
        );
      }
      if (!project.location || project.location.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Lokasi proyek wajib diisi sebelum mempublish' },
          { status: 400 }
        );
      }
    }
    // OPEN → IN_PROGRESS - requires accepted bid
    else if (currentStatus === 'OPEN' && newStatus === 'IN_PROGRESS') {
      if (project.bids.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Proyek harus memiliki penawaran yang diterima sebelum dimulai' },
          { status: 400 }
        );
      }
    }
    // IN_PROGRESS → COMPLETED - requires all milestones completed
    else if (currentStatus === 'IN_PROGRESS' && newStatus === 'COMPLETED') {
      if (project.milestones.length > 0) {
        const allCompleted = project.milestones.every(
          (m) => m.status === 'COMPLETED'
        );
        if (!allCompleted) {
          const incompleteMilestones = project.milestones
            .filter((m) => m.status !== 'COMPLETED')
            .map((m) => m.title);
          return NextResponse.json(
            {
              success: false,
              error: `Semua milestone harus selesai terlebih dahulu. Milestone yang belum selesai: ${incompleteMilestones.join(', ')}`,
            },
            { status: 400 }
          );
        }
      }
    }
    // Any → CANCELLED - requires reason
    else if (newStatus === 'CANCELLED') {
      if (!reason || reason.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Alasan pembatalan wajib diisi' },
          { status: 400 }
        );
      }
    }
    // Invalid transitions
    else if (
      !(
        (currentStatus === 'DRAFT' && newStatus === 'OPEN') ||
        (currentStatus === 'DRAFT' && newStatus === 'DRAFT') ||
        (currentStatus === 'OPEN' && newStatus === 'IN_PROGRESS') ||
        (currentStatus === 'IN_PROGRESS' && newStatus === 'COMPLETED') ||
        newStatus === 'CANCELLED'
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Transisi status tidak valid: ${statusLabels[currentStatus] || currentStatus} → ${statusLabels[newStatus] || newStatus}`,
        },
        { status: 400 }
      );
    }

    // Update project status
    const updatedProject = await db.project.update({
      where: { id },
      data: {
        status: newStatus as ProjectStatus,
        // Set endDate for completed projects
        ...(newStatus === 'COMPLETED' ? { endDate: new Date() } : {}),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create activity log
    const transitionDescription = `Status proyek "${project.title}" diubah dari ${statusLabels[currentStatus] || currentStatus} menjadi ${statusLabels[newStatus] || newStatus}`;

    try {
      if (db.activityLog) {
        await db.activityLog.create({
          data: {
            projectId: id,
            userId,
            action: 'STATUS_CHANGED',
            description: transitionDescription + (reason ? `. Alasan: ${reason}` : ''),
            metadata: JSON.stringify({
              previousStatus: currentStatus,
              newStatus: newStatus,
              reason: reason || null,
              projectName: project.title,
            }),
          },
        });
      }
    } catch {
      // Activity log is non-critical
    }

    // Send notifications to relevant parties
    const notifications: Array<{ userId: string; title: string; message: string; type: string }> = [];

    // Notify owner
    notifications.push({
      userId: project.owner.id,
      title: `Status Proyek Diperbarui`,
      message: `Proyek "${project.title}" statusnya berubah dari ${statusLabels[currentStatus] || currentStatus} menjadi ${statusLabels[newStatus] || newStatus}`,
      type: 'PROJECT_UPDATE',
    });

    // Notify accepted contractor if applicable
    if (project.bids.length > 0) {
      project.bids.forEach((bid) => {
        notifications.push({
          userId: bid.contractor.id,
          title: `Status Proyek Diperbarui`,
          message: `Proyek "${project.title}" statusnya berubah menjadi ${statusLabels[newStatus] || newStatus}`,
          type: 'PROJECT_UPDATE',
        });
      });
    }

    // Create notifications
    try {
      if (db.notification) {
        await db.notification.createMany({
          data: notifications,
        });
      }
    } catch {
      // Notification creation is non-critical
    }

    return NextResponse.json({
      success: true,
      message: transitionDescription,
      data: {
        id: updatedProject.id,
        title: updatedProject.title,
        status: updatedProject.status,
        previousStatus: currentStatus,
        endDate: updatedProject.endDate,
        updatedAt: updatedProject.updatedAt,
        owner: updatedProject.owner,
      },
    });
  } catch (error) {
    console.error('Gagal mengubah status proyek:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengubah status proyek' },
      { status: 500 }
    );
  }
}
