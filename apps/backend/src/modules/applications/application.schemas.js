import { z } from 'zod';

export const VEHICLE_TYPES = [
  'small_car_hatchback',
  'large_car_sedan',
  'small_van',
  'large_van',
];

export const createApplicationSchema = z.object({
  jobSlug: z.string().min(1).trim(),
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .transform((e) => e.toLowerCase()),
  phone: z.string().trim().min(8, 'Phone number is too short'),
  vehicleType: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.enum(VEHICLE_TYPES).optional()
  ),
  vehicleDetails: z.string().trim().max(2000).optional().nullable(),
  addressLine1: z.string().trim().max(500).optional().nullable(),
  addressLine2: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().max(200).optional().nullable(),
  postcode: z.string().trim().max(50).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  source: z.string().trim().max(100).optional().default('job_portal'),
});

export const updateApplicationNotesSchema = z.object({
  notes: z.string().trim().max(20000).nullable().optional(),
});

export const addApplicationNoteSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});

export function formatZodError(error) {
  if (!error?.issues?.length) return 'Validation failed';
  return error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
}
