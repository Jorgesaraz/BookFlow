import { Router } from 'express';
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
} from '../controllers/book.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas del catálogo
router.get('/', getBooks);
router.get('/:id', getBookById);

// Rutas administrativas protegidas (solo rol ADMIN)
router.post('/', authenticate, authorizeRoles('ADMIN'), createBook);
router.put('/:id', authenticate, authorizeRoles('ADMIN'), updateBook);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), deleteBook);

export default router;
