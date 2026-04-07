import express from 'express';
import { checkFountainEmail, verifyApplicantPhone, adminLogin, adminGoogleLogin } from '../controllers/authController.js';

const router = express.Router();

router.post('/check-email', checkFountainEmail);
router.post('/verify-phone', verifyApplicantPhone);
router.post('/admin-login', adminLogin);
router.post('/admin-google-login', adminGoogleLogin);

export default router;
