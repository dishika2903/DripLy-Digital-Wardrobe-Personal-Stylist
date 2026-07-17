import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Generates a short-lived access token containing basic user claims and current token version.
 * @param {Object} user - Prisma User model instance
 * @returns {String} access token
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

/**
 * Generates a long-lived refresh token containing user ID and current token version.
 * @param {Object} user - Prisma User model instance
 * @returns {String} refresh token
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      tokenVersion: user.tokenVersion,
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Verifies access token and returns decrypted payload.
 * @param {String} token - Access token
 * @returns {Object} token payload
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

/**
 * Verifies refresh token and returns decrypted payload.
 * @param {String} token - Refresh token
 * @returns {Object} token payload
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};
