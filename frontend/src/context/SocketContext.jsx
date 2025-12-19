import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from '../components/Toast';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      // Don't connect if user is not authenticated
      return;
    }

    // Connect to Socket.IO server
    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      auth: {
        token,
      },
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Socket.IO connected');
      setIsConnected(true);

      // Authenticate with user info
      socketInstance.emit('authenticate', {
        userId: user.id || user._id,
        role: user.role,
      });
    });

    socketInstance.on('authenticated', (data) => {
      console.log('✅ Socket authenticated:', data);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Socket.IO disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      setIsConnected(false);
    });

    // Global notification listener
    socketInstance.on('booking:notification', (data) => {
      console.log('🔔 Booking notification:', data);
      showToast(data.message, 'success');
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [user, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}

