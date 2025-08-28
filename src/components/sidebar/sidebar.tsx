import { User } from '@prisma/client';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';
import { ConversationList } from './conversation-list';
import { NewConversationDialog } from './new-conversation-dialog';
import { ThemeToggle } from '@/components/theme-toggle';

interface SidebarProps {
  user: User;
}

export const Sidebar = ({ user }: SidebarProps) => {
  return (
    <div className="h-full w-full md:w-80 flex flex-col bg-muted/30 border-r">
      <div className="p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{user.name || 'User'}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
        <div className="flex gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <SignOutButton />
        </div>
      </div>
      <div className="p-3">
        <NewConversationDialog />
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-3">
        <ConversationList userId={user.id} />
      </ScrollArea>
    </div>
  );
};