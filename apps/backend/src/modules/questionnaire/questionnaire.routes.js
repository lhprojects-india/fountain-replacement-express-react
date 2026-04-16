import express from 'express';
import { cacheMiddleware, invalidateCacheOnSuccess } from '../../api/middleware/cache.js';
import asyncHandler from '../../api/middleware/asyncHandler.js';
import { validate } from '../../api/middleware/validate.js';
import {
  createQuestionnaireHandler,
  deleteQuestionnaireHandler,
  getDriverQuestionnaireHandler,
  getDriverQuestionnaireResultHandler,
  getQuestionnaireHandler,
  listQuestionnairesHandler,
  submitDriverQuestionnaireHandler,
  updateQuestionnaireHandler,
} from './questionnaire.controller.js';
import {
  createQuestionnaireSchema,
  submitDriverQuestionnaireSchema,
  updateQuestionnaireSchema,
} from './questionnaire.schemas.js';

const adminQuestionnaireRoutes = express.Router();
const driverQuestionnaireRoutes = express.Router();

adminQuestionnaireRoutes.get('/', cacheMiddleware('questionnaires', 300), asyncHandler(listQuestionnairesHandler));
adminQuestionnaireRoutes.get('/:id', asyncHandler(getQuestionnaireHandler));
adminQuestionnaireRoutes.post(
  '/',
  validate(createQuestionnaireSchema),
  invalidateCacheOnSuccess(['questionnaires']),
  asyncHandler(createQuestionnaireHandler)
);
adminQuestionnaireRoutes.put(
  '/:id',
  validate(updateQuestionnaireSchema),
  invalidateCacheOnSuccess(['questionnaires']),
  asyncHandler(updateQuestionnaireHandler)
);
adminQuestionnaireRoutes.delete('/:id', invalidateCacheOnSuccess(['questionnaires']), asyncHandler(deleteQuestionnaireHandler));

driverQuestionnaireRoutes.get('/questionnaire', asyncHandler(getDriverQuestionnaireHandler));
driverQuestionnaireRoutes.post(
  '/questionnaire/submit',
  validate(submitDriverQuestionnaireSchema),
  asyncHandler(submitDriverQuestionnaireHandler)
);
driverQuestionnaireRoutes.get('/questionnaire/result', asyncHandler(getDriverQuestionnaireResultHandler));

export { adminQuestionnaireRoutes, driverQuestionnaireRoutes };
