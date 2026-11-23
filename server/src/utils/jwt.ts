import jwt, { SignOptions } from 'jsonwebtoken';

export interface JwtPayloadData {
  userId?: string;
  id?: string;
  role?: 'CLIENT' | 'ADMIN';
  [key: string]: any;
}

export const generateToken = (payload: JwtPayloadData): string => {
  const secret = process.env.JWT_SECRET || 'bookflow_super_secure_jwt_secret_key_2026!';
  const expiresIn = (process.env.JWT_EXPIRE || '7d') as SignOptions['expiresIn'];

  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string): JwtPayloadData => {
  const secret = process.env.JWT_SECRET || 'bookflow_super_secure_jwt_secret_key_2026!';
  return jwt.verify(token, secret) as JwtPayloadData;
};

export default {
  generateToken,
  verifyToken
};
