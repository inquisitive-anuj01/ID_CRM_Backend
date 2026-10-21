import { z } from 'zod';

export const createStatusSchema = z.object({
  key: z.string().min(1).trim().toLowerCase(),
  name: z.string().min(1).trim(),
  color: z.string().optional(),
  order: z.number().optional(),
  isTerminal: z.boolean().optional(),
  requiresReason: z.boolean().optional(),
});

export const updateStatusSchema = z.object({
  key: z.string().min(1).trim().toLowerCase().optional(),
  name: z.string().min(1).trim().optional(),
  color: z.string().optional(),
  order: z.number().optional(),
  isTerminal: z.boolean().optional(),
  requiresReason: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const reorderStatusSchema = z.object({
  order: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
    })
  ),
});

export const reorderGenericSchema = reorderStatusSchema;

export const createSourceSchema = z.object({
  name: z.string().min(1).trim(),
  type: z.enum(['online', 'offline']).default('online'),
});

export const updateSourceSchema = z.object({
  name: z.string().min(1).trim().optional(),
  type: z.enum(['online', 'offline']).optional(),
  isActive: z.boolean().optional(),
});

export const createLabelSchema = z.object({
  name: z.string().min(1).trim(),
  color: z.string().optional(),
  defaultAmount: z.number().nonnegative().optional(),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).trim().optional(),
  color: z.string().optional(),
  defaultAmount: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).trim(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).trim().optional(),
  isActive: z.boolean().optional(),
});

export const updateSettingSchema = z.object({
  allowedMinutes: z.number().positive().optional(),
  graceMinutes: z.number().nonnegative().optional(),
  staffCanDeleteOwnLead: z.boolean().optional(),
  staffFollowupEditWindowMinutes: z.number().positive().optional(),
});
