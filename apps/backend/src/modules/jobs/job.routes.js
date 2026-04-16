import express from 'express';
import {
  closeJobHandler,
  createJobHandler,
  createLinkHandler,
  deactivateLinkHandler,
  deleteJobHandler,
  getJobById,
  listJobs,
  listLinksHandler,
  publishJobHandler,
  unpublishJobHandler,
  updateJobHandler,
} from './job.controller.js';
import asyncHandler from '../../api/middleware/asyncHandler.js';
import { REGION_MUTATE_ROLES, requireDbAdminRoles } from '../../api/middleware/adminRoleMiddleware.js';
import { cacheMiddleware, invalidateCacheOnSuccess } from '../../api/middleware/cache.js';
import { validate } from '../../api/middleware/validate.js';
import { createJobSchema, createPublicLinkSchema, publishJobSchema, updateJobSchema } from './job.schemas.js';

const router = express.Router();
const mutate = requireDbAdminRoles(...REGION_MUTATE_ROLES);

router.get('/', cacheMiddleware('jobs', 60), asyncHandler(listJobs));
router.post(
  '/',
  mutate,
  validate(createJobSchema),
  invalidateCacheOnSuccess(['jobs', 'analytics']),
  asyncHandler(createJobHandler)
);
router.delete('/links/:linkId', mutate, invalidateCacheOnSuccess(['jobs']), asyncHandler(deactivateLinkHandler));
router.get('/:id/links', asyncHandler(listLinksHandler));
router.post(
  '/:id/links',
  mutate,
  validate(createPublicLinkSchema),
  invalidateCacheOnSuccess(['jobs']),
  asyncHandler(createLinkHandler)
);
router.post(
  '/:id/publish',
  mutate,
  validate(publishJobSchema),
  invalidateCacheOnSuccess(['jobs', 'analytics']),
  asyncHandler(publishJobHandler)
);
router.post(
  '/:id/unpublish',
  mutate,
  validate(publishJobSchema),
  invalidateCacheOnSuccess(['jobs', 'analytics']),
  asyncHandler(unpublishJobHandler)
);
router.post(
  '/:id/close',
  mutate,
  validate(publishJobSchema),
  invalidateCacheOnSuccess(['jobs', 'analytics']),
  asyncHandler(closeJobHandler)
);
router.get('/:id', asyncHandler(getJobById));
router.put(
  '/:id',
  mutate,
  validate(updateJobSchema),
  invalidateCacheOnSuccess(['jobs', 'analytics']),
  asyncHandler(updateJobHandler)
);
router.delete('/:id', mutate, invalidateCacheOnSuccess(['jobs', 'analytics']), asyncHandler(deleteJobHandler));

export default router;
