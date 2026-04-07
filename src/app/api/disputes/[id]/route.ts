import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get dispute details by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
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

    const dispute = await db.dispute.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            contractor: {
              select: { companyName: true },
            },
          },
        },
        against: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            contractor: {
              select: { companyName: true },
            },
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            budget: true,
            category: true,
            owner: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { success: false, error: 'Sengketa tidak ditemukan' },
        { status: 404 }
      );
    }

    // Fetch related activity logs as timeline events
    const activityLogs = await db.activityLog.findMany({
      where: {
        projectId: dispute.projectId,
        action: { contains: 'DISPUTE' },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    // Build timeline from activity logs + dispute events
    const timeline = [
      {
        id: 'created',
        type: 'CREATED',
        description: 'Sengketa dilaporkan',
        user: dispute.reporter,
        timestamp: dispute.createdAt,
      },
    ];

    // Add status change events
    if (dispute.status === 'UNDER_REVIEW') {
      timeline.push({
        id: 'review',
        type: 'STATUS_CHANGE',
        description: 'Status berubah ke Dalam Tinjauan',
        timestamp: dispute.updatedAt,
      });
    }
    if (dispute.status === 'ESCALATED') {
      timeline.push({
        id: 'escalated',
        type: 'STATUS_CHANGE',
        description: 'Sengketa dieskalasi ke Admin',
        timestamp: dispute.updatedAt,
      });
    }
    if (dispute.status === 'RESOLVED') {
      timeline.push({
        id: 'resolved',
        type: 'RESOLVED',
        description: 'Sengketa diselesaikan',
        resolution: dispute.resolution,
        resolvedBy: dispute.resolvedBy,
        timestamp: dispute.resolvedAt || dispute.updatedAt,
      });
    }

    // Add activity log events
    for (const log of activityLogs) {
      timeline.push({
        id: log.id,
        type: 'ACTIVITY',
        description: log.description,
        timestamp: log.createdAt,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      });
    }

    // Sort timeline by timestamp
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Parse attachments
    const attachments = dispute.attachments ? JSON.parse(dispute.attachments) : [];

    return NextResponse.json({
      success: true,
      dispute: {
        ...dispute,
        attachments,
        timeline,
        statusHistory: {
          OPEN: dispute.status === 'OPEN' || ['UNDER_REVIEW', 'ESCALATED', 'RESOLVED'].includes(dispute.status),
          UNDER_REVIEW: ['UNDER_REVIEW', 'ESCALATED', 'RESOLVED'].includes(dispute.status),
          ESCALATED: ['ESCALATED'].includes(dispute.status),
          RESOLVED: dispute.status === 'RESOLVED',
        },
      },
    });
  } catch (error) {
    console.error('Error fetching dispute details:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat detail sengketa' },
      { status: 500 }
    );
  }
}

// PUT - Update dispute status and resolution notes
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, resolution, resolvedBy } = body;

    if (!id) {
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
      where: { id },
      include: {
        project: {
          select: { id: true, title: true },
        },
      },
    });

    if (!existingDispute) {
      return NextResponse.json(
        { success: false, error: 'Sengketa tidak ditemukan' },
        { status: 404 }
      );
    }

    // Valid status transitions
    const validTransitions: Record<string, string[]> = {
      OPEN: ['IN_PROGRESS', 'UNDER_REVIEW', 'ESCALATED', 'RESOLVED', 'CLOSED'],
      IN_PROGRESS: ['UNDER_REVIEW', 'RESOLVED', 'CLOSED'],
      UNDER_REVIEW: ['IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED'],
      ESCALATED: ['UNDER_REVIEW', 'RESOLVED', 'CLOSED'],
      RESOLVED: ['CLOSED'],
    };

    if (status) {
      const currentStatus = existingDispute.status;
      const allowedTransitions = validTransitions[currentStatus] || [];
      if (!allowedTransitions.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Transisi status tidak valid dari ${currentStatus} ke ${status}. Pilihan: ${allowedTransitions.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;

    if (resolution) {
      updateData.resolution = resolution;
    }

    if (status === 'RESOLVED' || status === 'CLOSED') {
      if (!resolution) {
        return NextResponse.json(
          { success: false, error: 'Catatan resolusi diperlukan untuk menyelesaikan sengketa' },
          { status: 400 }
        );
      }
      updateData.resolution = resolution;
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = resolvedBy || null;
    }

    // Update dispute
    const dispute = await db.dispute.update({
      where: { id },
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

    // Log activity
    try {
      await db.activityLog.create({
        data: {
          projectId: existingDispute.project.id,
          userId: resolvedBy || existingDispute.reportedBy,
          action: 'DISPUTE_STATUS_CHANGE',
          description: `Status sengketa "${existingDispute.project.title}" berubah dari ${existingDispute.status} ke ${status || existingDispute.status}${resolution ? `. Resolusi: ${resolution}` : ''}`,
          metadata: JSON.stringify({
            disputeId: id,
            oldStatus: existingDispute.status,
            newStatus: status || existingDispute.status,
            resolution: resolution || null,
          }),
        },
      });
    } catch {
      // Activity log is non-critical, continue
    }

    const statusMessages: Record<string, string> = {
      IN_PROGRESS: 'Sengketa sedang diproses',
      UNDER_REVIEW: 'Sengketa dalam tinjauan',
      ESCALATED: 'Sengketa telah dieskalasi ke Admin',
      RESOLVED: 'Sengketa berhasil diselesaikan',
      CLOSED: 'Sengketa telah ditutup',
    };

    return NextResponse.json({
      success: true,
      message: status ? statusMessages[status] || 'Status berhasil diperbarui' : 'Catatan berhasil ditambahkan',
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
