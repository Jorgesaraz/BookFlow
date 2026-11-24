import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import { generateToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * @desc    Registrar un nuevo usuario cliente
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Por favor proporciona nombre, correo electrónico y contraseña.'
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      res.status(409).json({
        success: false,
        message: 'El correo electrónico ya está registrado.'
      });
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una minúscula y un número.'
      });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'CLIENT'
    });

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses || []
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Iniciar sesión
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Por favor ingresa correo y contraseña.'
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas.'
      });
      return;
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas.'
      });
      return;
    }

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses || []
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener perfil del usuario autenticado
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar perfil del usuario (nombre y opcionalmente contraseña)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfileEndpoint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
      return;
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return;
    }

    const { name, currentPassword, newPassword } = req.body;

    // 1. Actualizar nombre si viene
    if (name && name.trim()) {
      user.name = name.trim();
    }

    // 2. Si se solicita cambio de contraseña, validar contraseña actual
    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Para cambiar la contraseña debes proporcionar la contraseña actual y la nueva contraseña.'
        });
        return;
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        res.status(400).json({
          success: false,
          message: 'La contraseña actual es incorrecta.'
        });
        return;
      }

      if (!PASSWORD_REGEX.test(newPassword)) {
        res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula y un número.'
        });
        return;
      }

      user.password = newPassword;
    }

    await user.save();

    const updatedUser = await User.findById(userId).select('-password');

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ruta de prueba protegida para rol ADMIN
 * @route   GET /api/auth/admin-check
 * @access  Private/Admin
 */
export const adminCheck = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Acceso de Administrador verificado exitosamente.',
    user: req.user
  });
};

/**
 * @desc    Agregar dirección
 * @route   POST /api/auth/addresses
 * @access  Private
 */
export const addAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const { recipientName, street, city, state, postalCode, country, phone, isDefault } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return;
    }

    if (isDefault) {
      user.addresses.forEach((addr: any) => (addr.isDefault = false));
    }

    user.addresses.push({
      recipientName,
      street,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault: isDefault || user.addresses.length === 0
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

export default {
  registerUser,
  loginUser,
  getMe,
  updateProfileEndpoint,
  adminCheck,
  addAddress
};
