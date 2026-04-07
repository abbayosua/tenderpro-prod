import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface TimelineItem {
  type: 'milestone' | 'payment' | 'activity';
  id: string;
  title: string;
  description: string;
  date: string;
  status: string;
  metadata: Record<string, unknown>;
}

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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id },
      select: { id: true, ownerId: true, status: true, title: true },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Proyek tidak ditemukan' },
        { status: 404 }
      );
    }

    // Fetch all timeline data in parallel
    const [milestones, payments, activities] = await Promise.all([
      // Milestones
      db.projectMilestone.findMany({
        where: { projectId: id },
        orderBy: [{ order: 'asc' }, { dueDate: 'asc' }],
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          dueDate: true,
          completedAt: true,
          amount: true,
          order: true,
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              paidAt: true,
              method: true,
            },
          },
        },
      }),

      // Payments (flattened from milestones)
      db.projectMilestone.findMany({
        where: { projectId: id },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),

      // Activity logs
      db.activityLog
        ? db.activityLog.findMany({
            where: { projectId: id },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  isVerified: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 50, // Pre-fetch more, paginate after merge
          })
        : Promise.resolve([]),
    ]);

    // Build unified timeline items
    const timelineItems: TimelineItem[] = [];

    // Add milestones
    for (const m of milestones) {
      // Milestone creation/completion events
      const milestoneDate = m.completedAt || m.dueDate || new Date().toISOString();
      timelineItems.push({
        type: 'milestone',
        id: `milestone-${m.id}`,
        title: m.title,
        description: m.description || `Milestone #${m.order + 1}`,
        date: milestoneDate,
        status: m.status,
        metadata: {
          milestoneId: m.id,
          amount: m.amount,
          order: m.order,
          dueDate: m.dueDate,
          completedAt: m.completedAt,
          payments: m.payments,
        },
      });
    }

    // Add payments (as separate timeline entries)
    for (const milestoneData of payments) {
      const milestonePayments = (milestoneData.payments || []) as Array<{
        id: string;
        amount: number;
        status: string;
        paidAt: Date | null;
        method: string;
        createdAt: Date;
        milestoneId: string;
      }>;

      for (const p of milestonePayments) {
        const paymentDate = p.paidAt || p.createdAt;
        timelineItems.push({
          type: 'payment',
          id: `payment-${p.id}`,
          title: `Pembayaran: ${milestoneData.title}`,
          description: `Pembayaran sebesar ${formatRupiahAmount(p.amount)} via ${formatPaymentMethod(p.method)}`,
          date: paymentDate,
          status: p.status,
          metadata: {
            paymentId: p.id,
            milestoneId: milestoneData.id,
            milestoneTitle: milestoneData.title,
            amount: p.amount,
            method: p.method,
            paidAt: p.paidAt,
          },
        });
      }
    }

    // Add activity logs
    for (const a of activities as Array<{
      id: string;
      action: string;
      description: string;
      metadata: string | null;
      createdAt: Date;
      user: { id: string; name: string; avatar: string | null; isVerified: boolean } | null;
    }>) {
      timelineItems.push({
        type: 'activity',
        id: `activity-${a.id}`,
        title: formatActivityTitle(a.action),
        description: a.description,
        date: a.createdAt,
        status: 'LOGGED',
        metadata: {
          activityId: a.id,
          action: a.action,
          user: a.user ? {
            id: a.user.id,
            name: a.user.name,
            avatar: a.user.avatar,
            isVerified: a.user.isVerified,
          } : null,
          extraData: a.metadata ? JSON.parse(a.metadata) : null,
        },
      });
    }

    // Sort all items chronologically (newest first)
    timelineItems.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // Calculate total for pagination
    const total = timelineItems.length;
    const totalPages = Math.ceil(total / limit);

    // Apply pagination
    const paginatedItems = timelineItems.slice(skip, skip + limit);

    // Calculate overall project progress
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(
      (m) => m.status === 'COMPLETED'
    ).length;
    const inProgressMilestones = milestones.filter(
      (m) => m.status === 'IN_PROGRESS'
    ).length;
    const progress =
      totalMilestones > 0
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0;

    // Calculate payment summary
    const allPayments = payments.flatMap(
      (m) => (m.payments || []) as Array<{ amount: number; status: string }>
    );
    const totalPaymentAmount = allPayments.reduce(
      (sum, p) => sum + (p.status === 'CONFIRMED' ? p.amount : 0),
      0
    );
    const totalMilestoneBudget = milestones.reduce(
      (sum, m) => sum + (m.amount || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        items: paginatedItems,
        progress,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        summary: {
          totalMilestones,
          completedMilestones,
          inProgressMilestones,
          pendingMilestones:
            totalMilestones - completedMilestones - inProgressMilestones,
          totalPayments: allPayments.length,
          confirmedPayments: allPayments.filter(
            (p) => p.status === 'CONFIRMED'
          ).length,
          totalPaymentAmount,
          totalMilestoneBudget,
        },
        project: {
          id: project.id,
          title: project.title,
          status: project.status,
          ownerId: project.ownerId,
          isOwner: userId ? project.ownerId === userId : false,
        },
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

// Helper functions
function formatRupiahAmount(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    BANK_TRANSFER: 'Transfer Bank',
    CASH: 'Tunai',
    E_WALLET: 'E-Wallet',
    CHECK: 'Cek',
  };
  return methods[method] || method;
}

function formatActivityTitle(action: string): string {
  const titles: Record<string, string> = {
    BID_SUBMITTED: 'Penawaran Dikirim',
    BID_ACCEPTED: 'Penawaran Diterima',
    BID_REJECTED: 'Penawaran Ditolak',
    MILESTONE_CREATED: 'Milestone Dibuat',
    MILESTONE_UPDATED: 'Milestone Diperbarui',
    MILESTONE_COMPLETED: 'Milestone Selesai',
    PAYMENT_MADE: 'Pembayaran Dilakukan',
    PAYMENT_CONFIRMED: 'Pembayaran Dikonfirmasi',
    DOCUMENT_UPLOADED: 'Dokumen Diunggah',
    PROJECT_CREATED: 'Proyek Dibuat',
    PROJECT_UPDATED: 'Proyek Diperbarui',
    PROJECT_STARTED: 'Proyek Dimulai',
    PROJECT_COMPLETED: 'Proyek Selesai',
    PROJECT_CANCELLED: 'Proyek Dibatalkan',
    MEMBER_ADDED: 'Anggota Ditambahkan',
    MEMBER_REMOVED: 'Anggota Dihapus',
    DISPUTE_CREATED: 'Sengketa Dibuat',
    DISPUTE_RESOLVED: 'Sengketa Diselesaikan',
    COMMENT_ADDED: 'Komentar Ditambahkan',
    STATUS_CHANGED: 'Status Diubah',
  };
  return titles[action] || action.replace(/_/g, ' ');
}
