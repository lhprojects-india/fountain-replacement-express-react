import express from 'express';
import {
  createContractTemplateHandler,
  deleteContractTemplateHandler,
  getContractTemplateById,
  linkDocusealTemplateHandler,
  listAvailableDocusealTemplatesHandler,
  listByCity,
  listContractTemplates,
  unlinkDocusealTemplateHandler,
  updateContractTemplateHandler,
} from './contract.controller.js';
import asyncHandler from '../../api/middleware/asyncHandler.js';
import { REGION_MUTATE_ROLES, requireDbAdminRoles } from '../../api/middleware/adminRoleMiddleware.js';
import { validate } from '../../api/middleware/validate.js';
import {
  createContractSchema,
  linkDocusealTemplateSchema,
  updateContractSchema,
} from './contract.schemas.js';

const router = express.Router();

router.get('/', asyncHandler(listContractTemplates));
router.get('/docuseal/templates', asyncHandler(listAvailableDocusealTemplatesHandler));
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
router.post(
  '/:id/docuseal-template',
  requireDbAdminRoles(...REGION_MUTATE_ROLES),
  validate(linkDocusealTemplateSchema),
  asyncHandler(linkDocusealTemplateHandler)
);
router.delete(
  '/:id/docuseal-template',
  requireDbAdminRoles(...REGION_MUTATE_ROLES),
  asyncHandler(unlinkDocusealTemplateHandler)
);
router.delete('/:id', requireDbAdminRoles(...REGION_MUTATE_ROLES), asyncHandler(deleteContractTemplateHandler));

export default router;
