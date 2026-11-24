// Re-exportar desde el módulo central socket/socket para mantener compatibilidad
const socketModule = require('../socket/socket');

module.exports = {
  initSocket: socketModule.initSocket,
  getIO: socketModule.getIO
};
