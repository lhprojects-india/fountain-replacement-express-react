import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const adminGoogleLoginSchema = z.object({
  idToken: z.string().min(1),
});

export const checkFountainEmailSchema = z.object({
  email: z.string().trim().email(),
});

export const verifyApplicantPhoneSchema = z.object({
  email: z.string().trim().email(),
  phone: z.string().trim().min(6),
});
