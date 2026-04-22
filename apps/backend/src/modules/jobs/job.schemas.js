import { z } from 'zod';

export const createJobSchema = z.object({
  cityId: z.coerce.number().int().positive(),
  contractTemplateId: z.coerce.number().int().positive().optional().nullable(),
  title: z.string().min(1).max(500),
  description: z.string().max(100000).optional().nullable(),
  requirements: z.string().max(100000).optional().nullable(),
  requiresOwnVehicle: z.boolean().optional().default(false),
});

export const updateJobSchema = createJobSchema.partial();

// Publish/unpublish/close endpoints don't consume request body.
// Accept any JSON object (or missing body) for client compatibility,
// then normalize to an empty object for downstream handlers.
export const publishJobSchema = z.object({}).passthrough().default({}).transform(() => ({}));

export const createPublicLinkSchema = z.object({
  expiresAt: z.coerce.date().optional().nullable(),
});

export function formatZodError(error) {
  if (!error?.issues?.length) return 'Validation failed';
  return error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
}
