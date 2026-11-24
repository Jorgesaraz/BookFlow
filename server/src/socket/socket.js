const { Server: SocketIOServer } = require('socket.io');
const jwt = require('jsonwebtoken');

let ioInstance = null;

const initSocket = (httpServer) => {
  const clientOrigin = process.env.CLIENT_URL || 'http://localhost:3000';

  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin === clientOrigin || origin === 'http://localhost:3000') {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true
    }
  });

  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next();
    }

    try {
      const secret = process.env.JWT_SECRET || 'bookflow_super_secure_jwt_secret_key_2026!';
      const decoded = jwt.verify(token, secret);
      socket.data.user = decoded;
      next();
    } catch (err) {
      console.warn(`[Socket.IO] Token no válido en handshake: ${err.message}. Conectando como público.`);
      next();
    }
  });

  ioInstance.on('connection', (socket) => {
    const user = socket.data?.user;
    const userRole = user?.role;
    const userId = user?.userId || user?.id;

    if (userRole === 'ADMIN') {
      socket.join('admin-room');
      console.log(`[Socket.IO] Socket ${socket.id} (ADMIN: ${user.name || user.email || userId}) unido a 'admin-room'`);
    }

    if (userId) {
      socket.join(`user_${userId}`);
    }

    socket.on('disconnect', () => {});
  });

  return ioInstance;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO no ha sido inicializado. Debe ejecutarse initSocket(httpServer) primero.');
  }
  return ioInstance;
};

module.exports = {
  initSocket,
  getIO
};
