import { z } from 'zod';

export const createLeadSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').trim(),
  countryCode: z.string().default('+91'),
  mobile: z.string().min(5, 'Valid mobile number required').trim(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  companyName: z.string().trim().optional(),
  address: z.string().trim().optional(),
  comment: z.string().optional(),
  reference: z.string().optional(),
  leadDate: z.string().datetime().optional().or(z.string().date().optional()),

  source: z.string().optional(),
  status: z.string().default('new'),
  labels: z
    .array(
      z.object({
        label: z.string(),
        amount: z.number().nonnegative().default(0),
      })
    )
    .optional()
    .default([]),
  estimateAmount: z.number().nonnegative().optional(),
  rating: z.number().min(0).max(5).default(0),
  assignedTo: z.string().optional(),
});

export const updateLeadSchema = z.object({
  customerName: z.string().min(1).trim().optional(),
  countryCode: z.string().optional(),
  mobile: z.string().min(5).trim().optional(),
  email: z.string().email().optional().or(z.literal('')),
  companyName: z.string().trim().optional(),
  address: z.string().trim().optional(),
  comment: z.string().optional(),
  reference: z.string().optional(),
  leadDate: z.string().datetime().optional().or(z.string().date().optional()),
  source: z.string().optional(),
  estimateAmount: z.number().nonnegative().optional(),
  rating: z.number().min(0).max(5).optional(),
});

export const updateStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  cancelReason: z.string().optional(),
});

export const assignLeadSchema = z.object({
  userId: z.string().min(1, 'Target userId is required'),
});

export const updateLabelsSchema = z.object({
  labels: z.array(
    z.object({
      label: z.string(),
      amount: z.number().nonnegative().default(0),
    })
  ),
});

export const updateRatingSchema = z.object({
  rating: z.number().min(0).max(5),
});

export const bulkAssignSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one lead ID is required'),
  userId: z.string().min(1, 'Target userId is required'),
});

export const bulkStatusSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one lead ID is required'),
  status: z.string().min(1, 'Status is required'),
  cancelReason: z.string().optional(),
});
