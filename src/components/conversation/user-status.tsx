'use client';

import { useEffect, useState } from 'react';
import { User } from '@prisma/client';
import { getSocket, initializeSocket } from '@/lib/socket';
import { useSession } from 'next-auth/react';

interface UserStatusProps {
  user: User;
}

export const UserStatus = ({ user }: UserStatusProps) => {
  const [isOnline, setIsOnline] = useState(user.isOnline);
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      try {
        // Initialize socket if not already done
        const socket = initializeSocket(session.user.id);
        
        // Listen for user status updates
        socket.on('user-status-change', ({ userId, isOnline: newStatus }: { userId: string, isOnline: boolean }) => {
          if (userId === user.id) {
            setIsOnline(newStatus);
          }
        });

        // Cleanup
        return () => {
          socket.off('user-status-change');
        };
      } catch (error) {
        console.error('Error setting up socket for status updates:', error);
      }
    }
  }, [session?.user?.id, user.id]);

  // Also periodically check the user's actual status from the database
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const response = await fetch(`/api/users/${user.id}/status`);
        if (response.ok) {
          const data = await response.json();
          setIsOnline(data.isOnline);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    // Check status every 30 seconds
    const interval = setInterval(checkUserStatus, 30000);
    return () => clearInterval(interval);
  }, [user.id]);

  return (
    <span className="text-xs text-muted-foreground">
      {isOnline ? (
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
    </span>
  );
};
