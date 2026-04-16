import express from 'express';
import { invalidateCacheOnSuccess } from '../../api/middleware/cache.js';
import asyncHandler from '../../api/middleware/asyncHandler.js';
import { validate } from '../../api/middleware/validate.js';
import {
  completeScreeningHandler,
  getApplicationFeeStructureHandler,
  getApplicationCityConfigHandler,
  getDriverApplicationHandler,
  getDriverApplicationStageInfoHandler,
  getDriverApplicationTimelineHandler,
  getScreeningProgressHandler,
  resendDriverContractHandler,
  updateApplicationProfileHandler,
  vehicleCheckHandler,
  withdrawDriverApplicationHandler,
} from './driver-application.controller.js';
import {
  completeScreeningSchema,
  resendContractSchema,
  updateApplicationProfileSchema,
  vehicleCheckSchema,
  withdrawApplicationSchema,
} from './driver-application.schemas.js';

const router = express.Router();

router.get('/application', asyncHandler(getDriverApplicationHandler));
router.post(
  '/application/withdraw',
  validate(withdrawApplicationSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(withdrawDriverApplicationHandler)
);
router.get('/application/timeline', asyncHandler(getDriverApplicationTimelineHandler));
router.get('/application/stage-info', asyncHandler(getDriverApplicationStageInfoHandler));
router.get('/application/screening', asyncHandler(getScreeningProgressHandler));
router.post(
  '/application/screening/complete',
  validate(completeScreeningSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(completeScreeningHandler)
);
router.post(
  '/application/screening/vehicle-check',
  validate(vehicleCheckSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(vehicleCheckHandler)
);
router.put(
  '/application/profile',
  validate(updateApplicationProfileSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(updateApplicationProfileHandler)
);
router.get('/application/fee-structure', asyncHandler(getApplicationFeeStructureHandler));
router.get('/application/city-config', asyncHandler(getApplicationCityConfigHandler));
router.post(
  '/application/contract/resend',
  validate(resendContractSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(resendDriverContractHandler)
);

export default router;
