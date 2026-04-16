import express from 'express';
import prisma from '../../lib/prisma.js';
import logger from '../../lib/logger.js';
import asyncHandler from '../../api/middleware/asyncHandler.js';
import { authenticateToken, authorizeAdmin } from '../../api/middleware/authMiddleware.js';
import { invalidateCacheOnSuccess } from '../../api/middleware/cache.js';
import { validate } from '../../api/middleware/validate.js';
import {
  bulkTransitionApplications,
  getApplicationStageHistory,
  getAvailableTransitions,
  transitionApplication,
  reopenApplication,
  WorkflowError,
} from './stage-engine.js';
import {
  bulkTransitionApplicationsSchema,
  reopenApplicationSchema,
  transitionApplicationSchema,
} from './workflow.schemas.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeAdmin);

router.post(
  '/applications/:id/transition',
  validate(transitionApplicationSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(async (req, res) => {
  try {
    const { toStage, reason, metadata } = req.validatedBody ?? {};

    const result = await transitionApplication(
      req.params.id,
      toStage,
      {
        actorEmail: req.user?.email ?? null,
        actorType: 'admin',
        reason,
        metadata,
      },
      prisma
    );

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (error instanceof WorkflowError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error({ msg: 'Workflow transition error', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}));

router.post(
  '/applications/bulk-transition',
  validate(bulkTransitionApplicationsSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(async (req, res) => {
  try {
    const { applicationIds, toStage, reason, metadata } = req.validatedBody ?? {};
    const result = await bulkTransitionApplications(
      applicationIds,
      toStage,
      {
        actorEmail: req.user?.email ?? null,
        actorType: 'admin',
        reason,
        metadata,
      },
      prisma
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (error instanceof WorkflowError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error({ msg: 'Workflow bulk transition error', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}));

router.get('/applications/:id/history', asyncHandler(async (req, res) => {
  try {
    const history = await getApplicationStageHistory(req.params.id, prisma);
    return res.status(200).json({ success: true, history });
  } catch (error) {
    if (error instanceof WorkflowError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error({ msg: 'Workflow history error', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}));

router.get('/applications/:id/available-transitions', asyncHandler(async (req, res) => {
  try {
    const transitions = await getAvailableTransitions(req.params.id, prisma);
    return res.status(200).json({ success: true, transitions });
  } catch (error) {
    if (error instanceof WorkflowError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error({ msg: 'Workflow available transitions error', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}));

router.post(
  '/applications/:id/reopen',
  validate(reopenApplicationSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({ where: { email: req.user?.email } });
    const result = await reopenApplication(
      req.params.id,
      req.validatedBody?.reason,
      { actorEmail: req.user?.email ?? null, actorRole: admin?.role || null },
      prisma
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (error instanceof WorkflowError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error({ msg: 'Workflow reopen error', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}));

export default router;
