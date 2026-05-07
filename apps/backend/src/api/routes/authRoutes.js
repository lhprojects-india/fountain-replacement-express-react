import express from 'express';
import {
  adminLogin,
  checkFountainEmail,
  verifyApplicantPhone,
} from '../controllers/authController.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  adminLoginSchema,
  checkFountainEmailSchema,
  verifyApplicantPhoneSchema,
} from '../schemas/auth.schemas.js';

const router = express.Router();

router.post('/check-email', validate(checkFountainEmailSchema), asyncHandler(checkFountainEmail));
router.post('/verify-phone', validate(verifyApplicantPhoneSchema), asyncHandler(verifyApplicantPhone));
router.post('/admin-login', validate(adminLoginSchema), asyncHandler(adminLogin));

export default router;
