import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../config/db.js';

/**
 * Registers a new user and configures their default profile settings in a single transaction.
 * @param {Object} data - Signup parameters
 * @returns {Object} registered user payload
 */
export const registerUser = async ({ name, email, password, gender, heightCm, weightKg, bodyType }) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error('Email already registered');
    error.status = 409;
    error.code = 'EMAIL_ALREADY_REGISTERED';
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        gender: gender || null,
        heightCm: heightCm || null,
        weightKg: weightKg || null,
        bodyType: bodyType || null,
      },
    });

    await tx.settings.create({
      data: {
        userId: user.id,
      },
    });

    const userWithSettings = await tx.user.findUnique({
      where: { id: user.id },
      include: { settings: true },
    });
    return userWithSettings;
  });
};

/**
 * Validates user credentials.
 * @param {Object} credentials - Email and Password
 * @returns {Object} validated user model
 */
export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email }, include: { settings: true } });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  return user;
};

/**
 * Retrieves a user profile by database ID.
 * @param {String} id - User ID
 * @returns {Object|null} user record
 */
export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { settings: true },
  });
  if (!user) return null;
  return user;
};

/**
 * Increments the token version flag on user model, invalidating existing sessions.
 * @param {String} userId - User ID
 */
export const incrementTokenVersion = async (userId) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
};

export const updateUserProfile = async (userId, data) => {
  const cleanData = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value === '' ? null : value]));
  const user = await prisma.user.update({ where: { id: userId }, data: cleanData, include: { settings: true } });
  return user;
};

export const updateAvatar = async (userId, avatarUrl) => {
  return prisma.user.update({ where: { id: userId }, data: { avatarUrl }, include: { settings: true } });
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const matches = user && await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    const error = new Error('Current password is incorrect');
    error.status = 400;
    error.code = 'INVALID_CURRENT_PASSWORD';
    throw error;
  }

  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(newPassword, 10), tokenVersion: { increment: 1 } },
  });
};

export const getAccountSummary = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, _count: { select: { clothingItems: true, outfits: true } } },
  });
  return { memberSince: user.createdAt, wardrobeItems: user._count.clothingItems, outfits: user._count.outfits };
};

export const deleteUserAccount = async (userId, confirmEmail) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user || user.email.toLowerCase() !== confirmEmail.toLowerCase()) {
    const error = new Error('Enter your account email exactly to confirm deletion');
    error.status = 400;
    error.code = 'DELETE_CONFIRMATION_MISMATCH';
    throw error;
  }
  await prisma.user.delete({ where: { id: userId } });
};

/**
 * Generates an encrypted reset token, logs it, and returns the raw token.
 * @param {String} email - Email address
 * @returns {String|null} raw reset token
 */
export const generatePasswordReset = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return null; // Silent skip to prevent registration fishing
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetExpires = new Date(Date.now() + 3600000); // 1 hour expiration limit

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedResetToken,
      passwordResetExpires: resetExpires,
    },
  });

  return resetToken;
};

/**
 * Validates a reset token and applies a new password string, increments token version.
 * @param {String} rawToken - Token payload
 * @param {String} newPassword - New password string
 */
export const resetPassword = async (rawToken, newPassword) => {
  const hashedResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedResetToken,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    const error = new Error('Password reset token is invalid or has expired');
    error.status = 400;
    error.code = 'INVALID_RESET_TOKEN';
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  return await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      tokenVersion: { increment: 1 }, // Logout everywhere on reset
    },
  });
};
