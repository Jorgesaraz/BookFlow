const express = require('express');
const router = express.Router();
const {
  getBookReviewsEndpoint,
  createReviewEndpoint,
  deleteReviewEndpoint
} = require('../controllers/reviewController');
const { authenticate } = require('../middlewares/auth.middleware');

// Ruta pública para leer las reseñas de un libro
router.get('/book/:bookId', getBookReviewsEndpoint);

// Rutas protegidas
router.post('/book/:bookId', authenticate, createReviewEndpoint);
router.delete('/:id', authenticate, deleteReviewEndpoint);

module.exports = router;
