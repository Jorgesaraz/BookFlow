const express = require('express');
const router = express.Router();
const {
  createPayPalOrderEndpoint,
  capturePayPalOrderEndpoint,
  getMyOrdersEndpoint,
  getOrderByIdEndpoint,
  getAdminDashboardOrdersEndpoint,
  updateOrderStatusEndpoint
} = require('../controllers/orderController');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

// Todas las rutas de órdenes están protegidas con el middleware authenticate
router.use(authenticate);

router.post('/create-paypal-order', createPayPalOrderEndpoint);
router.post('/capture-paypal-order', capturePayPalOrderEndpoint);
router.get('/my-orders', getMyOrdersEndpoint);

// Rutas exclusivas para ADMIN (definidas antes de /:id para evitar colisiones)
router.get('/admin/dashboard', authorizeRoles('ADMIN'), getAdminDashboardOrdersEndpoint);
router.patch('/:id/status', authorizeRoles('ADMIN'), updateOrderStatusEndpoint);

router.get('/:id', getOrderByIdEndpoint);

module.exports = router;
