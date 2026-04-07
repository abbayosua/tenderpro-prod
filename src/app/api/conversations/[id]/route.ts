import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    
    // Get token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    // Also check cookie
    const cookieToken = request.cookies.get('auth-token')?.value;
    const tokenToUse = token || cookieToken;
    
    if (!tokenToUse) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401 },
      );
    }
    
    // Verify token
    const { verifyToken } = await import('@/lib/auth');
    const user = await verifyToken(tokenToUse);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Token tidak valid' },
        { status: 401 },
      );
    }
    
    // Get conversation with messages
    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
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
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    
    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation tidak ditemukan' },
        { status: 404 },
      );
    }
    
    // Mark messages as read
    await db.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.userId },
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });
    
    const conversationWithUsers = conversation as typeof conversation & {
      user1: { id: string; name: string; avatar: string | null };
      user2: { id: string; name: string; avatar: string | null };
      messages: Array<{
        id: string;
        senderId: string;
        content: string;
        isRead: boolean;
        readAt: Date | null;
        createdAt: Date;
      }>;
    };
    const otherUser = conversationWithUsers.user1Id === user.userId ? conversationWithUsers.user2 : conversationWithUsers.user1;
    
    return NextResponse.json({
      success: true,
      data: {
        id: conversationWithUsers.id,
        participant: {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.avatar,
        },
        messages: (conversationWithUsers.messages || []).map((msg: any) => ({
          id: msg.id,
          senderId: msg.senderId,
          content: msg.content,
          isRead: msg.isRead,
          readAt: msg.readAt,
          createdAt: msg.createdAt,
          isOwn: msg.senderId === user.userId,
        })),
      },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 },
    );
  }
}
