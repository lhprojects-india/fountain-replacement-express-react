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
  getAllFacilities
} from '../controllers/adminController.js';
import { authenticateToken, authorizeAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth and admin middleware to all admin routes
router.use(authenticateToken);
router.use(authorizeAdmin);

router.get('/me', getAdminData);
router.get('/dashboard', getAdminDashboardData);
router.put('/update-status', updateApplicationStatus);
router.delete('/application/:email', deleteApplication);
router.get('/admins', getAllAdmins);
router.post('/set-admin', setAdmin);
router.get('/fee-structures', getAllFeeStructures);
router.put('/fee-structures', upsertFeeStructures);
router.delete('/fee-structures/:city', deleteFeeStructuresForCity);
router.get('/facilities', getAllFacilities);

export default router;
