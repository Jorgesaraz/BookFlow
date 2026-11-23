const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

/**
 * Middleware para autenticar solicitudes mediante JWT Bearer token
 */
const authenticate = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado: token no proporcionado.'
    });
  }

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido: payload sin identificador de usuario.'
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o dado de baja.'
      });
    }

    // Adjuntar req.user con { userId, role } además del documento completo / _id para compatibilidad
    req.user = {
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      _id: user._id,
      addresses: user.addresses
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware] Error de verificación de token:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado.'
    });
  }
};

/**
 * Middleware para autorizar acceso basado en roles permitidos (RBAC)
 * @param  {...string} roles - Lista de roles permitidos ('CLIENT', 'ADMIN')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado: el rol '${req.user?.role || 'Guest'}' no tiene permisos suficientes.`
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles,
  // Alias de retrocompatibilidad
  protect: authenticate,
  authorize: authorizeRoles
};
