import express from 'express';
import {
  createCityHandler,
  deleteCityHandler,
  getCityById,
  listCities,
  updateCityHandler,
} from './city.controller.js';
import asyncHandler from '../../api/middleware/asyncHandler.js';
import { validate } from '../../api/middleware/validate.js';
import { cacheMiddleware, invalidateCacheOnSuccess } from '../../api/middleware/cache.js';
import {
  REGION_CREATE_ROLES,
  REGION_DELETE_ROLES,
  REGION_MUTATE_ROLES,
  requireDbAdminRoles,
} from '../../api/middleware/adminRoleMiddleware.js';
import { createCitySchema, updateCitySchema } from './city.schemas.js';

const router = express.Router();

router.get('/', cacheMiddleware('cities', 300), asyncHandler(listCities));
router.get('/:id', asyncHandler(getCityById));
router.post(
  '/',
  requireDbAdminRoles(...REGION_CREATE_ROLES),
  validate(createCitySchema),
  invalidateCacheOnSuccess(['cities', 'jobs', 'documentRequirements', 'questionnaires', 'analytics']),
  asyncHandler(createCityHandler)
);
router.put(
  '/:id',
  requireDbAdminRoles(...REGION_MUTATE_ROLES),
  validate(updateCitySchema),
  invalidateCacheOnSuccess(['cities', 'jobs', 'documentRequirements', 'questionnaires', 'analytics']),
  asyncHandler(updateCityHandler)
);
router.delete(
  '/:id',
  requireDbAdminRoles(...REGION_DELETE_ROLES),
  invalidateCacheOnSuccess(['cities', 'jobs', 'documentRequirements', 'questionnaires', 'analytics']),
  asyncHandler(deleteCityHandler)
);

export default router;
