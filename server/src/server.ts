import express, { Application, Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import { initSocket } from './socket/socket';
import authRoutes from './routes/auth.routes';
import bookRoutes from './routes/book.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import reviewRoutes from './routes/review.routes';

const app: Application = express();
const server = http.createServer(app);

// Normalizar CLIENT_URL eliminando cualquier barra diagonal final
const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const clientOrigin = rawClientUrl.trim().replace(/\/+$/, '');

app.use(
  cors({
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
        callback(null, true); // Permitir conexiones desde entornos y previews de Railway
      }
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Inicializar Socket.IO vinculado al servidor HTTP
initSocket(server);

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'BookFlow API REST & WebSockets',
    version: '1.0.0',
    status: 'online'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);

const PORT = process.env.PORT || 5000;

export { app, server };
export default server;
