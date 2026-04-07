import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get user's notifications with enhanced features
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const unreadOnly = request.nextUrl.searchParams.get('unreadOnly') === 'true';
    
    // Type filtering support
    const typeParams = request.nextUrl.searchParams.getAll('type');
    const skip = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if notification model exists
    if (!db.notification) {
      return NextResponse.json({ notifications: [], unreadCount: 0, pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    const where: Record<string, unknown> = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }
    if (typeParams.length > 0) {
      where.type = { in: typeParams };
    }

    const [notifications, unreadCount, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.notification.count({
        where: { userId, isRead: false },
      }),
      db.notification.count({ where }),
    ]);

    // Enrich notifications with related entity data
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        let projectTitle: string | null = null;
        let contractorName: string | null = null;
        let projectName: string | null = null;

        // Enrich based on notification type and relatedId
        if (notification.relatedId) {
          if (notification.type === 'BID_RECEIVED' || notification.type === 'BID_ACCEPTED' || notification.type === 'BID_REJECTED') {
            // relatedId could be a bid ID or project ID
            try {
              const project = await db.project.findUnique({
                where: { id: notification.relatedId },
                select: { title: true },
              });
              if (project) projectTitle = project.title;
            } catch {
              // Try as bid ID
              try {
                const bid = await db.bid.findUnique({
                  where: { id: notification.relatedId },
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
                // Not a bid either, skip enrichment
              }
            }
          } else if (notification.type === 'PROJECT_UPDATE' || notification.type === 'MILESTONE_COMPLETED') {
            try {
              const project = await db.project.findUnique({
                where: { id: notification.relatedId },
                select: { title: true },
              });
              if (project) projectTitle = project.title;
            } catch {
              // Skip
            }
          } else if (notification.type === 'PAYMENT_MADE' || notification.type === 'PAYMENT_CONFIRMED') {
            try {
              const project = await db.project.findUnique({
                where: { id: notification.relatedId },
                select: { title: true },
              });
              if (project) projectTitle = project.title;
            } catch {
              // Skip
            }
          }
        }

        return {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          relatedId: notification.relatedId,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          // Enriched data
          projectTitle,
          contractorName,
        };
      })
    );

    return NextResponse.json({
      notifications: enrichedNotifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ notifications: [], unreadCount: 0, pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  }
}

// POST - Create a notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, message, type, relatedId } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'User ID, title, and message required' }, { status: 400 });
    }

    // Check if notification model exists
    if (!db.notification) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || 'GENERAL',
        relatedId,
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

// PUT - Mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, markAllRead, userId } = body;

    // Check if notification model exists
    if (!db.notification) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    if (markAllRead && userId) {
      const result = await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({
        success: true,
        message: `${result.count} notifikasi ditandai sebagai dibaca`,
      });
    }

    if (notificationId) {
      // Mark individual notification as read
      await db.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Notification ID or markAllRead required' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// DELETE - Delete notification(s)
export async function DELETE(request: NextRequest) {
  try {
    const notificationId = request.nextUrl.searchParams.get('id');
    const userId = request.nextUrl.searchParams.get('userId');

    // Check if notification model exists
    if (!db.notification) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    if (notificationId) {
      await db.notification.delete({
        where: { id: notificationId },
      });
    } else if (userId) {
      await db.notification.deleteMany({
        where: { userId },
      });
    } else {
      return NextResponse.json({ error: 'Notification ID or User ID required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
