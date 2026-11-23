const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Conectar a la base de datos
connectDB();

const app = express();
const server = http.createServer(app);

// Configuración de CORS permitiendo CLIENT_URL o fallback a http://localhost:3000
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:3000';

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === clientOrigin || origin === 'http://localhost:3000') {
        callback(null, true);
      } else {
        callback(null, true); // Permitir en desarrollo local
      }
    },
    credentials: true
  })
);

// Middlewares de parseo
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Inicializar Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});
initSocket(io);

// Ruta de estado general
app.get('/', (req, res) => {
  res.json({
    name: 'BookFlow API REST & WebSockets',
    version: '1.0.0',
    status: 'online'
  });
});

// Montaje de rutas de la API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Manejo centralizado de errores
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 BookFlow Backend Server corriendo en puerto ${PORT}`);
    console.log(`🌐 API Base: http://localhost:${PORT}/api`);
    console.log(`📡 Socket.IO listo para conexiones`);
    console.log(`===============================================`);
  });
}

module.exports = { app, server };
