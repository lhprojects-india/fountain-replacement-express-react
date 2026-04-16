import { z } from 'zod';

export const submitPaymentDetailsSchema = z.object({
  details: z.record(z.any()),
});

export const verifyPaymentDetailsSchema = z.object({}).strict();
