import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// In-memory chat messages store (per project)
interface ChatMessage {
  id: string;
  projectId: string;
  userId: string;
  message: string;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
}

// Memory store keyed by projectId
const chatStore: Record<string, ChatMessage[]> = {};

const sendMessageSchema = z.object({
  userId: z.string().min(1, 'User ID wajib diisi'),
  message: z.string().min(1, 'Pesan tidak boleh kosong').max(5000, 'Pesan maksimal 5000 karakter'),
});

// GET: Fetch chat messages for a project with pagination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID diperlukan' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get messages from memory store
    const projectMessages = chatStore[projectId] || [];
    const total = projectMessages.length;

    // Sort by createdAt descending for pagination, then reverse for display
    const sortedMessages = [...projectMessages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const paginatedMessages = sortedMessages.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: {
        messages: paginatedMessages.map((msg) => ({
          id: msg.id,
          projectId: msg.projectId,
          userId: msg.userId,
          message: msg.message,
          createdAt: msg.createdAt.toISOString(),
          sender: msg.sender,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + limit < total,
        },
      },
    });
  } catch (error) {
    console.error('Gagal memuat pesan chat:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat pesan chat' },
      { status: 500 }
    );
  }
}

// POST: Send a message to a project chat
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID diperlukan' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { userId, message } = parsed.data;

    // Build sender info (in-memory, use provided data or defaults)
    const senderName = body.userName || 'Pengguna';
    const senderAvatar = body.userAvatar || null;
    const senderRole = body.userRole || 'MEMBER';

    const newMessage: ChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      projectId,
      userId,
      message,
      createdAt: new Date(),
      sender: {
        id: userId,
        name: senderName,
        avatar: senderAvatar,
        role: senderRole,
      },
    };

    // Initialize store for this project if not exists
    if (!chatStore[projectId]) {
      chatStore[projectId] = [];
    }

    chatStore[projectId].push(newMessage);

    return NextResponse.json({
      success: true,
      data: {
        id: newMessage.id,
        projectId: newMessage.projectId,
        userId: newMessage.userId,
        message: newMessage.message,
        createdAt: newMessage.createdAt.toISOString(),
        sender: newMessage.sender,
      },
    });
  } catch (error) {
    console.error('Gagal mengirim pesan:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengirim pesan' },
      { status: 500 }
    );
  }
}
