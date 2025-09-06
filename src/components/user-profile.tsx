import { User } from '@prisma/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface UserProfileProps {
  user: User;
}

export const UserProfile = ({ user }: UserProfileProps) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const formatLastSeen = (date: string | Date | null) => {
    if (!isClient || !date) {
      return 'Never';
    }
    return new Date(date).toLocaleString();
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
          <AvatarFallback>
            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{user.name || 'User'}</CardTitle>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Status:</span>
            <span className="text-sm">
              {user.isOnline ? (
                <span className="text-green-500 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Online
                </span>
              ) : (
                <span className="text-gray-500 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                  Offline
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Last seen:</span>
            <span className="text-sm">
              {formatLastSeen(user.lastSeen)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};