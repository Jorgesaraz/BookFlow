const express = require('express');
const router = express.Router();
const {
  getBooks,
  getCategories,
  getBookById,
  createBook,
  updateBook,
  deleteBook
} = require('../controllers/bookController');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

// Rutas públicas del catálogo
router.get('/', getBooks);
router.get('/categories', getCategories);
router.get('/:id', getBookById);

// Rutas administrativas protegidas (solo rol ADMIN)
router.post('/', authenticate, authorizeRoles('ADMIN'), createBook);
router.put('/:id', authenticate, authorizeRoles('ADMIN'), updateBook);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), deleteBook);

module.exports = router;
