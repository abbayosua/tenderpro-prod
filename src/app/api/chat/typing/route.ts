import { NextRequest, NextResponse } from 'next/server';

// In-memory typing state storage
const typingState = new Map<string, { userId: string; isTyping: boolean; lastTypingAt: number }>();

// Auto-expire typing state after 5 seconds
function cleanExpired() {
  const now = Date.now();
  for (const [key, value] of typingState.entries()) {
    if (now - value.lastTypingAt > 5000) {
      typingState.delete(key);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, userId } = body;

    if (!conversationId || !userId) {
      return NextResponse.json(
        { error: 'conversationId dan userId diperlukan' },
        { status: 400 }
      );
    }

    const key = `${conversationId}:${userId}`;
    typingState.set(key, {
      userId,
      isTyping: true,
      lastTypingAt: Date.now(),
    });

    return NextResponse.json({ success: true, isTyping: true });
  } catch {
    return NextResponse.json(
      { error: 'Gagal memproses permintaan' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const excludeUserId = searchParams.get('excludeUserId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId diperlukan' },
        { status: 400 }
      );
    }

    cleanExpired();

    const isTyping: { userId: string; lastTypingAt: number }[] = [];

    for (const [key, value] of typingState.entries()) {
      if (key.startsWith(`${conversationId}:`)) {
        if (excludeUserId && value.userId === excludeUserId) continue;
        if (value.isTyping) {
          isTyping.push({
            userId: value.userId,
            lastTypingAt: value.lastTypingAt,
          });
        }
      }
    }

    return NextResponse.json({
      isTyping: isTyping.length > 0,
      users: isTyping,
    });
  } catch {
    return NextResponse.json(
      { error: 'Gagal memproses permintaan' },
      { status: 500 }
    );
  }
}
