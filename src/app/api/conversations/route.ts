import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get all conversations for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
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

    // Get other user info for each conversation
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
        const otherUser = await db.user.findUnique({
          where: { id: otherUserId },
          select: { id: true, name: true, avatar: true, role: true },
        });

        // Get project info if exists
        let project: { id: string; title: string } | null = null;
        if (conv.projectId) {
          const projectData = await db.project.findUnique({
            where: { id: conv.projectId },
            select: { id: true, title: true },
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

        return {
          ...conv,
          otherUser,
          project,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ conversations: conversationsWithUsers });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST - Create or get existing conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user1Id, user2Id, projectId } = body;

    if (!user1Id || !user2Id) {
      return NextResponse.json({ error: 'Both user IDs required' }, { status: 400 });
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
      select: { id: true, name: true, avatar: true, role: true },
    });

    return NextResponse.json({
      conversation: {
        ...conversation,
        otherUser,
      },
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
