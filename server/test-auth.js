const { generateToken, verifyToken } = require('./src/utils/jwt');
const { authenticate, authorizeRoles } = require('./src/middlewares/auth.middleware');
const User = require('./src/models/User');

console.log('🧪 [TEST] Iniciando verificación de autenticación y RBAC...');

// 1. Test JWT utilities
try {
  const payload = { userId: '123456789012345678901234', role: 'CLIENT' };
  const token = generateToken(payload);
  if (!token || typeof token !== 'string') throw new Error('Token no generado');

  const decoded = verifyToken(token);
  if (decoded.userId !== payload.userId || decoded.role !== payload.role) {
    throw new Error('Payload decodificado no coincide');
  }
  console.log('✅ 1. Utilidades JWT (generateToken, verifyToken): OK');
} catch (e) {
  console.error('❌ Error en test JWT:', e.message);
  process.exit(1);
}

// 2. Test User Model Schema
try {
  const schemaPaths = User.schema.paths;
  if (!schemaPaths.name || !schemaPaths.name.isRequired) throw new Error('name es requerido');
  if (!schemaPaths.email || !schemaPaths.email.isRequired || !schemaPaths.email.options.unique) throw new Error('email debe ser requerido y único');
  if (schemaPaths.password.options.select !== false) throw new Error('password debe tener select: false');
  if (schemaPaths.password.options.minlength[0] !== 8) throw new Error('password debe tener minlength de 8');
  
  const roleEnum = schemaPaths.role.enumValues || (Array.isArray(schemaPaths.role.options.enum) ? schemaPaths.role.options.enum : schemaPaths.role.options.enum.values);
  if (!roleEnum.includes('CLIENT') || !roleEnum.includes('ADMIN')) {
    throw new Error('role debe permitir CLIENT y ADMIN');
  }
  if (schemaPaths.role.options.default !== 'CLIENT') throw new Error('role default debe ser CLIENT');
  console.log('✅ 2. Schema de User (name, email único, password select:false min 8, role CLIENT/ADMIN): OK');
} catch (e) {
  console.error('❌ Error en test User Schema:', e.message);
  process.exit(1);
}

// 3. Test Middlewares
try {
  // Simular authorizeRoles con usuario CLIENT queriendo ADMIN
  const reqClient = { user: { userId: '123', role: 'CLIENT' } };
  let statusClient = 0;
  let jsonClient = null;
  const resClient = {
    status: (code) => { statusClient = code; return resClient; },
    json: (data) => { jsonClient = data; return resClient; }
  };
  let nextCalled = false;
  const adminOnlyMiddleware = authorizeRoles('ADMIN');
  adminOnlyMiddleware(reqClient, resClient, () => { nextCalled = true; });

  if (statusClient !== 403 || nextCalled) {
    throw new Error(`authorizeRoles falló: status recibido ${statusClient}, nextCalled=${nextCalled}`);
  }

  // Simular authorizeRoles con usuario ADMIN
  const reqAdmin = { user: { userId: '456', role: 'ADMIN' } };
  let adminNextCalled = false;
  adminOnlyMiddleware(reqAdmin, resClient, () => { adminNextCalled = true; });
  if (!adminNextCalled) {
    throw new Error('authorizeRoles falló: ADMIN debería poder pasar');
  }

  console.log('✅ 3. Middleware authorizeRoles (RBAC): OK');
} catch (e) {
  console.error('❌ Error en test Middlewares:', e.message);
  process.exit(1);
}

// 4. Test Routes and Controller syntax
try {
  const authRoutes = require('./src/routes/authRoutes');
  const authController = require('./src/controllers/authController');
  if (!authController.registerUser || !authController.loginUser || !authController.getMe || !authController.adminCheck) {
    throw new Error('Faltan funciones requeridas en authController');
  }
  console.log('✅ 4. Rutas y Controlador (/api/auth/register, login, me, admin-check): OK');
} catch (e) {
  console.error('❌ Error en test Routes/Controller:', e.message);
  process.exit(1);
}

console.log('🎉 TODOS LOS TESTS DE AUTENTICACIÓN Y RBAC PASARON EXITOSAMENTE.');
