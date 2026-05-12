import { z } from 'zod';

/** Treats '', null, and whitespace-only as undefined so optional notes validate. */
function optionalTrimmedText(maxLen) {
  return z.preprocess(
    (val) => {
      if (val === undefined || val === null) return undefined;
      if (typeof val !== 'string') return val;
      const t = val.trim();
      return t === '' ? undefined : t;
    },
    z.string().min(1).max(maxLen).optional()
  );
}

export const transitionApplicationSchema = z.object({
  toStage: z.string().trim().min(1),
  reason: optionalTrimmedText(1000),
  metadata: z.record(z.any()).optional(),
});

export const bulkTransitionApplicationsSchema = z.object({
  applicationIds: z.array(z.union([z.number().int().positive(), z.string().trim().min(1)])).min(1),
  toStage: z.string().trim().min(1),
  reason: optionalTrimmedText(1000),
  metadata: z.record(z.any()).optional(),
});

export const reopenApplicationSchema = z.object({
  reason: optionalTrimmedText(1000),
});
