const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateProfileEndpoint,
  adminCheck,
  addAddress
} = require('../controllers/authController');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

// Rutas públicas de autenticación
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rutas protegidas para usuarios autenticados
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfileEndpoint);
router.post('/addresses', authenticate, addAddress);

// Ruta de prueba protegida con control de roles (RBAC: solo ADMIN)
router.get('/admin-check', authenticate, authorizeRoles('ADMIN'), adminCheck);

module.exports = router;
