import { z } from 'zod';

const questionOptionSchema = z.object({
  label: z.string().trim().min(1).max(255),
  value: z.string().trim().min(1).max(255),
  isCorrect: z.boolean().optional(),
});

const questionnaireQuestionSchema = z.object({
  questionText: z.string().trim().min(1).max(5000),
  questionType: z.string().trim().min(1).max(100).optional(),
  options: z.array(questionOptionSchema).optional(),
  points: z.coerce.number().positive().optional(),
  sortOrder: z.coerce.number().int().positive().optional(),
});

export const createQuestionnaireSchema = z.object({
  cityId: z.coerce.number().int().positive().optional().nullable(),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  passingScore: z.coerce.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  questions: z.array(questionnaireQuestionSchema).min(1),
});

export const updateQuestionnaireSchema = createQuestionnaireSchema.partial();

export const submitDriverQuestionnaireSchema = z.object({
  questionnaireId: z.coerce.number().int().positive(),
  answers: z.record(z.any()),
});
