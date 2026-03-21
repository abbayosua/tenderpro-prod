'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  MessageSquare, Send, ArrowLeft, User, Building2, Loader2, Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface User {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: User;
}

interface Conversation {
  id: string;
  otherUser: User;
  project?: { id: string; title: string } | null;
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: { id: string; name: string; avatar?: string | null };
  // Optional: Start chat with specific user
  startWithUser?: { id: string; name: string } | null;
  projectId?: string;
}

export function ChatModal({
  open,
  onOpenChange,
  currentUser,
  startWithUser,
  projectId,
}: ChatModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/conversations?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat-messages?conversationId=${conversationId}&limit=50`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        // Mark as read
        await fetch('/api/chat-messages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, userId: currentUser.id }),
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUser?.id]);

  // Initialize conversation with specific user
  const initConversation = useCallback(async (otherUser: { id: string; name: string }) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user1Id: currentUser.id,
          user2Id: otherUser.id,
          projectId,
        }),
      });
      const data = await res.json();
      if (data.conversation) {
        setSelectedConversation(data.conversation);
        fetchMessages(data.conversation.id);
        fetchConversations(); // Refresh list
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast.error('Gagal memulai percakapan');
    }
  }, [currentUser.id, projectId, fetchMessages, fetchConversations]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!open || !currentUser?.id) return;

    // Create channel for this user
    const channel = supabase
      .channel(`chat:${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // If message is for current conversation, add it
          if (selectedConversation?.id === newMsg.conversationId) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, {
                ...newMsg,
                sender: newMsg.senderId === currentUser.id
                  ? { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar || null, role: '' }
                  : selectedConversation.otherUser,
              }];
            });
          }
          // Refresh conversations to update last message
          fetchConversations();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [open, currentUser?.id, selectedConversation?.id, fetchConversations]);

  // Initial fetch
  useEffect(() => {
    if (open && currentUser?.id) {
      fetchConversations();
    }
  }, [open, currentUser?.id, fetchConversations]);

  // Start with specific user if provided
  useEffect(() => {
    if (open && startWithUser && !selectedConversation) {
      initConversation(startWithUser);
    }
  }, [open, startWithUser, selectedConversation, initConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const res = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          senderId: currentUser.id,
          content: messageContent,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
        fetchConversations(); // Refresh to update last message
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Gagal mengirim pesan');
      setNewMessage(messageContent); // Restore message on error
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Select conversation
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv.id);
  };

  // Go back to conversation list
  const handleBack = () => {
    setSelectedConversation(null);
    setMessages([]);
    fetchConversations();
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.project?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[600px] p-0 gap-0">
        <div className="flex h-full">
          {/* Conversations Sidebar */}
          <div className={`w-80 border-r flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Pesan
              </DialogTitle>
            </DialogHeader>

            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari percakapan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Belum ada percakapan</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Mulai chat dengan mengklik tombol chat pada profil kontraktor
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left ${
                        selectedConversation?.id === conv.id ? 'bg-primary/5' : ''
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.otherUser.avatar || undefined} />
                        <AvatarFallback>
                          {conv.otherUser.role === 'CONTRACTOR' ? (
                            <Building2 className="h-5 w-5" />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{conv.otherUser.name}</span>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-primary text-xs px-1.5 py-0.5">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {conv.project && (
                          <p className="text-xs text-primary truncate">{conv.project.title}</p>
                        )}
                        <p className="text-sm text-slate-500 truncate mt-0.5">
                          {conv.lastMessage || 'Belum ada pesan'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDistanceToNow(new Date(conv.lastMessageAt), {
                            addSuffix: true,
                            locale: id,
                          })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={handleBack}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar>
                    <AvatarImage src={selectedConversation.otherUser.avatar || undefined} />
                    <AvatarFallback>
                      {selectedConversation.otherUser.role === 'CONTRACTOR' ? (
                        <Building2 className="h-5 w-5" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedConversation.otherUser.name}</h3>
                    {selectedConversation.project && (
                      <p className="text-xs text-slate-500">{selectedConversation.project.title}</p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const isOwn = msg.senderId === currentUser.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <Card className={`max-w-[70%] p-3 ${isOwn ? 'bg-primary text-white' : 'bg-slate-100'}`}>
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-slate-400'}`}>
                                {formatDistanceToNow(new Date(msg.createdAt), {
                                  addSuffix: true,
                                  locale: id,
                                })}
                              </p>
                            </Card>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ketik pesan..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Pilih percakapan untuk memulai</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
