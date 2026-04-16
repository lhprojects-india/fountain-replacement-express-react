import express from 'express';
import { validate } from '../middleware/validate.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { 
  getDriverData, 
  updatePersonalDetails, 
  saveAvailability, 
  saveVerification, 
  updateProgress, 
  acknowledgePolicy, 
  completeOnboarding,
  getFacilitiesByCity,
} from '../controllers/driverController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  acknowledgePolicySchema,
  completeOnboardingSchema,
  saveAvailabilitySchema,
  saveVerificationSchema,
  updatePersonalDetailsSchema,
  updateProgressSchema,
} from '../schemas/driver.schemas.js';

const router = express.Router();

// Apply auth middleware to all driver routes
router.use(authenticateToken);

router.get('/me', asyncHandler(getDriverData));
router.put('/personal-details', validate(updatePersonalDetailsSchema), asyncHandler(updatePersonalDetails));
router.post('/availability', validate(saveAvailabilitySchema), asyncHandler(saveAvailability));
router.post('/verification', validate(saveVerificationSchema), asyncHandler(saveVerification));
router.post('/progress', validate(updateProgressSchema), asyncHandler(updateProgress));
router.post('/acknowledge/:policy', validate(acknowledgePolicySchema), asyncHandler(acknowledgePolicy));
router.post('/complete-onboarding', validate(completeOnboardingSchema), asyncHandler(completeOnboarding));
router.get('/facilities', asyncHandler(getFacilitiesByCity));

export default router;
