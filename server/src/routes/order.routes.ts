import { Router } from 'express';
import {
  createPayPalOrderEndpoint,
  capturePayPalOrderEndpoint,
  getMyOrdersEndpoint,
  getOrderByIdEndpoint
} from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de órdenes están protegidas con el middleware authenticate
router.use(authenticate as any);

router.post('/create-paypal-order', createPayPalOrderEndpoint as any);
router.post('/capture-paypal-order', capturePayPalOrderEndpoint as any);
router.get('/my-orders', getMyOrdersEndpoint as any);
router.get('/:id', getOrderByIdEndpoint as any);

export default router;
