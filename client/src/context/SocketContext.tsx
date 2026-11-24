'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: 'order' | 'stock';
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

export interface StockUpdatePayload {
  bookId: string;
  stock: number;
  availability: boolean;
}

export interface CatalogUpdatePayload {
  action: 'create' | 'update' | 'delete';
  bookId: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  notifications: [],
  unreadCount: 0,
  markAllAsRead: () => {},
  clearNotifications: () => {}
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getSocketUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

const generateId = (): string =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toast, setToast] = useState<Notification | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Mostrar toast durante 6 segundos ────────────────────────────────────────
  const showToast = useCallback((notif: Notification) => {
    setToast(notif);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 6000);
  }, []);

  // ── Agregar notificación al historial + toast ────────────────────────────────
  const addNotification = useCallback(
    (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
      const notif: Notification = {
        ...n,
        id: generateId(),
        read: false,
        createdAt: new Date()
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 50));
      showToast(notif);
    },
    [showToast]
  );

  // ── Acciones públicas ────────────────────────────────────────────────────────
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // ── Inicializar / reconectar socket cuando cambia el usuario/token ───────────
  useEffect(() => {
    const socketUrl = getSocketUrl();
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('bookflow_token') : '') || '';

    const s: Socket = io(socketUrl, {
      auth: { token: authToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: true
    });

    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket.IO] Conectado:', s.id);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket.IO] Desconectado');
    });

    // ── Eventos ADMIN: notificaciones ────────────────────────────────────────
    s.on('new-order', (data: { orderId: string; totalAmount: number; customerEmail: string; itemsCount: number; createdAt: string }) => {
      if (user?.role === 'ADMIN') {
        addNotification({
          type: 'order',
          title: '🛒 Nueva orden completada',
          message: `${data.customerEmail} · $${data.totalAmount.toFixed(2)} · ${data.itemsCount} ítem(s)`
        });
      }
    });

    s.on('low-stock-alert', (data: { bookId: string; title: string; stock: number; availability: boolean }) => {
      if (user?.role === 'ADMIN') {
        addNotification({
          type: 'stock',
          title: '⚠️ Stock crítico',
          message: `"${data.title}" tiene solo ${data.stock} unidad(es) restante(s).`
        });
      }
    });

    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('new-order');
      s.off('low-stock-alert');
      s.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, notifications, unreadCount, markAllAsRead, clearNotifications }}
    >
      {children}

      {/* Toast flotante para notificaciones ADMIN */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full bg-slate-900 border border-slate-700 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300"
          role="alert"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-indigo-300 truncate">{toast.title}</p>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-500 hover:text-white transition shrink-0 mt-0.5"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
