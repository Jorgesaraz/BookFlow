const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT firmado
 * @param {Object} payload - Información a almacenar en el token ({ userId, role, ... })
 * @returns {string} Token JWT
 */
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'bookflow_super_secure_jwt_secret_key_2026!';
  const expiresIn = process.env.JWT_EXPIRE || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verifica y decodifica un token JWT
 * @param {string} token - Token JWT a verificar
 * @returns {Object} Payload decodificado
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'bookflow_super_secure_jwt_secret_key_2026!';
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken
};
