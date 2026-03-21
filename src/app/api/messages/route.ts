import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const sendMessageSchema = z.object({
  conversationId: z.string().cuid(),
  content: z.string().min(1, 'Pesan tidak boleh kosong').max(5000),
});

export async function POST(request: NextRequest) {
  try {
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
    
    const body = await request.json();
    const { conversationId, content } = sendMessageSchema.parse(body);
    
    // Check if user is participant
    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: user.userId },
          { user2Id: user.userId },
        ],
      },
    });
    
    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation tidak ditemukan' },
        { status: 404 },
      );
    }
    
    // Create message
    const message = await db.message.create({
      data: {
        conversationId,
        senderId: user.userId,
        content,
      },
    });
    
    // Update conversation's last message
    await db.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content,
        lastMessageAt: new Date(),
      },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    
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
