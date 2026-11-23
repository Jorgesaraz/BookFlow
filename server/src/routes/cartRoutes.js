const express = require('express');
const router = express.Router();
const {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} = require('../controllers/cartController');
const { authenticate } = require('../middlewares/auth.middleware');

// Todas las rutas del carrito están protegidas con el middleware authenticate
router.use(authenticate);

router.get('/', getCart);
router.post('/items', addItemToCart);
router.put('/items/:bookId', updateCartItem);
router.delete('/items/:bookId', removeCartItem);
router.delete('/', clearCart);

module.exports = router;
