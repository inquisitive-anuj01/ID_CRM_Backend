import { z } from 'zod';

export const createFollowupSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  nextFollowupDate: z.string().min(1, 'Next followup date is required'),
  comment: z.string().optional(),
});

export const updateFollowupSchema = z.object({
  category: z.string().optional(),
  nextFollowupDate: z.string().optional(),
  comment: z.string().optional(),
});
