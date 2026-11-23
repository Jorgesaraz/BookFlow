import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { verifyToken, JwtPayloadData } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: 'CLIENT' | 'ADMIN';
    name?: string;
    email?: string;
    _id?: any;
    addresses?: any[];
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'No autorizado: token no proporcionado.'
    });
    return;
  }

  try {
    const decoded: JwtPayloadData = verifyToken(token);
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Token inválido: payload sin identificador de usuario.'
      });
      return;
    }

    const user: any = await User.findById(userId).select('-password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o dado de baja.'
      });
      return;
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      _id: user._id,
      addresses: user.addresses
    };

    next();
  } catch (error: any) {
    console.error('[Auth Middleware] Error de verificación de token:', error.message);
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado.'
    });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Acceso denegado: el rol '${req.user?.role || 'Guest'}' no tiene permisos suficientes.`
      });
      return;
    }
    next();
  };
};

export const protect = authenticate;
export const authorize = authorizeRoles;

export default {
  authenticate,
  authorizeRoles,
  protect,
  authorize
};
