const express = require('express');
const router = express.Router();
const {
  createPayPalOrderEndpoint,
  capturePayPalOrderEndpoint,
  getMyOrdersEndpoint,
  getOrderByIdEndpoint
} = require('../controllers/orderController');
const { authenticate } = require('../middlewares/auth.middleware');

// Todas las rutas de órdenes están protegidas con el middleware authenticate
router.use(authenticate);

router.post('/create-paypal-order', createPayPalOrderEndpoint);
router.post('/capture-paypal-order', capturePayPalOrderEndpoint);
router.get('/my-orders', getMyOrdersEndpoint);
router.get('/:id', getOrderByIdEndpoint);

module.exports = router;
