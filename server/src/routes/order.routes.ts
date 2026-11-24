import { Router } from 'express';
import {
  createPayPalOrderEndpoint,
  capturePayPalOrderEndpoint,
  getMyOrdersEndpoint,
  getOrderByIdEndpoint,
  getAdminDashboardOrdersEndpoint,
  updateOrderStatusEndpoint
} from '../controllers/order.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de órdenes están protegidas con el middleware authenticate
router.use(authenticate as any);

router.post('/create-paypal-order', createPayPalOrderEndpoint as any);
router.post('/capture-paypal-order', capturePayPalOrderEndpoint as any);
router.get('/my-orders', getMyOrdersEndpoint as any);

// Rutas exclusivas para ADMIN (definidas antes de /:id para evitar colisiones)
router.get('/admin/dashboard', authorizeRoles('ADMIN') as any, getAdminDashboardOrdersEndpoint as any);
router.patch('/:id/status', authorizeRoles('ADMIN') as any, updateOrderStatusEndpoint as any);

router.get('/:id', getOrderByIdEndpoint as any);

export default router;
