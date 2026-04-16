import express from 'express';
import { submitApplicationHandler } from './application.controller.js';
import asyncHandler from '../../api/middleware/asyncHandler.js';
import { validate } from '../../api/middleware/validate.js';
import { createApplicationSchema } from './application.schemas.js';

const router = express.Router();

router.post('/', validate(createApplicationSchema), asyncHandler(submitApplicationHandler));

export default router;
