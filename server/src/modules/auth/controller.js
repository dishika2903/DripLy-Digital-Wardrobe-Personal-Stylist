import * as authService from './service.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import logger from '../../utils/logger.js';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema, changePasswordSchema, deleteAccountSchema } from './validation.js';
import { serializeUser } from './serializer.js';

// Cookie settings helper
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

// Manually extract cookies from request headers
const getCookieFromHeaders = (req, name) => {
  const rc = req.headers.cookie;
  if (!rc) return null;
  const list = {};
  rc.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const key = parts.shift().trim();
    const val = parts.join('=');
    list[key] = decodeURIComponent(val);
  });
  return list[name] || null;
};

const sendAuthResponse = (res, user, statusCode = 200) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  setRefreshTokenCookie(res, refreshToken);

  res.status(statusCode).json({
    success: true,
    data: {
      user: serializeUser(user),
      accessToken,
    },
  });
};

export const signup = async (req, res, next) => {
  try {
    const validatedData = signupSchema.parse(req.body);
    const user = await authService.registerUser(validatedData);
    sendAuthResponse(res, user, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const user = await authService.loginUser(validatedData);
    sendAuthResponse(res, user, 200);
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = getCookieFromHeaders(req, 'refreshToken');
    if (!refreshToken) {
      const error = new Error('Refresh token is missing');
      error.status = 401;
      error.code = 'UNAUTHORIZED';
      throw error;
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (e) {
      const error = new Error('Invalid or expired refresh token');
      error.status = 401;
      error.code = 'UNAUTHORIZED';
      throw error;
    }

    const user = await authService.getUserById(payload.id);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      const error = new Error('Session is no longer valid');
      error.status = 401;
      error.code = 'UNAUTHORIZED';
      throw error;
    }

    sendAuthResponse(res, user, 200);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (req, res, next) => {
  try {
    // req.user is attached by authMiddleware
    await authService.incrementTokenVersion(req.user.id);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({
      success: true,
      data: { message: 'Logged out of all sessions successfully' },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const resetToken = await authService.generatePasswordReset(email);

    if (resetToken) {
      // Simulate sending email by logging to output console
      const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
      logger.info(`📧 [Simulated Email] Password reset request for ${email}. Link: ${resetLink}`);
    }

    res.json({
      success: true,
      data: { message: 'If that email exists, we have sent a reset password link.' },
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(token, password);

    res.json({
      success: true,
      data: { message: 'Password updated successfully. All other sessions have been logged out.' },
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    // req.user is verified and attached by authMiddleware
    res.json({
      success: true,
      data: { user: serializeUser(req.user) },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await authService.updateUserProfile(req.user.id, data);
    res.json({ success: true, data: { user: serializeUser(user) } });
  } catch (error) {
    next(error);
  }
};

export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.cloudinaryUrl) {
      const error = new Error('An avatar image is required'); error.status = 400; error.code = 'VALIDATION_ERROR'; throw error;
    }
    const user = await authService.updateAvatar(req.user.id, req.cloudinaryUrl);
    res.json({ success: true, data: { user: serializeUser(user) } });
  } catch (error) { next(error); }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.json({ success: true, data: { message: 'Password updated. Please sign in again.' } });
  } catch (error) { next(error); }
};

export const accountSummary = async (req, res, next) => {
  try { res.json({ success: true, data: await authService.getAccountSummary(req.user.id) }); } catch (error) { next(error); }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const { confirmEmail } = deleteAccountSchema.parse(req.body);
    await authService.deleteUserAccount(req.user.id, confirmEmail);
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.json({ success: true, data: { message: 'Account deleted successfully' } });
  } catch (error) { next(error); }
};
