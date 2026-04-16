import { z } from 'zod';

export const requestCodeSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').transform((value) => value.toLowerCase()),
});

export const verifyCodeSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').transform((value) => value.toLowerCase()),
  code: z.string().trim().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
});
