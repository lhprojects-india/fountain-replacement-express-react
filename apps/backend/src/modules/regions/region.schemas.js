import { z } from 'zod';

const paymentFieldsSchemaField = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean().optional(),
});

export const paymentFieldsSchemaJson = z
  .object({
    fields: z.array(paymentFieldsSchemaField).optional(),
  })
  .passthrough()
  .optional()
  .nullable();

export const createRegionSchema = z.object({
  name: z.string().min(1).max(255),
  code: z
    .string()
    .min(2)
    .max(3)
    .transform((s) => s.trim().toUpperCase()),
  currency: z.string().min(1).max(10),
  currencySymbol: z.string().min(1).max(10),
  timezone: z.string().min(1).max(100),
  paymentFieldsSchema: paymentFieldsSchemaJson,
  paymentPreset: z.string().optional(),
  seedDocumentDefaults: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updateRegionSchema = createRegionSchema.partial();

export function formatZodError(error) {
  if (!error?.issues?.length) return 'Validation failed';
  return error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
}
