import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket && typeof window !== 'undefined') {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('✅ [Socket.IO Client] Conectado al servidor WebSocket:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ [Socket.IO Client] Desconectado del servidor');
    });
  }
  return socket;
};
