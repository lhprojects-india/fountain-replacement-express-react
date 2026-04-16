import { z } from 'zod';

const optionalText = z.string().trim().min(1).max(5000).optional();

export const emptyBodySchema = z.object({}).strict();

export const approveApplicationSchema = z.object({
  notes: optionalText,
});

export const rejectApplicationSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
  notes: optionalText,
});

export const scheduleCallSchema = z.object({
  scheduledAt: z.string().trim().min(1),
});

export const completeCallSchema = z.object({
  notes: optionalText,
});

export const rescheduleCallSchema = z.object({
  scheduledAt: z.string().trim().min(1),
  reason: optionalText,
});

export const markCallNoShowSchema = z.object({
  action: z.enum(['reschedule', 'skip', 'mark_failed']),
  scheduledAt: z.string().trim().min(1).optional(),
  reason: optionalText,
});

export const assignFirstBlockSchema = z
  .object({
    date: z.string().trim().min(1).optional(),
    blockDate: z.string().trim().min(1).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .refine((data) => Boolean(data.date || data.blockDate), {
    message: 'date or blockDate is required',
    path: ['date'],
  });

export const firstBlockResultSchema = z.object({
  result: z.enum(['passed', 'failed', 'no_show', 'rescheduled']),
  notes: optionalText,
});

export const rescheduleFirstBlockSchema = z
  .object({
    date: z.string().trim().min(1).optional(),
    newDate: z.string().trim().min(1).optional(),
    reason: optionalText,
  })
  .refine((data) => Boolean(data.date || data.newDate), {
    message: 'date or newDate is required',
    path: ['date'],
  });
