'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { getSocket, initializeSocket } from '@/lib/socket';
import { useSession } from 'next-auth/react';

interface MessageInputProps {
  conversationId: string;
}

export const MessageInput = ({ conversationId }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { data: session } = useSession();
  
  useEffect(() => {
    if (session?.user?.id) {
      console.log('📌 MessageInput: Initializing socket and joining conversation');
      const socket = initializeSocket(session.user.id);
      
      // Wait a moment for socket to connect before joining room
      const joinRoom = () => {
        if (socket.connected) {
          console.log('🚪 Joining conversation room:', conversationId);
          socket.emit('join-conversation', conversationId);
        } else {
          console.log('⏰ Socket not connected yet, waiting...');
          socket.once('connect', () => {
            console.log('🚪 Joining conversation room after connect:', conversationId);
            socket.emit('join-conversation', conversationId);
          });
        }
      };
      
      joinRoom();
      
      return () => {
        console.log('💻 MessageInput: Leaving conversation:', conversationId);
        socket.emit('leave-conversation', conversationId);
      };
    }
  }, [session?.user?.id, conversationId]);
  
  useEffect(() => {
    const typingTimeout = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        try {
          const socket = getSocket();
          socket.emit('typing', { conversationId, isTyping: false });
        } catch (error) {
          console.error('Socket not initialized:', error);
        }
      }
    }, 2000);
    
    return () => clearTimeout(typingTimeout);
  }, [isTyping, conversationId]);
  
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      try {
        const socket = getSocket();
        socket.emit('typing', { conversationId, isTyping: true });
      } catch (error) {
        console.error('Socket not initialized:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Attempting to send message:', { message: message.trim(), conversationId, userId: session?.user?.id });
    
    if (!message.trim() || !session?.user?.id) {
      console.log('⚠️ Cannot send message - missing data:', { message: message.trim(), userId: session?.user?.id });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('🔌 Getting socket connection...');
      const socket = getSocket();
      console.log('✅ Socket obtained:', { connected: socket.connected, id: socket.id });
      
      const messageData = {
        conversationId,
        content: message.trim(),
      };
      
      console.log('🚀 Emitting send-message event:', messageData);
      socket.emit('send-message', messageData);
      
      console.log('✅ Message sent to server successfully');
      console.log('🎯 Message data sent:', {
        conversationId: messageData.conversationId,
        content: messageData.content,
        socketConnected: socket.connected,
        socketId: socket.id
      });
      
      // Clear the input after successful send
      setMessage('');
      setIsTyping(false);
      
      // Emit typing stopped
      socket.emit('typing', { conversationId, isTyping: false });
    } catch (error) {
      console.error('🚫 Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-2 sm:p-4 border-t">
      <div className="flex items-center gap-2">
        <Input
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
          disabled={isSubmitting}
          className="flex-1 text-sm sm:text-base"
        />
        <Button type="submit" size="icon" disabled={isSubmitting || !message.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};