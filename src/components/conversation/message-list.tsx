'use client';

import { useEffect, useRef, useState } from 'react';
import { Message, User } from '@prisma/client';
import { MessageBubble } from './message-bubble';
import { cn } from '@/lib/utils';
import { getSocket, initializeSocket } from '@/lib/socket';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

type MessageWithSender = Message & {
  sender: User;
};

interface MessageListProps {
  conversationId: string;
  currentUserId: string;
}

export const MessageList = ({ conversationId, currentUserId }: MessageListProps) => {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  useEffect(() => {
    // Fetch messages from the API
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        } else {
          toast.error('Failed to load messages');
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Initialize socket connection
    if (session?.user?.id) {
      const socket = initializeSocket(session.user.id);
      
      // Listen for new messages
      socket.on('new-message', (message: MessageWithSender) => {
        setMessages(prev => [...prev, message]);
      });
      
      // Listen for typing indicators
      socket.on('user-typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
        setTypingUsers(prev => ({
          ...prev,
          [userId]: isTyping,
        }));
      });
      
      return () => {
        socket.off('new-message');
        socket.off('user-typing');
      };
    }
  }, [conversationId, session?.user?.id]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-2 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-10 w-64 bg-muted rounded-md"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
        <p className="text-muted-foreground">No messages yet</p>
        <p className="text-xs text-muted-foreground">Send a message to start the conversation</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isCurrentUser={message.senderId === currentUserId}
        />
      ))}
      {Object.keys(typingUsers).some(userId => typingUsers[userId] && userId !== currentUserId) && (
        <div className="flex items-start gap-2">
          <div className="bg-muted p-3 rounded-md">
            <div className="flex space-x-1">
              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '600ms' }} />
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};