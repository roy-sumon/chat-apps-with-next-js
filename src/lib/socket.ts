import { io, Socket } from 'socket.io-client';

let socket: Socket;

export const initializeSocket = (userId: string) => {
  console.log('🔌 Initializing socket for userId:', userId);
  
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';
    console.log('🌐 Connecting to Socket.io server:', socketUrl);
    
    socket = io(socketUrl, {
      path: '/socket.io',
      query: { userId },
      transports: ['websocket', 'polling'], // Ensure multiple transport options
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected successfully! ID:', socket.id);
      console.log('👤 Connected with userId:', userId);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected. Reason:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('🚫 Socket connection error:', error);
    });

    socket.on('error', (error) => {
      console.error('⚠️ Socket error:', error);
    });
    
    socket.on('new-message', (message) => {
      console.log('📨 Received new message:', message);
    });
  } else {
    console.log('🔄 Socket already initialized, reusing existing connection');
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initializeSocket first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};