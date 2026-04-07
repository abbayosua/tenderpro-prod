import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client only if credentials are available
// Otherwise provide a null client for graceful degradation
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })
    : null;

// Types for chat
export interface ConversationWithUsers {
  id: string;
  user1Id: string;
  user2Id: string;
  projectId: string | null;
  lastMessage: string | null;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
  // Joined data
  otherUser?: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
  project?: {
    id: string;
    title: string;
  } | null;
}

export interface MessageWithSender {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  // Joined data
  sender?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

// Realtime channel name for messages
export const MESSAGES_CHANNEL = 'messages';
export const CONVERSATIONS_CHANNEL = 'conversations';
