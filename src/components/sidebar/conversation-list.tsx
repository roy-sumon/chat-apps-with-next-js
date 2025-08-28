'use client';

import { useEffect, useState } from 'react';
import { Conversation, Message, User } from '@prisma/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { getSocket, initializeSocket } from '@/lib/socket';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

type ConversationWithParticipants = Conversation & {
  participants: {
    user: User;
  }[];
  messages: Message[];
};

interface ConversationListProps {
  userId: string;
}

export const ConversationList = ({ userId }: ConversationListProps) => {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    // Fetch conversations from the API
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/conversations');
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        } else {
          toast.error('Failed to load conversations');
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        toast.error('Failed to load conversations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();

    // Initialize socket connection
    if (session?.user?.id) {
      const socket = initializeSocket(session.user.id);
      
      // Listen for new conversations
      socket.on('new-conversation', (conversation: ConversationWithParticipants) => {
        setConversations(prev => [conversation, ...prev]);
      });
      
      // Listen for new messages that might update conversation order
      socket.on('new-message', ({ conversationId }: { conversationId: string }) => {
        setConversations(prev => {
          const updatedConversation = prev.find(c => c.id === conversationId);
          if (!updatedConversation) return prev;
          
          // Move the conversation to the top
          const filteredConversations = prev.filter(c => c.id !== conversationId);
          return [updatedConversation, ...filteredConversations];
        });
      });
      
      return () => {
        socket.off('new-conversation');
        socket.off('new-message');
      };
    }
  }, [userId, session?.user?.id]);

  const handleSelectConversation = (conversationId: string) => {
    router.push(`/conversations/${conversationId}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 py-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-md animate-pulse">
            <div className="h-10 w-10 rounded-full bg-muted"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-3 w-32 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
        <p>No conversations yet</p>
        <p className="text-xs">Start a new conversation to chat</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-2">
      {conversations.map((conversation) => {
        const otherParticipant = conversation.participants.find(p => p.user.id !== userId);
        const otherUser = otherParticipant?.user;
        const lastMessage = conversation.messages[0];
        
        return (
          <button
            key={conversation.id}
            onClick={() => handleSelectConversation(conversation.id)}
            className={cn(
              'flex items-center gap-3 p-2 rounded-md hover:bg-accent transition w-full text-left',
            )}
          >
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage src={otherUser?.image || ''} alt={otherUser?.name || 'User'} />
              <AvatarFallback>
                {otherUser?.name?.charAt(0).toUpperCase() || otherUser?.email?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="font-medium text-sm sm:text-base truncate">{otherUser?.name || otherUser?.email || 'Unknown User'}</p>
              <p className="text-xs text-muted-foreground truncate">
                {lastMessage?.content || 'No messages yet'}
              </p>
            </div>
            {conversation.lastMessageAt && (
              <div className="text-xs text-muted-foreground hidden sm:block">
                {new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};