import { z } from 'zod';

export const updateApplicationStatusSchema = z.object({
  email: z.string().trim().email(),
  status: z.string().trim().min(1).max(100),
  adminNotes: z.string().max(5000).optional().nullable(),
});

export const setAdminSchema = z.object({
  email: z.string().trim().email(),
  role: z.string().trim().min(1).max(100),
  name: z.string().trim().max(255).optional().nullable(),
});

export const upsertFeeStructuresSchema = z.object({
  city: z.string().trim().min(1).max(255),
}).passthrough();

export const upsertFacilitySchema = z.object({
  city: z.string().trim().min(1).max(255),
  facility: z.string().trim().min(1).max(50),
  address: z.string().trim().min(1).max(1000),
});

export const pollContractStatusSchema = z.object({}).strict();
