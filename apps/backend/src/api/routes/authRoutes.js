import express from 'express';
import {
  adminLogin,
  adminGoogleLogin,
  checkFountainEmail,
  verifyApplicantPhone,
} from '../controllers/authController.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  adminGoogleLoginSchema,
  adminLoginSchema,
  checkFountainEmailSchema,
  verifyApplicantPhoneSchema,
} from '../schemas/auth.schemas.js';

const router = express.Router();

router.post('/check-email', validate(checkFountainEmailSchema), asyncHandler(checkFountainEmail));
router.post('/verify-phone', validate(verifyApplicantPhoneSchema), asyncHandler(verifyApplicantPhone));
router.post('/admin-login', validate(adminLoginSchema), asyncHandler(adminLogin));
router.post('/admin-google-login', validate(adminGoogleLoginSchema), asyncHandler(adminGoogleLogin));

export default router;
