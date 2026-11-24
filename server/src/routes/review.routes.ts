import { Router } from 'express';
import {
  getBookReviewsEndpoint,
  createReviewEndpoint,
  deleteReviewEndpoint
} from '../controllers/review.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Ruta pública para leer las reseñas de un libro
router.get('/book/:bookId', getBookReviewsEndpoint as any);

// Rutas protegidas
router.post('/book/:bookId', authenticate as any, createReviewEndpoint as any);
router.delete('/:id', authenticate as any, deleteReviewEndpoint as any);

export default router;
