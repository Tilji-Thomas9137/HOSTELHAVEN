import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hostelhaven_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'hostelhaven_refresh_secret_key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '90d';

/**
 * Generate access token
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

/**
 * Generate refresh token
 * @param {string} userId - User ID
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRE,
  });
};

/**
 * Verify access token
 * @param {string} token - JWT token
 * @returns {object} Decoded token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {object} Decoded token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

