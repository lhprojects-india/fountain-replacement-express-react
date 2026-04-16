import { z } from 'zod';

export const templatePayloadSchema = z.object({
  eventKey: z.string().trim().min(1).max(255),
  channel: z.string().trim().min(1).max(50),
  locale: z.string().trim().max(20).optional(),
  subject: z.string().max(1000).nullable().optional(),
  body: z.string().min(1).max(500000),
  isActive: z.boolean().optional(),
});

export const updateTemplatePayloadSchema = templatePayloadSchema.partial();

export const previewTemplatePayloadSchema = z.object({
  variables: z.record(z.any()).optional(),
});

export const testSendTemplatePayloadSchema = z.object({
  recipient: z.string().trim().min(1),
  variables: z.record(z.any()).optional(),
});

export const retryLogPayloadSchema = z.object({}).strict();
