import { verifyAccessToken } from '../utils/jwt.js';
import * as authService from '../modules/auth/service.js';

export default async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Access token is missing or malformed');
      error.status = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    const token = authHeader.split(' ')[1];

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (e) {
      const error = new Error('Access token is invalid or has expired');
      error.status = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    const user = await authService.getUserById(payload.id);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      const error = new Error('Session has expired or has been revoked');
      error.status = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    // Attach user profile info to the request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
