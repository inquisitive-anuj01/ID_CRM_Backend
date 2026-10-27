import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  mobile: z.string().optional(),
  role: z.enum(['admin', 'staff', 'manager']).default('staff'),
  designation: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).trim().optional(),
  email: z.string().email('Invalid email').optional(),
  mobile: z.string().optional(),
  designation: z.string().optional(),
  role: z.enum(['admin', 'staff', 'manager']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

export const userStatusSchema = z.object({
  isActive: z.boolean(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const reassignLeadsSchema = z.object({
  toUserId: z.string().min(1, 'Target user is required'),
});
