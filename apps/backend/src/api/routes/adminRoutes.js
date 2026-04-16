import express from 'express';
import { 
  getAdminDashboardData, 
  getAdminData,
  updateApplicationStatus, 
  deleteApplication, 
  getAllAdmins, 
  setAdmin,
  getAllFeeStructures,
  upsertFeeStructures,
  deleteFeeStructuresForCity,
  getAllFacilities,
  upsertFacility,
  deleteFacility,
  pollContractStatusHandler,
} from '../controllers/adminController.js';
import { authenticateToken, authorizeAdmin } from '../middleware/authMiddleware.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  pollContractStatusSchema,
  setAdminSchema,
  upsertFacilitySchema,
  updateApplicationStatusSchema,
  upsertFeeStructuresSchema,
} from '../schemas/admin.schemas.js';

const router = express.Router();

// Apply auth and admin middleware to all admin routes
router.use(authenticateToken);
router.use(authorizeAdmin);

router.get('/me', asyncHandler(getAdminData));
router.get('/dashboard', asyncHandler(getAdminDashboardData));
router.put('/update-status', validate(updateApplicationStatusSchema), asyncHandler(updateApplicationStatus));
router.delete('/application/:email', asyncHandler(deleteApplication));
router.get('/admins', asyncHandler(getAllAdmins));
router.post('/set-admin', validate(setAdminSchema), asyncHandler(setAdmin));
router.get('/fee-structures', asyncHandler(getAllFeeStructures));
router.put('/fee-structures', validate(upsertFeeStructuresSchema), asyncHandler(upsertFeeStructures));
router.delete('/fee-structures/:city', asyncHandler(deleteFeeStructuresForCity));
router.get('/facilities', asyncHandler(getAllFacilities));
router.put('/facilities', validate(upsertFacilitySchema), asyncHandler(upsertFacility));
router.delete('/facilities/:facilityCode', asyncHandler(deleteFacility));
router.post('/contract/poll-status', validate(pollContractStatusSchema), asyncHandler(pollContractStatusHandler));

export default router;
