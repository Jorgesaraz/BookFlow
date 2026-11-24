import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  updateProfileEndpoint,
  adminCheck,
  addAddress
} from '../controllers/auth.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas
router.post('/register', registerUser as any);
router.post('/login', loginUser as any);

// Rutas protegidas
router.get('/me', authenticate as any, getMe as any);
router.put('/profile', authenticate as any, updateProfileEndpoint as any);
router.post('/addresses', authenticate as any, addAddress as any);

// Ruta protegida ADMIN
router.get('/admin-check', authenticate as any, authorizeRoles('ADMIN') as any, adminCheck as any);

export default router;
