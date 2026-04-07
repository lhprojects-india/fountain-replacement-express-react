import express from 'express';
import { 
  getDriverData, 
  updatePersonalDetails, 
  saveAvailability, 
  saveVerification, 
  updateProgress, 
  acknowledgePolicy, 
  completeOnboarding 
} from '../controllers/driverController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all driver routes
router.use(authenticateToken);

router.get('/me', getDriverData);
router.put('/personal-details', updatePersonalDetails);
router.post('/availability', saveAvailability);
router.post('/verification', saveVerification);
router.post('/progress', updateProgress);
router.post('/acknowledge/:policy', acknowledgePolicy);
router.post('/complete-onboarding', completeOnboarding);

export default router;
