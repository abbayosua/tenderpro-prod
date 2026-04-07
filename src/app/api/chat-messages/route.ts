import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get messages for a conversation (Enhanced with pagination)
export async function GET(request: NextRequest) {
  try {
    const conversationId = request.nextUrl.searchParams.get('conversationId');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const userId = request.nextUrl.searchParams.get('userId');
    const before = request.nextUrl.searchParams.get('before');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID wajib diisi' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      conversationId,
    };
    if (before) {
      where.id = { lt: before };
    }

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      db.message.count({ where: { conversationId } }),
    ]);

    // Mark messages as read for this user
    if (userId) {
      await db.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    // Reverse to show oldest first
    const sortedMessages = messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      isRead: m.isRead,
      readAt: m.readAt?.toISOString() || null,
      createdAt: m.createdAt.toISOString(),
      sender: m.sender ? {
        id: m.sender.id,
        name: m.sender.name,
        avatar: m.sender.avatar,
        role: m.sender.role,
      } : null,
    })).reverse();

    const hasMore = skip + messages.length < total;

    return NextResponse.json({
      success: true,
      messages: sortedMessages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat pesan' },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, senderId, content } = body;

    if (!conversationId || !senderId || !content) {
      return NextResponse.json({ error: 'Data pesan tidak lengkap' }, { status: 400 });
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Pesan maksimal 5000 karakter' }, { status: 400 });
    }

    // Verify conversation exists
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Percakapan tidak ditemukan' }, { status: 404 });
    }

    // Verify sender is participant
    if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
      return NextResponse.json({ error: 'Anda bukan peserta percakapan ini' }, { status: 403 });
    }

    // Create message
    const message = await db.message.create({
      data: {
        conversationId,
        senderId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Update conversation's lastMessage and lastMessageAt
    await db.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content.trim().substring(0, 200),
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
        sender: message.sender,
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengirim pesan' },
      { status: 500 }
    );
  }
}

// PUT - Mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, userId } = body;

    if (!conversationId || !userId) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const result = await db.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      markedCount: result.count,
      message: `${result.count} pesan ditandai sebagai dibaca`,
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menandai pesan' },
      { status: 500 }
    );
  }
}
