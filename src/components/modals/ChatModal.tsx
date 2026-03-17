'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, ArrowLeft, User } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

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

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  recipientId?: string;
  recipientName?: string;
  projectId?: string;
  projectName?: string;
}

export function ChatModal({
  open,
  onOpenChange,
  userId,
  userName,
  recipientId,
  recipientName,
  projectId,
  projectName,
}: ChatModalProps) {
  const socketRef = useRef<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!open) return;

    const newSocket = io('/?XTransformPort=3003', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join', userId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('conversations', (convos: Conversation[]) => {
      setConversations(convos);
    });

    newSocket.on('messages', (data: { conversationId: string; messages: Message[] }) => {
      if (data.conversationId === selectedConversation?.id) {
        setMessages(data.messages);
      }
    });

    newSocket.on('new_message', (message: Message) => {
      if (message.conversationId === selectedConversation?.id) {
        setMessages(prev => [...prev, message]);
      }
    });

    newSocket.on('message_sent', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current = newSocket;

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [open, userId, selectedConversation?.id]);

  // Auto-select conversation if recipient is specified
  useEffect(() => {
    if (recipientId && recipientName && socketRef.current) {
      const existingConversation = conversations.find(
        c => c.participants.includes(recipientId)
      );

      if (existingConversation) {
        // Use setTimeout to defer state update
        setTimeout(() => {
          setSelectedConversation(existingConversation);
          socketRef.current?.emit('get_messages', existingConversation.id);
        }, 0);
      } else {
        const newConv: Conversation = {
          id: `conv_${[userId, recipientId].sort().join('_')}`,
          participants: [userId, recipientId],
          projectId,
          projectName,
        };
        setTimeout(() => {
          setSelectedConversation(newConv);
          setMessages([]);
        }, 0);
      }
    }
  }, [recipientId, recipientName, conversations, userId, projectId, projectName]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation && socketRef.current) {
      socketRef.current.emit('get_messages', selectedConversation.id);
      socketRef.current.emit('mark_read', { conversationId: selectedConversation.id, userId });
    }
  }, [selectedConversation, userId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !socketRef.current || !selectedConversation) return;

    const otherParticipant = selectedConversation.participants.find(p => p !== userId);

    socketRef.current.emit('send_message', {
      senderId: userId,
      senderName: userName,
      receiverId: otherParticipant,
      content: newMessage.trim(),
      conversationId: selectedConversation.id,
      projectId: selectedConversation.projectId,
      projectName: selectedConversation.projectName,
    });

    setNewMessage('');
  }, [newMessage, selectedConversation, userId, userName]);

  const getOtherParticipantName = (conversation: Conversation) => {
    return recipientName || 'Pengguna';
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    socketRef.current?.emit('get_messages', conversation.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg h-[600px] p-0">
        <div className="flex flex-col h-full">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <h3 className="font-medium">{getOtherParticipantName(selectedConversation)}</h3>
                  {selectedConversation.projectName && (
                    <p className="text-xs text-slate-500">{selectedConversation.projectName}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-slate-500">{isConnected ? 'Online' : 'Offline'}</span>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">Mulai percakapan</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            message.senderId === userId
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-slate-100'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderId === userId ? 'text-primary-foreground/70' : 'text-slate-400'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ketik pesan..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={!isConnected}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Conversations List */}
              <DialogHeader className="p-4 border-b">
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Pesan
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="flex-1">
                {conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Belum ada percakapan</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 text-left"
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {getOtherParticipantName(conversation)}
                          </p>
                          {conversation.projectName && (
                            <p className="text-xs text-slate-500 truncate">{conversation.projectName}</p>
                          )}
                          {conversation.lastMessage && (
                            <p className="text-sm text-slate-500 truncate">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {conversation.unreadCount[userId] > 0 && (
                            <Badge className="bg-primary">
                              {conversation.unreadCount[userId]}
                            </Badge>
                          )}
                          {conversation.lastMessage && (
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(conversation.lastMessage.timestamp).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
