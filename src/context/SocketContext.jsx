import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [callData, setCallData] = useState({
    show: false,
    mode: 'outbound',
    target: null,
    signal: null
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('🟢 Socket.io connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔴 Socket.io disconnected');
    });

    socket.on('onlineUsers:list', (list) => {
      setOnlineUsers(list);
    });

    socket.on('user:online', ({ userId }) => {
      setOnlineUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    });

    socket.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    socket.on('call:incoming', (data) => {
      setCallData(prev => {
        if (prev.show) return prev;
        return {
          show: true,
          mode: 'inbound',
          target: { _id: data.callerId, name: data.callerName, avatar: data.callerAvatar },
          signal: data.signal
        };
      });
    });

    socket.on('call:ended', () => {
      setCallData({ show: false, mode: 'outbound', target: null, signal: null });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, user]);

  const value = {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    isUserOnline: (userId) => onlineUsers.includes(userId),
    callData,
    setCallData,
    emit: (event, data) => socketRef.current?.emit(event, data),
    on: (event, handler) => socketRef.current?.on(event, handler),
    off: (event, handler) => socketRef.current?.off(event, handler),
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}

export default SocketContext;
