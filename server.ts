import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { prisma } from './src/lib/prisma';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Prepare Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Initialize Socket.io server
  const io = new Server(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket.io connection handler
  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string;

    if (userId) {
      // Join a room with the user's ID
      socket.join(userId);

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

      // Handle sending messages
      socket.on('send-message', async (data: { conversationId: string; content: string }) => {
        try {
          const { conversationId, content } = data;

          // Create message in database
          const message = await prisma.message.create({
            data: {
              content,
              conversationId,
              senderId: userId,
            },
            include: {
              sender: true,
            },
          });

          // Update conversation's lastMessageAt
          await prisma.conversation.update({
            where: {
              id: conversationId,
            },
            data: {
              lastMessageAt: new Date(),
            },
          });

          // Emit to all users in the conversation
          io.to(conversationId).emit('new-message', message);

          // Emit event to update conversation order in sidebar
          io.emit('new-message', { conversationId });
        } catch (error) {
          console.error('Error sending message:', error);
        }
      });

      // Handle typing indicators
      socket.on('typing', ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
        socket.to(conversationId).emit('user-typing', { userId, isTyping });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}`);
        // Update user status to offline
        updateUserStatus(userId, false);
      });
    }
  });

  // Helper function to update user online status
  const updateUserStatus = async (userId: string, isOnline: boolean) => {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          isOnline,
          lastSeen: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  // Start the server
  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});