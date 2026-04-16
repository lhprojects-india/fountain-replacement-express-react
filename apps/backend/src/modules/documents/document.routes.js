import express from 'express';
import { cacheMiddleware, invalidateCacheOnSuccess } from '../../api/middleware/cache.js';
import logger from '../../lib/logger.js';
import asyncHandler from '../../api/middleware/asyncHandler.js';
import { validate } from '../../api/middleware/validate.js';
import {
  confirmUploadHandler,
  deleteOwnDocumentHandler,
  getApplicationDocumentContextHandler,
  getApplicationDocumentDownloadUrlHandler,
  getApplicationDocumentSummaryHandler,
  getOwnDocumentDownloadUrlHandler,
  listApplicationDocumentsHandler,
  listOwnDocumentsHandler,
  reuploadDocumentHandler,
  requestUploadUrlHandler,
  reviewAllDocumentsHandler,
  reviewDocumentHandler,
  submitDocumentsHandler,
} from './document.controller.js';
import {
  confirmUploadSchema,
  createRequirementSchema,
  requestUploadUrlSchema,
  reuploadDocumentSchema,
  reviewAllDocumentsSchema,
  reviewDocumentSchema,
  seedRequirementsSchema,
  submitDocumentsSchema,
  updateRequirementSchema,
} from './document.schemas.js';
import {
  createRequirement,
  deleteRequirement,
  DocumentRequirementServiceError,
  getRequirementsByCity,
  seedDefaultRequirements,
  updateRequirement,
} from './document-requirement.service.js';

const requirementRouter = express.Router();
const driverRoutes = express.Router();
const adminRoutes = express.Router();

function handleError(res, error) {
  if (error instanceof DocumentRequirementServiceError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  logger.error({ msg: 'Document requirements route error', error });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

requirementRouter.get(
  '/city/:cityId',
  cacheMiddleware('documentRequirements', 300),
  asyncHandler(async (req, res) => {
    try {
      const requirements = await getRequirementsByCity(req.params.cityId);
      return res.status(200).json({ success: true, requirements });
    } catch (error) {
      return handleError(res, error);
    }
  })
);

requirementRouter.delete('/:id', invalidateCacheOnSuccess(['documentRequirements']), asyncHandler(async (req, res) => {
  try {
    const result = await deleteRequirement(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}));

requirementRouter.post(
  '/seed/:cityId',
  validate(seedRequirementsSchema),
  invalidateCacheOnSuccess(['documentRequirements']),
  asyncHandler(async (req, res) => {
    try {
      const result = await seedDefaultRequirements(req.params.cityId);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      return handleError(res, error);
    }
  })
);

requirementRouter.post(
  '/',
  validate(createRequirementSchema),
  invalidateCacheOnSuccess(['documentRequirements']),
  asyncHandler(async (req, res) => {
    try {
      const requirement = await createRequirement(req.validatedBody || req.body);
      return res.status(201).json({ success: true, requirement });
    } catch (error) {
      return handleError(res, error);
    }
  })
);

requirementRouter.put(
  '/:id',
  validate(updateRequirementSchema),
  invalidateCacheOnSuccess(['documentRequirements']),
  asyncHandler(async (req, res) => {
    try {
      const requirement = await updateRequirement(req.params.id, req.validatedBody || req.body);
      return res.status(200).json({ success: true, requirement });
    } catch (error) {
      return handleError(res, error);
    }
  })
);

driverRoutes.post('/upload-url', validate(requestUploadUrlSchema), asyncHandler(requestUploadUrlHandler));
driverRoutes.post('/confirm', validate(confirmUploadSchema), asyncHandler(confirmUploadHandler));
driverRoutes.post('/submit', validate(submitDocumentsSchema), asyncHandler(submitDocumentsHandler));
driverRoutes.get('/', asyncHandler(listOwnDocumentsHandler));
driverRoutes.delete('/:id', asyncHandler(deleteOwnDocumentHandler));
driverRoutes.post('/:id/reupload', validate(reuploadDocumentSchema), asyncHandler(reuploadDocumentHandler));
driverRoutes.get('/:id/download', asyncHandler(getOwnDocumentDownloadUrlHandler));

adminRoutes.get('/:id/documents', asyncHandler(listApplicationDocumentsHandler));
adminRoutes.get('/:id/documents/summary', asyncHandler(getApplicationDocumentSummaryHandler));
adminRoutes.get('/:id/documents/:docId/download', asyncHandler(getApplicationDocumentDownloadUrlHandler));
adminRoutes.get('/:id/documents/:docId/context', asyncHandler(getApplicationDocumentContextHandler));
adminRoutes.put('/:id/documents/:docId/review', validate(reviewDocumentSchema), asyncHandler(reviewDocumentHandler));
adminRoutes.post('/:id/documents/review-all', validate(reviewAllDocumentsSchema), asyncHandler(reviewAllDocumentsHandler));

export { driverRoutes, adminRoutes };
export default requirementRouter;
