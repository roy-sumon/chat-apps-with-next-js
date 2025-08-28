import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { MessageList } from '@/components/conversation/message-list';
import { MessageInput } from '@/components/conversation/message-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MobileToggle } from '@/components/sidebar/mobile-toggle';

interface ConversationPageProps {
  params: {
    conversationId: string;
  };
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const conversation = await prisma.conversation.findUnique({
    where: {
      id: params.conversationId,
      participants: {
        some: {
          userId: session.user.id
        }
      }
    },
    include: {
      participants: {
        include: {
          user: true
        }
      }
    },
  });

  if (!conversation) {
    redirect('/');
  }

  // Get the other user in the conversation
  const otherParticipant = conversation.participants.find(
    participant => participant.user.id !== session.user.id
  );
  const otherUser = otherParticipant?.user;

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 sm:p-4 border-b flex items-center gap-2 sm:gap-3">
        <MobileToggle user={session.user} />
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
          <AvatarImage src={otherUser?.image || ''} alt={otherUser?.name || 'User'} />
          <AvatarFallback>
            {otherUser?.name?.charAt(0).toUpperCase() || otherUser?.email?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <h2 className="font-semibold text-sm sm:text-base truncate">{otherUser?.name || otherUser?.email || 'Chat'}</h2>
          <p className="text-xs text-muted-foreground">
            {otherUser?.isOnline ? (
              <span className="text-green-500 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                <span className="truncate">Online</span>
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground"></span>
                <span className="truncate">Offline</span>
              </span>
            )}
          </p>
        </div>
      </div>
      <MessageList conversationId={params.conversationId} currentUserId={session.user.id} />
      <MessageInput conversationId={params.conversationId} />
    </div>
  );
}