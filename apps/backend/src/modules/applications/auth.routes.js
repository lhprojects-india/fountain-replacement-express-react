import express from 'express';
import { authenticateToken } from '../../api/middleware/authMiddleware.js';
import asyncHandler from '../../api/middleware/asyncHandler.js';
import { validate } from '../../api/middleware/validate.js';
import { requestCodeHandler, sessionHandler, verifyCodeHandler } from './auth.controller.js';
import { requestCodeSchema, verifyCodeSchema } from './auth.schemas.js';

const router = express.Router();

router.post('/request-code', validate(requestCodeSchema), asyncHandler(requestCodeHandler));
router.post('/verify-code', validate(verifyCodeSchema), asyncHandler(verifyCodeHandler));
router.get('/session', authenticateToken, asyncHandler(sessionHandler));

export default router;
