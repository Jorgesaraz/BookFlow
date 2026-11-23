'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    if (s) {
      if (s.connected) {
        setIsConnected(true);
      }

      s.on('connect', () => setIsConnected(true));
      s.on('disconnect', () => setIsConnected(false));

      // Si es ADMIN, unirse a la room de Kanban
      if (isAdmin) {
        s.emit('join_admin');
      }

      // Si es usuario autenticado, unirse a su canal personal
      if (user?._id) {
        s.emit('join_user', user._id);
      }
    }

    return () => {
      // Limpieza de listeners al desmontar
    };
  }, [user, isAdmin]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
