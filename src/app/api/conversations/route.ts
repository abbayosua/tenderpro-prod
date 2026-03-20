import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/middleware';
import { requireAuth } from '@/lib/middleware';

// Create conversation schema
const createConversationSchema = z.object({
  participantId: z.string().cuid(),
  projectId: z.string().cuid().optional(),
});

// Send message schema
const sendMessageSchema = z.object({
  content: z.string().min(1, 'Pesan tidak boleh kosong').max(5000),
});

// Get or create conversation
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const body = await request.json();
    const { participantId, projectId } = createConversationSchema.parse(body);
    
    // Check if conversation already exists
    let conversation = await db.conversation.findFirst({
      where: {
        OR: [
          { user1Id: user.userId, user2Id: participantId },
          { user1Id: participantId, user2Id: user.userId },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    });
    
    if (!conversation) {
      // Create new conversation
      conversation = await db.conversation.create({
        data: {
          user1Id: user.userId,
          user2Id: participantId,
          projectId: projectId,
        },
        include: {
          messages: true,
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: conversation.id,
        participantId,
        messages: conversation.messages.map((msg) => ({
          id: msg.id,
          senderId: msg.senderId,
          content: msg.content,
          isRead: msg.isRead,
          createdAt: msg.createdAt,
        })),
        lastMessageAt: conversation.lastMessageAt,
        projectId: conversation.projectId,
        isNew: conversation.messages.length === 0,
        isParticipant: true,
      },
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401 },
      );
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 },
    );
  }
}

// List user's conversations
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { user1Id: user.userId },
          { user2Id: user.userId },
        ],
      },
      include: {
        user1: {
          select: { id: true, name: true, avatar: true },
        },
        user2: {
          select: { id: true, name: true, avatar: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        project: {
          select: { id: true, title: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
    
    const formattedConversations = conversations.map((conv) => {
      const otherUser = conv.user1Id === user.userId ? conv.user2 : conv.user1;
      const lastMessage = conv.messages[0];
      
      return {
        id: conv.id,
        participant: {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.avatar,
        },
        lastMessage: lastMessage?.content?.substring(0, 100),
        lastMessageAt: conv.lastMessageAt,
        project: conv.project,
      };
    });
    
    return NextResponse.json({
      success: true,
      data: formattedConversations,
    });
  } catch (error) {
    console.error('List conversations error:', error);
    
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401 },
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 },
    );
  }
}
