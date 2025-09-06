import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { MessageList } from '@/components/conversation/message-list';
import { MessageInput } from '@/components/conversation/message-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MobileToggle } from '@/components/sidebar/mobile-toggle';
import { UserStatus } from '@/components/conversation/user-status';

interface ConversationPageProps {
  params: {
    conversationId: string;
  };
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const session = await auth();
  const { conversationId } = await params;

  if (!session?.user) {
    redirect('/login');
  }

  const conversation = await prisma.conversation.findUnique({
    where: {
      id: conversationId,
      OR: [
        { userOneId: session.user.id },
        { userTwoId: session.user.id }
      ]
    },
    include: {
      userOne: true,
      userTwo: true
    },
  });

  if (!conversation) {
    redirect('/');
  }

  // Get the other user in the conversation
  const otherUser = conversation.userOneId === session.user.id 
    ? conversation.userTwo 
    : conversation.userOne;

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
          {otherUser && <UserStatus user={otherUser} />}
        </div>
      </div>
      <MessageList conversationId={conversationId} currentUserId={session.user.id} />
      <MessageInput conversationId={conversationId} />
    </div>
  );
}