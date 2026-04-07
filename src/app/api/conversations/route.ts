import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get all conversations for a user (Enhanced)
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib diisi' }, { status: 400 });
    }

    // Get all conversations where user is participant
    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Get other user info for each conversation + enrich with data
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
        const otherUser = await db.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            isVerified: true,
            contractor: { select: { companyName: true, specialization: true } },
          },
        });

        // Get project info if exists
        let project: { id: string; title: string; status: string } | null = null;
        if (conv.projectId) {
          const projectData = await db.project.findUnique({
            where: { id: conv.projectId },
            select: { id: true, title: true, status: true },
          });
          project = projectData;
        }

        // Count unread messages
        const unreadCount = await db.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false,
          },
        });

        // Last message preview
        const lastMessage = conv.messages[0] || null;

        return {
          id: conv.id,
          user1Id: conv.user1Id,
          user2Id: conv.user2Id,
          projectId: conv.projectId,
          lastMessageAt: conv.lastMessageAt?.toISOString() || null,
          lastMessage: conv.lastMessage,
          otherUser: otherUser ? {
            id: otherUser.id,
            name: otherUser.name,
            avatar: otherUser.avatar,
            role: otherUser.role,
            isVerified: otherUser.isVerified,
            companyName: otherUser.contractor?.companyName || null,
            specialization: otherUser.contractor?.specialization || null,
          } : null,
          project,
          unreadCount,
          lastMessagePreview: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt.toISOString(),
          } : null,
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString(),
        };
      })
    );

    // Sort by most recent activity
    conversationsWithUsers.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });

    // Aggregate stats
    const totalUnread = conversationsWithUsers.reduce((sum, c) => sum + c.unreadCount, 0);

    return NextResponse.json({
      success: true,
      conversations: conversationsWithUsers,
      totalUnread,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat percakapan' },
      { status: 500 }
    );
  }
}

// POST - Create or get existing conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user1Id, user2Id, projectId } = body;

    if (!user1Id || !user2Id) {
      return NextResponse.json({ error: 'Kedua user ID wajib diisi' }, { status: 400 });
    }

    if (user1Id === user2Id) {
      return NextResponse.json({ error: 'Tidak dapat membuat percakapan dengan diri sendiri' }, { status: 400 });
    }

    // Sort user IDs to ensure consistent conversation lookup
    const [sortedUser1Id, sortedUser2Id] = [user1Id, user2Id].sort();

    // Check if conversation already exists
    let conversation = await db.conversation.findFirst({
      where: {
        user1Id: sortedUser1Id,
        user2Id: sortedUser2Id,
        ...(projectId ? { projectId } : { projectId: null }),
      },
    });

    if (!conversation) {
      // Create new conversation
      conversation = await db.conversation.create({
        data: {
          user1Id: sortedUser1Id,
          user2Id: sortedUser2Id,
          projectId: projectId || null,
        },
      });
    }

    // Get other user info
    const otherUserId = conversation.user1Id === user1Id ? conversation.user2Id : conversation.user1Id;
    const otherUser = await db.user.findUnique({
      where: { id: otherUserId },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        isVerified: true,
        contractor: { select: { companyName: true } },
      },
    });

    return NextResponse.json({
      success: true,
      conversation: {
        ...conversation,
        otherUser,
      },
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat percakapan' },
      { status: 500 }
    );
  }
}
