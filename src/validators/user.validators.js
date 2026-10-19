import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  mobile: z.string().optional(),
  role: z.enum(['admin', 'staff', 'manager']).default('staff'),
  designation: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).trim().optional(),
  mobile: z.string().optional(),
  designation: z.string().optional(),
  role: z.enum(['admin', 'staff', 'manager']).optional(),
});

export const userStatusSchema = z.object({
  isActive: z.boolean(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const reassignLeadsSchema = z.object({
  toUserId: z.string().min(1, 'Target user is required'),
});
