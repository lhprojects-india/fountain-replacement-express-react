import express from 'express';
import multer from 'multer';
import {
  createAndLinkDropboxTemplateHandler,
  createContractTemplateHandler,
  deleteContractTemplateHandler,
  getDropboxTemplateEditUrlHandler,
  getContractTemplateById,
  getTemplatePdfFileHandler,
  getTemplatePdfDownloadUrlHandler,
  getTemplatePdfUploadUrlHandler,
  uploadTemplatePdfHandler,
  listByCity,
  listContractTemplates,
  removeDropboxTemplateHandler,
  saveTemplateFieldsHandler,
  updateContractTemplateHandler,
} from './contract.controller.js';
import asyncHandler from '../../api/middleware/asyncHandler.js';
import { REGION_MUTATE_ROLES, requireDbAdminRoles } from '../../api/middleware/adminRoleMiddleware.js';
import { validate } from '../../api/middleware/validate.js';
import {
  createContractSchema,
  createDropboxTemplateSchema,
  updateContractSchema,
} from './contract.schemas.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

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
router.post(
  '/:id/dropbox-sign-template',
  requireDbAdminRoles(...REGION_MUTATE_ROLES),
  upload.single('templateFile'),
  validate(createDropboxTemplateSchema),
  asyncHandler(createAndLinkDropboxTemplateHandler)
);
router.get(
  '/:id/dropbox-sign-template/edit-url',
  requireDbAdminRoles(...REGION_MUTATE_ROLES),
  asyncHandler(getDropboxTemplateEditUrlHandler)
);
router.delete(
  '/:id/dropbox-sign-template',
  requireDbAdminRoles(...REGION_MUTATE_ROLES),
  asyncHandler(removeDropboxTemplateHandler)
);
// Mock template editor routes
router.get('/:id/pdf-upload-url', requireDbAdminRoles(...REGION_MUTATE_ROLES), asyncHandler(getTemplatePdfUploadUrlHandler));
router.get('/:id/pdf', requireDbAdminRoles(...REGION_MUTATE_ROLES), asyncHandler(getTemplatePdfFileHandler));
router.post(
  '/:id/pdf-upload',
  requireDbAdminRoles(...REGION_MUTATE_ROLES),
  upload.single('templateFile'),
  asyncHandler(uploadTemplatePdfHandler)
);
router.get('/:id/pdf-download-url', requireDbAdminRoles(...REGION_MUTATE_ROLES), asyncHandler(getTemplatePdfDownloadUrlHandler));
router.put('/:id/fields', requireDbAdminRoles(...REGION_MUTATE_ROLES), asyncHandler(saveTemplateFieldsHandler));
router.delete('/:id', requireDbAdminRoles(...REGION_MUTATE_ROLES), asyncHandler(deleteContractTemplateHandler));

export default router;
