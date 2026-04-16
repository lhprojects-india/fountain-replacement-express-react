import { z } from 'zod';

const optionalText = z.string().trim().min(1).max(1000).optional();

export const transitionApplicationSchema = z.object({
  toStage: z.string().trim().min(1),
  reason: optionalText,
  metadata: z.record(z.any()).optional(),
});

export const bulkTransitionApplicationsSchema = z.object({
  applicationIds: z.array(z.union([z.number().int().positive(), z.string().trim().min(1)])).min(1),
  toStage: z.string().trim().min(1),
  reason: optionalText,
  metadata: z.record(z.any()).optional(),
});

export const reopenApplicationSchema = z.object({
  reason: optionalText,
});
