import express from 'express';
import { invalidateCacheOnSuccess } from '../../api/middleware/cache.js';
import asyncHandler from '../../api/middleware/asyncHandler.js';
import { validate } from '../../api/middleware/validate.js';
import { addApplicationNoteSchema, updateApplicationNotesSchema } from './application.schemas.js';
import {
  approveApplicationSchema,
  assignFirstBlockSchema,
  completeCallSchema,
  emptyBodySchema,
  firstBlockResultSchema,
  markCallNoShowSchema,
  rejectApplicationSchema,
  rescheduleCallSchema,
  rescheduleFirstBlockSchema,
  scheduleCallSchema,
} from './application-action.schemas.js';
import {
  addApplicationNoteHandler,
  cancelApplicationContractHandler,
  exportApplicationsHandler,
  getAllApplicationsHandler,
  getApplicationContractStatusHandler,
  getApplicationHandler,
  getApplicationNotesHandler,
  getApplicationsByStageHandler,
  getApplicationStatsHandler,
  getRecentActivityHandler,
  markApplicationContractSignedHandler,
  quickSearchApplicationsHandler,
  resendApplicationContractHandler,
  sendApplicationContractHandler,
  updateApplicationNotesHandler,
} from './application.controller.js';
import {
  approveApplicationHandler,
  getDecisionSummaryHandler,
  rejectApplicationHandler,
} from './decision.controller.js';
import {
  completeCallHandler,
  getCallQueueHandler,
  markCallNoShowHandler,
  rescheduleCallHandler,
  scheduleCallHandler,
} from './call.controller.js';
import {
  assignFirstBlockHandler,
  getBlockQueueHandler,
  recordBlockResultHandler,
  rescheduleBlockHandler,
} from './first-block.controller.js';

const router = express.Router();

router.get('/stats', asyncHandler(getApplicationStatsHandler));
router.get('/export', asyncHandler(exportApplicationsHandler));
router.get('/activity', asyncHandler(getRecentActivityHandler));
router.get('/search', asyncHandler(quickSearchApplicationsHandler));
router.get('/by-stage', asyncHandler(getApplicationsByStageHandler));
router.get('/call-queue', asyncHandler(getCallQueueHandler));
router.get('/block-queue', asyncHandler(getBlockQueueHandler));
router.get('/', asyncHandler(getAllApplicationsHandler));
router.get('/:id/notes', asyncHandler(getApplicationNotesHandler));
router.post(
  '/:id/notes',
  validate(addApplicationNoteSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(addApplicationNoteHandler)
);
router.put(
  '/:id/notes',
  validate(updateApplicationNotesSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(updateApplicationNotesHandler)
);
router.post(
  '/:id/contract/send',
  validate(emptyBodySchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(sendApplicationContractHandler)
);
router.get('/:id/contract/status', asyncHandler(getApplicationContractStatusHandler));
router.post(
  '/:id/contract/cancel',
  validate(emptyBodySchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(cancelApplicationContractHandler)
);
router.post(
  '/:id/contract/resend',
  validate(emptyBodySchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(resendApplicationContractHandler)
);
router.post(
  '/:id/contract/mark-signed',
  validate(emptyBodySchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(markApplicationContractSignedHandler)
);
router.post(
  '/:id/call/schedule',
  validate(scheduleCallSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(scheduleCallHandler)
);
router.post(
  '/:id/call/complete',
  validate(completeCallSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(completeCallHandler)
);
router.post(
  '/:id/call/reschedule',
  validate(rescheduleCallSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(rescheduleCallHandler)
);
router.post(
  '/:id/call/no-show',
  validate(markCallNoShowSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(markCallNoShowHandler)
);
router.post(
  '/:id/first-block/assign',
  validate(assignFirstBlockSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(assignFirstBlockHandler)
);
router.post(
  '/:id/first-block/result',
  validate(firstBlockResultSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(recordBlockResultHandler)
);
router.post(
  '/:id/first-block/reschedule',
  validate(rescheduleFirstBlockSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(rescheduleBlockHandler)
);
router.get('/:id/decision-summary', asyncHandler(getDecisionSummaryHandler));
router.post(
  '/:id/approve',
  validate(approveApplicationSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(approveApplicationHandler)
);
router.post(
  '/:id/reject',
  validate(rejectApplicationSchema),
  invalidateCacheOnSuccess(['analytics']),
  asyncHandler(rejectApplicationHandler)
);
router.get('/:id', asyncHandler(getApplicationHandler));

export default router;
