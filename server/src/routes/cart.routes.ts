import { Router } from 'express';
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from '../controllers/cart.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas del carrito están protegidas con el middleware authenticate
router.use(authenticate as any);

router.get('/', getCart as any);
router.post('/items', addItemToCart as any);
router.put('/items/:bookId', updateCartItem as any);
router.delete('/items/:bookId', removeCartItem as any);
router.delete('/', clearCart as any);

export default router;
