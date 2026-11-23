const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrdersAdmin,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/admin/all', protect, authorize('ADMIN'), getAllOrdersAdmin);
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, authorize('ADMIN'), updateOrderStatus);

module.exports = router;
