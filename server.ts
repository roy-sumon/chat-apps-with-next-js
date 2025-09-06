import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { prisma } from './src/lib/prisma';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3002; // Changed to 3002 as both 3000 and 3001 are in use

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
    path: '/socket.io',
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://192.168.10.162:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Content-Type'],
    },
    transports: ['websocket', 'polling'],
  });
  
  console.log('🔧 Socket.io server initialized with CORS for:', ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']);

  // Socket.io connection handler
  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string;
    console.log('New socket connection attempt. userId:', userId);

    if (userId) {
      // Join a room with the user's ID
      socket.join(userId);

      // Update user status to online
      updateUserStatus(userId, true);
      
      // Broadcast user online status to all connected clients
      socket.broadcast.emit('user-status-change', { userId, isOnline: true });

      console.log(`User connected: ${userId}`);

      // Handle joining conversation rooms
      socket.on('join-conversation', (conversationId: string) => {
        socket.join(conversationId);
        console.log(`🚪 User ${userId} joined conversation: ${conversationId}`);
      });

      // Handle leaving conversation rooms
      socket.on('leave-conversation', (conversationId: string) => {
        socket.leave(conversationId);
        console.log(`User ${userId} left conversation: ${conversationId}`);
      });

      // Handle sending messages
      socket.on('send-message', async (data: { conversationId: string; content: string }) => {
        console.log('📨 Received send-message event:', { userId, data });
        try {
          const { conversationId, content } = data;

          if (!conversationId || !content) {
            console.error('❌ Invalid message data:', { conversationId, content });
            return;
          }

          // Get conversation to determine receiver
          const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
          });

          if (!conversation) {
            console.error('❌ Conversation not found for id:', conversationId);
            return;
          }
          
          console.log('✅ Found conversation:', { conversationId, userOneId: conversation.userOneId, userTwoId: conversation.userTwoId });

          // Determine receiver (the other user in the conversation)
          const receiverId = conversation.userOneId === userId ? conversation.userTwoId : conversation.userOneId;

          console.log('💾 Creating message in database...', { content, conversationId, senderId: userId, receiverId });
          
          // Create message in database
          const message = await prisma.message.create({
            data: {
              content,
              conversationId,
              senderId: userId,
              receiverId,
            },
            include: {
              sender: true,
            },
          });
          
          console.log('✅ Message created successfully:', { messageId: message.id, content: message.content });

          // Update conversation's updatedAt timestamp
          await prisma.conversation.update({
            where: {
              id: conversationId,
            },
            data: {
              updatedAt: new Date(),
            },
          });
          
          console.log('📡 Broadcasting message to room:', conversationId);

          // Emit to all users in the conversation
          io.to(conversationId).emit('new-message', message);

          // Emit event to update conversation order in sidebar
          io.emit('new-message', { conversationId });
          
          console.log('🎉 Message handling completed successfully');
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
        
        // Broadcast user offline status to all connected clients
        socket.broadcast.emit('user-status-change', { userId, isOnline: false });
      });
    }
  });

  // Helper function to update user online status
  const updateUserStatus = async (userId: string, isOnline: boolean) => {
    try {
      console.log(`Updating user ${userId} status to ${isOnline ? 'online' : 'offline'}`);
      const result = await prisma.user.update({
        where: { id: userId },
        data: { 
          isOnline,
          lastSeen: new Date(),
        },
      });
      console.log(`User status updated successfully:`, { id: result.id, isOnline: result.isOnline });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  // Start the server
  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});