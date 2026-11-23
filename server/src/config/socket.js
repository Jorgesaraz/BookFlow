let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Cliente conectado: ${socket.id}`);

    // Unirse a room de administración para Kanban
    socket.on('join_admin', () => {
      socket.join('admin_room');
      console.log(`[Socket.IO] Socket ${socket.id} unido a 'admin_room'`);
    });

    // Unirse a room privada de usuario para notificaciones de pedidos
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`[Socket.IO] Socket ${socket.id} unido a 'user_${userId}'`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`);
    });
  });

  return ioInstance;
};

const getIO = () => {
  if (!ioInstance) {
    console.warn('[Socket.IO] Advertencia: io no ha sido inicializado aún.');
  }
  return ioInstance;
};

module.exports = { initSocket, getIO };
