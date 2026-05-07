import { z } from 'zod';

export const CONTRACT_TYPES = ['full_time', 'part_time', 'contractor'];

export const createContractSchema = z.object({
  cityId: z.coerce.number().int().positive(),
  name: z.string().min(1).max(255),
  type: z.enum(CONTRACT_TYPES),
  /** Optional until Dropbox Sign is configured */
  dropboxSignTemplateId: z.string().max(255).optional().nullable(),
  content: z.string().max(500000).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateContractSchema = createContractSchema.partial().omit({ cityId: true });

export const createDropboxTemplateSchema = z.object({
  templateTitle: z.string().min(1).max(255),
  signerRole: z.string().min(1).max(100).optional(),
});

const fieldSchema = z.object({
  id: z.string(),
  type: z.enum(['signature', 'initials', 'date', 'fullName', 'email', 'text', 'checkbox']),
  page: z.number().int().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  label: z.string().optional(),
  required: z.boolean().optional().default(true),
  signerRole: z.string().optional(),
});

export const saveTemplateFieldsSchema = z.object({
  fields: z.array(fieldSchema),
});

export function formatZodError(error) {
  if (!error?.issues?.length) return 'Validation failed';
  return error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
}
