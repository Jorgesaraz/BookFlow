import dotenv from 'dotenv';
dotenv.config();

import { server } from './server';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

// Conectar a la base de datos antes de iniciar el servidor
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 BookFlow Backend Server corriendo en puerto ${PORT}`);
    console.log(`🌐 API Base: http://localhost:${PORT}/api`);
    console.log(`📡 Socket.IO listo para conexiones`);
    console.log(`===============================================`);
  });
});

export { server };
export default server;
