import { Message, User } from '@prisma/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface MessageBubbleProps {
  message: Message & { sender: User };
  isCurrentUser: boolean;
}

export const MessageBubble = ({ message, isCurrentUser }: MessageBubbleProps) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const formatTime = (date: string | Date) => {
    if (!isClient) {
      // Return a placeholder that matches server rendering
      return '--:--';
    }
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className={cn(
      'flex items-start gap-2',
      isCurrentUser && 'flex-row-reverse'
    )}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.sender.image || ''} alt={message.sender.name || 'User'} />
        <AvatarFallback>
          {message.sender.name?.charAt(0).toUpperCase() || message.sender.email?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className={cn(
        'max-w-[80%] sm:max-w-[70%] rounded-md p-2 sm:p-3',
        isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      )}>
        <p className="text-sm">{message.content}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
};
