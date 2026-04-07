import { Server } from 'socket.io';

const PORT = 3003;

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  conversationId: string;
}

interface Conversation {
  id: string;
  participants: string[];
  projectId?: string;
  projectName?: string;
  lastMessage?: Message;
  unreadCount: Record<string, number>;
}

// In-memory storage (in production, use database)
const conversations = new Map<string, Conversation>();
const messages = new Map<string, Message[]>();
const userSockets = new Map<string, Set<string>>();

const io = new Server(PORT, {
  cors: {
    origin: ['http://localhost:3000', 'https://tenderpro.id'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

console.log(`Chat service running on port ${PORT}`);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // User joins with their ID
  socket.on('join', (userId: string) => {
    socket.join(`user:${userId}`);
    
    // Track user sockets
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);
    
    console.log(`User ${userId} joined with socket ${socket.id}`);
    
    // Send user their conversations
    const userConversations = Array.from(conversations.values())
      .filter(c => c.participants.includes(userId));
    
    socket.emit('conversations', userConversations);
  });

  // Get conversation messages
  socket.on('get_messages', (conversationId: string) => {
    const conversationMessages = messages.get(conversationId) || [];
    socket.emit('messages', { conversationId, messages: conversationMessages });
  });

  // Send message
  socket.on('send_message', (data: {
    senderId: string;
    senderName: string;
    receiverId: string;
    content: string;
    conversationId?: string;
    projectId?: string;
    projectName?: string;
  }) => {
    const conversationId = data.conversationId || 
      `conv_${[data.senderId, data.receiverId].sort().join('_')}`;
    
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: data.senderId,
      senderName: data.senderName,
      receiverId: data.receiverId,
      content: data.content,
      timestamp: new Date(),
      conversationId,
    };

    // Store message
    if (!messages.has(conversationId)) {
      messages.set(conversationId, []);
    }
    messages.get(conversationId)!.push(message);

    // Update or create conversation
    let conversation = conversations.get(conversationId);
    if (!conversation) {
      conversation = {
        id: conversationId,
        participants: [data.senderId, data.receiverId],
        projectId: data.projectId,
        projectName: data.projectName,
        lastMessage: message,
        unreadCount: { [data.receiverId]: 1 },
      };
      conversations.set(conversationId, conversation);
    } else {
      conversation.lastMessage = message;
      conversation.unreadCount[data.receiverId] = (conversation.unreadCount[data.receiverId] || 0) + 1;
    }

    // Emit to sender
    socket.emit('message_sent', message);
    
    // Emit to receiver
    io.to(`user:${data.receiverId}`).emit('new_message', message);
    
    // Update conversations for both users
    [data.senderId, data.receiverId].forEach(userId => {
      const userConversations = Array.from(conversations.values())
        .filter(c => c.participants.includes(userId));
      io.to(`user:${userId}`).emit('conversations', userConversations);
    });
  });

  // Mark messages as read
  socket.on('mark_read', (data: { conversationId: string; userId: string }) => {
    const conversation = conversations.get(data.conversationId);
    if (conversation) {
      conversation.unreadCount[data.userId] = 0;
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove socket from userSockets
    userSockets.forEach((sockets, userId) => {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSockets.delete(userId);
      }
    });
  });
});
