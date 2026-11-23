const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

// Regex para contraseña segura: mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula y 1 número
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// @desc    Registrar un nuevo usuario cliente
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona nombre, correo electrónico y contraseña.'
      });
    }

    // 1. Validar unicidad del email (HTTP 409 si ya existe)
    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'El correo electrónico ya está registrado.'
      });
    }

    // 2. Validar contraseña segura
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una minúscula y un número.'
      });
    }

    // 3. Forzar role: 'CLIENT' (ignorar cualquier rol enviado en el body)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'CLIENT'
    });

    // 4. Generar token JWT con payload { userId, role }
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

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa correo y contraseña.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Buscar usuario incluyendo campo password
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // 2. Si no existe el usuario, responder 401 con mensaje genérico
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas.'
      });
    }

    // 3. Comparar contraseña con bcryptjs
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas.'
      });
    }

    // 4. Generar token JWT
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

// @desc    Obtener perfil del usuario autenticado
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId || req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ruta de prueba protegida para rol ADMIN
// @route   GET /api/auth/admin-check
// @access  Private/Admin
const adminCheck = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Acceso de Administrador verificado exitosamente.',
    user: req.user
  });
};

// @desc    Agregar o actualizar dirección del usuario
// @route   POST /api/auth/addresses
// @access  Private
const addAddress = async (req, res, next) => {
  try {
    const { recipientName, street, city, state, postalCode, country, phone, isDefault } = req.body;
    const user = await User.findById(req.user.userId || req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
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

module.exports = {
  registerUser,
  loginUser,
  getMe,
  adminCheck,
  addAddress
};
