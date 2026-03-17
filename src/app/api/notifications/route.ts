import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const unreadOnly = request.nextUrl.searchParams.get('unreadOnly') === 'true';
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if notification model exists
    if (!db.notification) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const where: { userId: string; isRead?: boolean } = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      db.notification.count({
        where: { userId, isRead: false }
      })
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
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
        relatedId
      }
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

// PUT - Mark notification as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, markAllRead, userId } = body;

    // Check if notification model exists
    if (!db.notification) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    if (markAllRead && userId) {
      await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// DELETE - Delete a notification
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
        where: { id: notificationId }
      });
    } else if (userId) {
      // Delete all notifications for user
      await db.notification.deleteMany({
        where: { userId }
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
