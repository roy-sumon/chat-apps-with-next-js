'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { initializeSocket, getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const SocketTest = () => {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<string[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState('');

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    if (session?.user?.id) {
      const socket = initializeSocket(session.user.id);
      
      socket.on('connect', () => {
        setConnected(true);
        setSocketId(socket.id || '');
        addLog(`✅ Connected to Socket.io server with ID: ${socket.id}`);
      });

      socket.on('disconnect', (reason) => {
        setConnected(false);
        setSocketId('');
        addLog(`❌ Disconnected: ${reason}`);
      });

      socket.on('connect_error', (error) => {
        addLog(`🚫 Connection error: ${error.message}`);
      });

      socket.on('new-message', (message) => {
        addLog(`📨 Received message: ${JSON.stringify(message)}`);
      });

      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('new-message');
      };
    }
  }, [session?.user?.id]);

  const testConnection = () => {
    try {
      const socket = getSocket();
      addLog(`🔌 Socket status: Connected=${socket.connected}, ID=${socket.id}`);
    } catch (error: any) {
      addLog(`❌ Socket error: ${error.message}`);
    }
  };

  const sendTestMessage = () => {
    if (!testMessage.trim()) return;
    
    try {
      const socket = getSocket();
      const messageData = {
        conversationId: '68bc825fda98062b8095e7f0', // Use a test conversation ID
        content: testMessage.trim()
      };
      
      addLog(`🚀 Sending test message: ${JSON.stringify(messageData)}`);
      socket.emit('send-message', messageData);
      setTestMessage('');
    } catch (error: any) {
      addLog(`❌ Failed to send message: ${error.message}`);
    }
  };

  const joinTestConversation = () => {
    try {
      const socket = getSocket();
      const conversationId = '68bc825fda98062b8095e7f0';
      socket.emit('join-conversation', conversationId);
      addLog(`🚪 Joined conversation: ${conversationId}`);
    } catch (error: any) {
      addLog(`❌ Failed to join conversation: ${error.message}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">Socket.io Debug Panel</h3>
      
      <div className="mb-4">
        <p>User ID: {session?.user?.id || 'Not logged in'}</p>
        <p>Socket Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</p>
        <p>Socket ID: {socketId || 'None'}</p>
      </div>

      <div className="flex gap-2 mb-4">
        <Button onClick={testConnection} size="sm">
          Test Connection
        </Button>
        <Button onClick={joinTestConversation} size="sm">
          Join Test Conversation
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="Test message..."
          onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
        />
        <Button onClick={sendTestMessage} disabled={!testMessage.trim()} size="sm">
          Send Test
        </Button>
      </div>

      <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-60 overflow-y-auto">
        {logs.length === 0 ? (
          <div>No logs yet...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))
        )}
      </div>
    </div>
  );
};
