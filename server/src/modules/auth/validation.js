import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address format'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  gender: z.string().max(40).optional().nullable(),
  heightCm: z.coerce.number().positive().max(300).optional().nullable(),
  weightKg: z.coerce.number().positive().max(500).optional().nullable(),
  bodyType: z.string().max(40).optional().nullable(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
  gender: z.string().max(40).optional().nullable(),
  heightCm: z.coerce.number().positive().max(300).optional().nullable(),
  weightKg: z.coerce.number().positive().max(500).optional().nullable(),
  bodyType: z.string().max(40).optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
