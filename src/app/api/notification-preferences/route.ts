import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  bidAlerts: boolean;
  projectUpdates: boolean;
  paymentAlerts: boolean;
  chatMessages: boolean;
  marketingEmails: boolean;
}

// In-memory store for notification preferences (since we don't add a new model)
const preferencesStore = new Map<string, NotificationPreferences>();

const DEFAULT_PREFERENCES: NotificationPreferences = {
  userId: '',
  emailNotifications: true,
  pushNotifications: true,
  bidAlerts: true,
  projectUpdates: true,
  paymentAlerts: true,
  chatMessages: true,
  marketingEmails: false,
};

// GET - Get user's notification preferences
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    const preferences = preferencesStore.get(userId) || {
      ...DEFAULT_PREFERENCES,
      userId,
    };

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat preferensi notifikasi' },
      { status: 500 }
    );
  }
}

// PUT - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      emailNotifications,
      pushNotifications,
      bidAlerts,
      projectUpdates,
      paymentAlerts,
      chatMessages,
      marketingEmails,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    const existing = preferencesStore.get(userId) || {
      ...DEFAULT_PREFERENCES,
      userId,
    };

    const preferences: NotificationPreferences = {
      userId,
      emailNotifications: emailNotifications ?? existing.emailNotifications,
      pushNotifications: pushNotifications ?? existing.pushNotifications,
      bidAlerts: bidAlerts ?? existing.bidAlerts,
      projectUpdates: projectUpdates ?? existing.projectUpdates,
      paymentAlerts: paymentAlerts ?? existing.paymentAlerts,
      chatMessages: chatMessages ?? existing.chatMessages,
      marketingEmails: marketingEmails ?? existing.marketingEmails,
    };

    preferencesStore.set(userId, preferences);

    return NextResponse.json({
      success: true,
      message: 'Preferensi notifikasi berhasil diperbarui',
      preferences,
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui preferensi notifikasi' },
      { status: 500 }
    );
  }
}
