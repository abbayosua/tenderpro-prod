import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const dashboardParamsSchema = z.object({
  userId: z.string().min(1, 'User ID wajib diisi'),
});

// ─── Category mapping ─────────────────────────────────────────────────────────

// Map notification types to logical categories for the dashboard widget
const CATEGORY_MAP: Record<string, string> = {
  BID_RECEIVED: 'bid',
  BID_ACCEPTED: 'bid',
  BID_REJECTED: 'bid',
  PROJECT_UPDATE: 'proyek',
  MILESTONE_UPDATE: 'proyek',
  MILESTONE_COMPLETED: 'proyek',
  PAYMENT: 'pembayaran',
  PAYMENT_MADE: 'pembayaran',
  PAYMENT_CONFIRMED: 'pembayaran',
  MESSAGE: 'pesan',
  SYSTEM: 'sistem',
  VERIFICATION: 'sistem',
  USER_JOINED: 'sistem',
  DOCUMENT: 'proyek',
  GENERAL: 'sistem',
};

// ─── GET — Dashboard notification summary ─────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    // Validate
    const parsed = dashboardParamsSchema.safeParse({ userId });
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 },
      );
    }

    // Check if notification model exists
    if (!db.notification) {
      return NextResponse.json({
        success: true,
        data: {
          unreadCount: 0,
          totalCount: 0,
          latestNotifications: [],
          categories: [
            { key: 'semua', label: 'Semua', count: 0, icon: 'Bell' },
            { key: 'proyek', label: 'Proyek', count: 0, icon: 'FileText' },
            { key: 'bid', label: 'Bid', count: 0, icon: 'Send' },
            { key: 'pembayaran', label: 'Pembayaran', count: 0, icon: 'DollarSign' },
          ],
          quickActions: [],
        },
      });
    }

    // Fetch all notifications for this user (latest 50 to compute categories)
    const allNotifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadNotifications = allNotifications.filter((n) => !n.isRead);
    const latest5 = allNotifications.slice(0, 5);

    // ── Category counts ─────────────────────────────────────────────────────
    const categoryCounts: Record<string, number> = {
      semua: allNotifications.length,
      proyek: 0,
      bid: 0,
      pembayaran: 0,
    };

    for (const notif of allNotifications) {
      const cat = CATEGORY_MAP[notif.type] || 'sistem';
      if (cat in categoryCounts) {
        categoryCounts[cat]++;
      }
    }

    // Unread counts per category
    const unreadByCategory: Record<string, number> = {
      semua: unreadNotifications.length,
      proyek: 0,
      bid: 0,
      pembayaran: 0,
    };

    for (const notif of unreadNotifications) {
      const cat = CATEGORY_MAP[notif.type] || 'sistem';
      if (cat in unreadByCategory) {
        unreadByCategory[cat]++;
      }
    }

    // ── Enrich latest 5 notifications ───────────────────────────────────────
    const enrichedLatest = await Promise.all(
      latest5.map(async (notif) => {
        let projectTitle: string | null = null;
        let contractorName: string | null = null;
        let quickAction: { label: string; href: string } | null = null;

        if (notif.relatedId) {
          try {
            const project = await db.project.findUnique({
              where: { id: notif.relatedId },
              select: { title: true },
            });
            if (project) projectTitle = project.title;
          } catch {
            // Try bid
            try {
              const bid = await db.bid.findUnique({
                where: { id: notif.relatedId },
                include: {
                  project: { select: { title: true } },
                  contractor: { select: { name: true } },
                },
              });
              if (bid) {
                projectTitle = bid.project.title;
                contractorName = bid.contractor.name;
              }
            } catch {
              // skip
            }
          }
        }

        // Build quick action based on type
        switch (notif.type) {
          case 'BID_RECEIVED':
            quickAction = { label: 'Lihat Bid', href: `/projects/${notif.relatedId || ''}` };
            break;
          case 'BID_ACCEPTED':
            quickAction = { label: 'Lihat Proyek', href: `/projects/${notif.relatedId || ''}` };
            break;
          case 'PROJECT_UPDATE':
          case 'MILESTONE_COMPLETED':
            quickAction = { label: 'Detail Proyek', href: `/projects/${notif.relatedId || ''}` };
            break;
          case 'PAYMENT_MADE':
          case 'PAYMENT_CONFIRMED':
            quickAction = { label: 'Lihat Pembayaran', href: `/projects/${notif.relatedId || ''}` };
            break;
          case 'VERIFICATION':
            quickAction = { label: 'Verifikasi', href: '/settings' };
            break;
        }

        return {
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          relatedId: notif.relatedId,
          isRead: notif.isRead,
          createdAt: notif.createdAt,
          category: CATEGORY_MAP[notif.type] || 'sistem',
          projectTitle,
          contractorName,
          quickAction,
        };
      }),
    );

    // ── Build categories array ──────────────────────────────────────────────
    const categories = [
      {
        key: 'semua',
        label: 'Semua',
        count: categoryCounts.semua,
        unreadCount: unreadByCategory.semua,
        icon: 'Bell',
      },
      {
        key: 'proyek',
        label: 'Proyek',
        count: categoryCounts.proyek,
        unreadCount: unreadByCategory.proyek,
        icon: 'FileText',
      },
      {
        key: 'bid',
        label: 'Bid',
        count: categoryCounts.bid,
        unreadCount: unreadByCategory.bid,
        icon: 'Send',
      },
      {
        key: 'pembayaran',
        label: 'Pembayaran',
        count: categoryCounts.pembayaran,
        unreadCount: unreadByCategory.pembayaran,
        icon: 'DollarSign',
      },
    ];

    // ── Quick actions (top-level) ───────────────────────────────────────────
    const quickActions: Array<{ label: string; href: string; type: string }> = [];

    if (unreadByCategory.bid > 0) {
      quickActions.push({
        label: `${unreadByCategory.bid} bid baru`,
        href: '/dashboard?tab=bids',
        type: 'bid',
      });
    }

    if (unreadByCategory.proyek > 0) {
      quickActions.push({
        label: `${unreadByCategory.proyek} update proyek`,
        href: '/dashboard?tab=projects',
        type: 'proyek',
      });
    }

    if (unreadByCategory.pembayaran > 0) {
      quickActions.push({
        label: `${unreadByCategory.pembayaran} pembayaran`,
        href: '/dashboard?tab=payments',
        type: 'pembayaran',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        unreadCount: unreadNotifications.length,
        totalCount: allNotifications.length,
        latestNotifications: enrichedLatest,
        categories,
        quickActions,
      },
    });
  } catch (error) {
    console.error('Dashboard notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat ringkasan notifikasi' },
      { status: 500 },
    );
  }
}
