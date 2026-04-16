import express from 'express';
import { getPublicJobBySlug } from './job.controller.js';
import asyncHandler from '../../api/middleware/asyncHandler.js';

const router = express.Router();

router.get('/:slug', asyncHandler(getPublicJobBySlug));

export default router;
