import express from 'express';
import asyncHandler from '../../api/middleware/asyncHandler.js';
import { validate } from '../../api/middleware/validate.js';
import {
  createTemplateHandler,
  deleteTemplateHandler,
  getCommunicationLogHandler,
  getCommunicationStatsHandler,
  getNotificationMatrixHandler,
  getTemplateById,
  listTemplates,
  previewTemplateHandler,
  retryCommunicationLogHandler,
  testSendTemplateHandler,
  updateTemplateHandler,
} from './communication.controller.js';
import {
  previewTemplatePayloadSchema,
  retryLogPayloadSchema,
  templatePayloadSchema,
  testSendTemplatePayloadSchema,
  updateTemplatePayloadSchema,
} from './communication.schemas.js';

const router = express.Router();

router.get('/templates', asyncHandler(listTemplates));
router.get('/templates/:id', asyncHandler(getTemplateById));
router.post('/templates', validate(templatePayloadSchema), asyncHandler(createTemplateHandler));
router.put('/templates/:id', validate(updateTemplatePayloadSchema), asyncHandler(updateTemplateHandler));
router.delete('/templates/:id', asyncHandler(deleteTemplateHandler));
router.post('/templates/:id/preview', validate(previewTemplatePayloadSchema), asyncHandler(previewTemplateHandler));
router.post('/templates/:id/test-send', validate(testSendTemplatePayloadSchema), asyncHandler(testSendTemplateHandler));
router.get('/notifications/matrix', asyncHandler(getNotificationMatrixHandler));
router.get('/stats', asyncHandler(getCommunicationStatsHandler));

router.get('/logs/:applicationId', asyncHandler(getCommunicationLogHandler));
router.post('/logs/:logId/retry', validate(retryLogPayloadSchema), asyncHandler(retryCommunicationLogHandler));

export default router;
