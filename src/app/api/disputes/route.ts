import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List disputes for a project
export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    const status = request.nextUrl.searchParams.get('status');
    const priority = request.nextUrl.searchParams.get('priority');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID diperlukan' },
        { status: 400 }
      );
    }

    // Check if Dispute model exists
    if (!db.dispute) {
      return NextResponse.json({ success: true, disputes: [], total: 0 });
    }

    const where: Record<string, unknown> = { projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const disputes = await db.dispute.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        against: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Count by status
    const allDisputes = await db.dispute.findMany({
      where: { projectId },
      select: { status: true, priority: true },
    });

    const statusCounts = {
      OPEN: allDisputes.filter((d) => d.status === 'OPEN').length,
      UNDER_REVIEW: allDisputes.filter((d) => d.status === 'UNDER_REVIEW')
        .length,
      RESOLVED: allDisputes.filter((d) => d.status === 'RESOLVED').length,
      ESCALATED: allDisputes.filter((d) => d.status === 'ESCALATED').length,
    };

    const priorityCounts = {
      URGENT: allDisputes.filter((d) => d.priority === 'URGENT').length,
      HIGH: allDisputes.filter((d) => d.priority === 'HIGH').length,
      MEDIUM: allDisputes.filter((d) => d.priority === 'MEDIUM').length,
      LOW: allDisputes.filter((d) => d.priority === 'LOW').length,
    };

    return NextResponse.json({
      success: true,
      disputes,
      total: disputes.length,
      statusCounts,
      priorityCounts,
    });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar sengketa' },
      { status: 500 }
    );
  }
}

// POST - Create a dispute
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, type, description, priority, againstUserId, attachments } = body;

    if (!projectId || !type || !description) {
      return NextResponse.json(
        { success: false, error: 'Project ID, jenis sengketa, dan deskripsi diperlukan' },
        { status: 400 }
      );
    }

    if (!db.dispute) {
      return NextResponse.json(
        { success: false, error: 'Fitur sengketa belum tersedia' },
        { status: 503 }
      );
    }

    const validTypes = ['PAYMENT', 'QUALITY', 'DELAY', 'SCOPE', 'OTHER'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Jenis sengketa tidak valid. Pilihan: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const disputePriority = priority || 'MEDIUM';
    if (!validPriorities.includes(disputePriority)) {
      return NextResponse.json(
        { success: false, error: `Prioritas tidak valid. Pilihan: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    // Check project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Proyek tidak ditemukan' },
        { status: 404 }
      );
    }

    // If againstUserId provided, check user exists
    if (againstUserId) {
      const againstUser = await db.user.findUnique({
        where: { id: againstUserId },
      });

      if (!againstUser) {
        return NextResponse.json(
          { success: false, error: 'Pengguna terlapor tidak ditemukan' },
          { status: 404 }
        );
      }
    }

    const dispute = await db.dispute.create({
      data: {
        projectId,
        reportedBy: body.reportedById || project.ownerId,
        againstUser: againstUserId || null,
        type,
        description,
        priority: disputePriority,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        against: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sengketa berhasil dilaporkan',
      dispute,
    });
  } catch (error) {
    console.error('Error creating dispute:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal melaporkan sengketa' },
      { status: 500 }
    );
  }
}

// PUT - Update dispute status and resolution
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { disputeId, status, resolution, resolvedBy } = body;

    if (!disputeId) {
      return NextResponse.json(
        { success: false, error: 'Dispute ID diperlukan' },
        { status: 400 }
      );
    }

    if (!db.dispute) {
      return NextResponse.json(
        { success: false, error: 'Fitur sengketa belum tersedia' },
        { status: 503 }
      );
    }

    // Check dispute exists
    const existingDispute = await db.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!existingDispute) {
      return NextResponse.json(
        { success: false, error: 'Sengketa tidak ditemukan' },
        { status: 404 }
      );
    }

    const validStatuses = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'ESCALATED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Status tidak valid. Pilihan: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;

    if (status === 'RESOLVED') {
      if (!resolution) {
        return NextResponse.json(
          { success: false, error: 'Resolusi diperlukan untuk menyelesaikan sengketa' },
          { status: 400 }
        );
      }
      updateData.resolution = resolution;
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = resolvedBy || null;
    } else if (resolution) {
      updateData.resolution = resolution;
    }

    const dispute = await db.dispute.update({
      where: { id: disputeId },
      data: updateData,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        against: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message:
        status === 'RESOLVED'
          ? 'Sengketa berhasil diselesaikan'
          : 'Status sengketa berhasil diperbarui',
      dispute,
    });
  } catch (error) {
    console.error('Error updating dispute:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui sengketa' },
      { status: 500 }
    );
  }
}
