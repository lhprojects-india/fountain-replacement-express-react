import { z } from 'zod';

const optionalNotes = z.string().trim().max(5000).optional().nullable();

export const createRequirementSchema = z.object({
  cityId: z.coerce.number().int().positive().optional(),
  regionId: z.coerce.number().int().positive().optional(),
  code: z.string().trim().max(100).optional(),
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).optional().nullable(),
  fileTypes: z.string().trim().max(500).optional(),
  isRequired: z.boolean().optional(),
  maxSizeMb: z.coerce.number().positive().optional(),
  maxDurationSec: z.coerce.number().int().positive().optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updateRequirementSchema = createRequirementSchema.partial();

export const seedRequirementsSchema = z.object({}).strict();

export const requestUploadUrlSchema = z.object({
  requirementCode: z.string().trim().min(1).max(100),
  fileName: z.string().trim().min(1).max(500),
  fileType: z.string().trim().min(1).max(100),
  fileSizeBytes: z.coerce.number().positive(),
});

export const confirmUploadSchema = z.object({
  documentId: z.coerce.number().int().positive(),
  durationSec: z.coerce.number().nonnegative().optional(),
});

export const submitDocumentsSchema = z.object({}).strict();

export const reuploadDocumentSchema = z.object({
  fileName: z.string().trim().min(1).max(500),
  fileType: z.string().trim().min(1).max(100),
  fileSizeBytes: z.coerce.number().positive(),
});

export const reviewDocumentSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: optionalNotes,
  checklist: z.record(z.any()).optional().nullable(),
});

export const reviewAllDocumentsSchema = z.object({
  decisions: z.array(
    z.object({
      docId: z.union([z.number().int().positive(), z.string().trim().min(1)]),
      status: z.enum(['approved', 'rejected']),
      notes: optionalNotes,
      checklist: z.record(z.any()).optional().nullable(),
    })
  ),
});
