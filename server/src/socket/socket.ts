import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

let ioInstance: SocketIOServer | null = null;

/**
 * Inicializa la instancia central de Socket.IO vinculada al servidor HTTP
 */
export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  // Normalizar CLIENT_URL eliminando cualquier barra diagonal final
  const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const clientOrigin = rawClientUrl.trim().replace(/\/+$/, '');

  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.trim().replace(/\/+$/, '');
        if (
          normalizedOrigin === clientOrigin ||
          normalizedOrigin === 'http://localhost:3000' ||
          process.env.NODE_ENV !== 'production'
        ) {
          callback(null, true);
        } else {
          callback(null, true); // Permitir en desarrollo y previews de despliegue
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true
    }
  });

  // Middleware de autenticación para conexiones Socket.IO
  ioInstance.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;

    // Si no viene token (visitante público), permitir la conexión para recibir actualizaciones públicas
    if (!token) {
      return next();
    }

    try {
      const secret = process.env.JWT_SECRET || 'bookflow_super_secure_jwt_secret_key_2026!';
      const decoded: any = jwt.verify(token, secret);
      socket.data.user = decoded;
      next();
    } catch (err: any) {
      console.warn(`[Socket.IO] Token no válido en handshake: ${err.message}. Conectando como visitante público.`);
      // Permitir conexión pública aunque el token sea inválido
      next();
    }
  });

  ioInstance.on('connection', (socket: Socket) => {
    const user = socket.data?.user;
    const userRole = user?.role;
    const userId = user?.userId || user?.id;

    // Si el usuario tiene rol ADMIN, unirlo automáticamente a la sala privada 'admin-room'
    if (userRole === 'ADMIN') {
      socket.join('admin-room');
      console.log(`[Socket.IO] Socket ${socket.id} (ADMIN: ${user.name || user.email || userId}) unido a 'admin-room'`);
    }

    // Si es un usuario autenticado, unirlo a su sala privada
    if (userId) {
      socket.join(`user_${userId}`);
    }

    socket.on('disconnect', () => {
      // Desconexión limpia
    });
  });

  return ioInstance;
};

/**
 * Obtiene la instancia activa de Socket.IO
 */
export const getIO = (): SocketIOServer => {
  if (!ioInstance) {
    throw new Error('Socket.IO no ha sido inicializado. Debe ejecutarse initSocket(httpServer) primero.');
  }
  return ioInstance;
};

export default {
  initSocket,
  getIO
};
