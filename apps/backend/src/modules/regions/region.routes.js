import express from 'express';
import {
  createRegionHandler,
  deleteRegionHandler,
  getRegionById,
  listRegions,
  updateRegionHandler,
} from './region.controller.js';
import asyncHandler from '../../api/middleware/asyncHandler.js';
import { validate } from '../../api/middleware/validate.js';
import { cacheMiddleware, invalidateCacheOnSuccess } from '../../api/middleware/cache.js';
import {
  REGION_CREATE_ROLES,
  REGION_DELETE_ROLES,
  REGION_MUTATE_ROLES,
  requireDbAdminRoles,
} from '../../api/middleware/adminRoleMiddleware.js';
import { createRegionSchema, updateRegionSchema } from './region.schemas.js';

const router = express.Router();

router.get('/', cacheMiddleware('regions', 300), asyncHandler(listRegions));
router.get('/:id', asyncHandler(getRegionById));
router.post(
  '/',
  requireDbAdminRoles(...REGION_CREATE_ROLES),
  validate(createRegionSchema),
  invalidateCacheOnSuccess(['regions', 'jobs', 'documentRequirements', 'questionnaires', 'analytics']),
  asyncHandler(createRegionHandler)
);
router.put(
  '/:id',
  requireDbAdminRoles(...REGION_MUTATE_ROLES),
  validate(updateRegionSchema),
  invalidateCacheOnSuccess(['regions', 'jobs', 'documentRequirements', 'questionnaires', 'analytics']),
  asyncHandler(updateRegionHandler)
);
router.delete(
  '/:id',
  requireDbAdminRoles(...REGION_DELETE_ROLES),
  invalidateCacheOnSuccess(['regions', 'jobs', 'documentRequirements', 'questionnaires', 'analytics']),
  asyncHandler(deleteRegionHandler)
);

export default router;
