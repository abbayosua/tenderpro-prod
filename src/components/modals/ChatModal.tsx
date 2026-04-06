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
  MessageSquare, Send, ArrowLeft, User, Building2, Loader2, Search,
  Paperclip, X, Check, CheckCheck, Clock, MessageCircleHeart
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
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
  startWithUser?: { id: string; name: string } | null;
  projectId?: string;
}

// Random online status for demo users
const onlineUserIds = new Set<string>();
function getOnlineStatus(userId: string): boolean {
  if (onlineUserIds.size === 0) {
    // Seed some random users as online for demo
    const demoIds = ['demo-online-1', 'demo-online-2', 'demo-online-3'];
    demoIds.forEach(id => onlineUserIds.add(id));
    // Also mark some real IDs
    if (userId) {
      // Use hash to deterministically set ~40% of users as online
      let hash = 0;
      for (let i = 0; i < userId.length; i++) {
        hash = ((hash << 5) - hash) + userId.charCodeAt(i);
        hash |= 0;
      }
      if (Math.abs(hash) % 10 < 4) {
        onlineUserIds.add(userId);
      }
    }
  }
  return onlineUserIds.has(userId);
}

function formatTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'HH:mm');
  } catch {
    return '';
  }
}

function getLastSeenText(userId: string): string {
  if (getOnlineStatus(userId)) return 'Online';
  const minutes = [5, 15, 30, 45, 120, 300];
  const m = minutes[Math.abs(userId.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0)) % minutes.length];
  if (m < 60) return `Terakhir dilihat ${m} menit lalu`;
  return `Terakhir dilihat ${Math.floor(m / 60)} jam lalu`;
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
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Check typing status
  const checkTypingStatus = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(`/api/chat/typing?conversationId=${conversationId}&excludeUserId=${currentUser.id}`);
      const data = await res.json();
      if (data.isTyping) {
        setIsOtherTyping(true);
        // Check again in 2 seconds
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsOtherTyping(false);
        }, 2000);
      } else {
        setIsOtherTyping(false);
      }
    } catch {
      // silently ignore
    }
  }, [currentUser.id]);

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
        fetchConversations();
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast.error('Gagal memulai percakapan');
    }
  }, [currentUser.id, projectId, fetchMessages, fetchConversations]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!open || !currentUser?.id) return;

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
          if (selectedConversation?.id === newMsg.conversationId) {
            setMessages(prev => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, {
                ...newMsg,
                sender: newMsg.senderId === currentUser.id
                  ? { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar || null, role: '' }
                  : selectedConversation.otherUser,
              }];
            });
          }
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

  // Poll typing status for selected conversation
  useEffect(() => {
    if (!selectedConversation) {
      setIsOtherTyping(false);
      return;
    }
    const interval = setInterval(() => {
      checkTypingStatus(selectedConversation.id);
    }, 2000);
    return () => {
      clearInterval(interval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [selectedConversation, checkTypingStatus]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachedFile) return;
    if (!selectedConversation) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setAttachedFile(null);

    // Show mock typing indicator for 2 seconds after sending
    setIsOtherTyping(true);
    setTimeout(() => setIsOtherTyping(false), 2000);

    try {
      const res = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          senderId: currentUser.id,
          content: messageContent || `(File: lampiran)`,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Gagal mengirim pesan');
      setNewMessage(messageContent);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle file attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile({ name: file.name, size: file.size });
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    setAttachedFile(null);
    fetchConversations();
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.project?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Typing indicator dots animation
  const TypingIndicator = () => (
    <div className="flex justify-start">
      <div className="bg-slate-100 border-l-2 border-l-slate-300 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[120px]">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );

  // Read receipt component
  const ReadReceipt = ({ isOwn, isRead }: { isOwn: boolean; isRead: boolean }) => {
    if (!isOwn) return null;
    if (isRead) {
      return <CheckCheck className="h-3.5 w-3.5 text-primary" />;
    }
    return <Check className="h-3.5 w-3.5 text-slate-400" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[600px] p-0 gap-0">
        <div className="flex h-full">
          {/* Conversations Sidebar */}
          <div className={`w-80 border-r flex flex-col bg-slate-50/50 ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            <DialogHeader className="p-4 border-b bg-white">
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Pesan
              </DialogTitle>
            </DialogHeader>

            {/* Search */}
            <div className="p-3 border-b bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari percakapan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
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
                  <p className="text-slate-500 font-medium">Belum ada percakapan</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Mulai chat dengan mengklik tombol chat pada profil kontraktor
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conv) => {
                    const isOnline = getOnlineStatus(conv.otherUser.id);
                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`w-full p-3 flex items-start gap-3 hover:bg-slate-100 transition-colors text-left ${
                          selectedConversation?.id === conv.id ? 'bg-primary/5 border-r-2 border-primary' : ''
                        }`}
                      >
                        <div className="relative">
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
                          {isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate text-sm">{conv.otherUser.name}</span>
                            {conv.unreadCount > 0 && (
                              <Badge className="bg-primary text-xs px-1.5 py-0 h-5 min-w-[20px] flex items-center justify-center">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          {conv.project && (
                            <p className="text-xs text-primary truncate mt-0.5">{conv.project.title}</p>
                          )}
                          <p className="text-sm text-slate-500 truncate mt-0.5">
                            {conv.lastMessage || 'Belum ada pesan'}
                          </p>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-xs text-slate-400">
                              {formatDistanceToNow(new Date(conv.lastMessageAt), {
                                addSuffix: true,
                                locale: id,
                              })}
                            </p>
                            {isOnline && (
                              <span className="text-xs text-green-600 font-medium">Online</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 flex flex-col bg-white ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b flex items-center gap-3 bg-white">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={handleBack}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.otherUser.avatar || undefined} />
                      <AvatarFallback>
                        {selectedConversation.otherUser.role === 'CONTRACTOR' ? (
                          <Building2 className="h-5 w-5" />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {getOnlineStatus(selectedConversation.otherUser.id) && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{selectedConversation.otherUser.name}</h3>
                    {selectedConversation.project && (
                      <p className="text-xs text-slate-500 truncate">{selectedConversation.project.title}</p>
                    )}
                    <p className={`text-xs mt-0.5 ${getOnlineStatus(selectedConversation.otherUser.id) ? 'text-green-600' : 'text-slate-400'}`}>
                      {getLastSeenText(selectedConversation.otherUser.id)}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg, idx) => {
                        const isOwn = msg.senderId === currentUser.id;
                        const showTail = idx === 0 || messages[idx - 1]?.senderId !== msg.senderId;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showTail ? 'mt-4' : 'mt-0.5'}`}
                          >
                            <div className={`max-w-[75%] relative group ${showTail ? '' : ''}`}>
                              {isOwn ? (
                                /* Own message - gradient background */
                                <div
                                  className={`rounded-2xl px-3.5 py-2 text-white ${
                                    showTail ? 'bg-gradient-to-br from-primary to-teal-600 rounded-br-sm' : 'bg-gradient-to-br from-primary to-teal-600 rounded-2xl'
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                  <div className="flex items-center justify-end gap-1.5 mt-1">
                                    <span className="text-[10px] text-white/70">{formatTime(msg.createdAt)}</span>
                                    <ReadReceipt isOwn={isOwn} isRead={msg.isRead} />
                                  </div>
                                </div>
                              ) : (
                                /* Other's message - light slate with left border */
                                <div
                                  className={`rounded-2xl px-3.5 py-2 ${
                                    showTail
                                      ? 'bg-slate-100 border-l-2 border-l-primary/40 rounded-bl-sm'
                                      : 'bg-slate-100 border-l-2 border-l-slate-200 rounded-2xl'
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-800">{msg.content}</p>
                                  <div className="flex items-center justify-end gap-1 mt-1">
                                    <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
                                    <ReadReceipt isOwn={isOwn} isRead={msg.isRead} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {/* Typing indicator */}
                      {isOtherTyping && <TypingIndicator />}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t bg-slate-50/30">
                  {/* File attachment preview */}
                  {attachedFile && (
                    <div className="mb-2 flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
                      <Paperclip className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-700 truncate flex-1">{attachedFile.name}</span>
                      <span className="text-xs text-slate-400">
                        {(attachedFile.size / 1024).toFixed(1)} KB
                      </span>
                      <button
                        onClick={handleRemoveFile}
                        className="h-5 w-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                      >
                        <X className="h-3 w-3 text-slate-500" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 w-10 text-slate-400 hover:text-slate-600 shrink-0"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Ketik pesan..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 h-10"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() && !attachedFile}
                      className="bg-primary hover:bg-primary/90 h-10 w-10 p-0 shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* Empty chat state - no conversation selected */
              <div className="flex-1 flex items-center justify-center bg-slate-50/30">
                <div className="text-center px-8">
                  <div className="relative mx-auto w-24 h-24 mb-6">
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
                    <div className="relative w-24 h-24 bg-gradient-to-br from-primary/20 to-teal-100 rounded-full flex items-center justify-center">
                      <MessageCircleHeart className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Mulai Percakapan</h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto mb-4">
                    Pilih percakapan dari daftar atau mulai chat baru dengan kontraktor untuk mendiskusikan proyek Anda
                  </p>
                  <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Respons cepat</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span>Tanda terima</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5" />
                      <span>Lampiran</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
