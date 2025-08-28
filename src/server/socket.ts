import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '@/lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface SocketNextApiResponse {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
}

export type NextApiResponseWithSocket = SocketNextApiResponse;

export const initSocketServer = (req: NextApiRequest, res: SocketNextApiResponse) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      const userId = socket.handshake.query.userId as string;

      if (userId) {
        // Join a room with the user's ID
        socket.join(userId);

        // Update user status to online
        updateUserStatus(userId, true);

        console.log(`User connected: ${userId}`);

        // Handle joining conversation rooms
        socket.on('join-conversation', (conversationId: string) => {
          socket.join(conversationId);
          console.log(`User ${userId} joined conversation: ${conversationId}`);
        });

        // Handle leaving conversation rooms
        socket.on('leave-conversation', (conversationId: string) => {
          socket.leave(conversationId);
          console.log(`User ${userId} left conversation: ${conversationId}`);
        });

        // Handle new messages
        socket.on('send-message', async (data: { conversationId: string; text: string }) => {
          try {
            const { conversationId, text } = data;

            // Create message in database
            const message = await prisma.message.create({
              data: {
                text,
                conversation: {
                  connect: { id: conversationId },
                },
                sender: {
                  connect: { id: userId },
                },
              },
              include: {
                sender: true,
              },
            });

            // Update conversation's last message
            await prisma.conversation.update({
              where: { id: conversationId },
              data: {
                lastMessageAt: new Date(),
                lastMessageText: text,
              },
            });

            // Emit message to all users in the conversation
            io.to(conversationId).emit('new-message', message);

            // Get all users in this conversation
            const conversation = await prisma.conversation.findUnique({
              where: { id: conversationId },
              include: { users: true },
            });

            // Emit notification to all users in the conversation who are not the sender
            conversation?.users.forEach((user) => {
              if (user.id !== userId) {
                io.to(user.id).emit('message-notification', {
                  message,
                  conversationId,
                });
              }
            });
          } catch (error) {
            console.error('Error sending message:', error);
          }
        });

        // Handle typing indicators
        socket.on('typing', ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
          socket.to(conversationId).emit('user-typing', {
            userId,
            isTyping,
          });
        });

        // Handle disconnection
        socket.on('disconnect', () => {
          updateUserStatus(userId, false);
          console.log(`User disconnected: ${userId}`);
        });
      }
    });

    res.socket.server.io = io;
  }

  return res.socket.server.io;
};

const updateUserStatus = async (userId: string, isOnline: boolean) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline,
        lastSeen: isOnline ? undefined : new Date(),
      },
    });
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};