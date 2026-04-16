import { z } from 'zod';

export const updatePersonalDetailsSchema = z.object({
  name: z.string().trim().max(255).optional(),
  phone: z.string().trim().max(50).optional(),
  city: z.string().trim().max(255).optional(),
  lastRoute: z.string().trim().max(200).optional(),
  lastRouteUpdatedAt: z.string().trim().optional(),
  smokingStatus: z.union([z.string(), z.boolean()]).optional(),
  hasPhysicalDifficulties: z.boolean().optional(),
  status: z.string().trim().max(100).optional(),
  adminNotes: z.string().max(5000).optional(),
  onboardingStatus: z.string().trim().max(100).optional(),
  step: z.string().trim().max(100).optional(),
  selectedFacilities: z.array(z.string().trim().min(1)).optional(),
}).passthrough();

export const saveAvailabilitySchema = z.object({
  availability: z.record(z.any()),
});

export const saveVerificationSchema = z.object({
  vehicle: z.string().trim().max(255).optional(),
  licensePlate: z.string().trim().max(100).optional(),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(255).optional(),
}).passthrough();

export const updateProgressSchema = z.object({
  step: z.string().trim().min(1),
  data: z.any().optional(),
});

export const completeOnboardingSchema = z.object({}).strict();

export const acknowledgePolicySchema = z.object({}).strict();
