import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'quikledgr_super_secure_jwt_token_key_change_in_production';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'consultant',
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyJwtToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

export async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

export async function hashAccessPin(pin) {
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(pin, salt);
  return { hash: hashed, salt };
}

export async function verifyAccessPin(pin, hash) {
  return bcrypt.compare(pin, hash);
}
