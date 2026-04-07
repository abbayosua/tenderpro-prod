import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Send batch notifications to multiple users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIds, title, message, type, relatedId } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Daftar user ID diperlukan' },
        { status: 400 }
      );
    }

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Judul dan pesan notifikasi diperlukan' },
        { status: 400 }
      );
    }

    if (userIds.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Maksimal 500 penerima per pengiriman batch' },
        { status: 400 }
      );
    }

    // Check if notification model exists
    if (!db.notification) {
      return NextResponse.json(
        { success: false, error: 'Fitur notifikasi belum tersedia' },
        { status: 503 }
      );
    }

    // Validate that users exist
    const existingUsers = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    });

    const validUserIds = existingUsers.map((u) => u.id);

    if (validUserIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada pengguna valid yang ditemukan' },
        { status: 404 }
      );
    }

    // Create notifications in batch using createMany
    const notificationsData = validUserIds.map((userId) => ({
      userId,
      title,
      message,
      type: type || 'BATCH',
      relatedId,
    }));

    const result = await db.notification.createMany({
      data: notificationsData,
    });

    return NextResponse.json({
      success: true,
      message: `Notifikasi berhasil dikirim ke ${result.count} pengguna`,
      sentCount: result.count,
      failedCount: userIds.length - validUserIds.length,
    });
  } catch (error) {
    console.error('Error sending batch notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengirim notifikasi batch' },
      { status: 500 }
    );
  }
}
