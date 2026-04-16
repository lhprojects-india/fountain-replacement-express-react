import express from 'express';
import {
  createContractTemplateHandler,
  deleteContractTemplateHandler,
  getContractTemplateById,
  listByCity,
  listContractTemplates,
  updateContractTemplateHandler,
} from './contract.controller.js';
import asyncHandler from '../../api/middleware/asyncHandler.js';
import { REGION_MUTATE_ROLES, requireDbAdminRoles } from '../../api/middleware/adminRoleMiddleware.js';
import { validate } from '../../api/middleware/validate.js';
import { createContractSchema, updateContractSchema } from './contract.schemas.js';

const router = express.Router();

router.get('/', asyncHandler(listContractTemplates));
router.get('/city/:cityId', asyncHandler(listByCity));
router.get('/:id', asyncHandler(getContractTemplateById));
router.post(
  '/',
  requireDbAdminRoles(...REGION_MUTATE_ROLES),
  validate(createContractSchema),
  asyncHandler(createContractTemplateHandler)
);
router.put(
  '/:id',
  requireDbAdminRoles(...REGION_MUTATE_ROLES),
  validate(updateContractSchema),
  asyncHandler(updateContractTemplateHandler)
);
router.delete('/:id', requireDbAdminRoles(...REGION_MUTATE_ROLES), asyncHandler(deleteContractTemplateHandler));

export default router;
