import {
  CallServiceError,
  completeCall,
  getCallQueue,
  markCallNoShow,
  rescheduleCall,
  scheduleCall,
} from './call.service.js';
import logger from '../../lib/logger.js';

function handleError(res, error) {
  if (error instanceof CallServiceError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  logger.error({ msg: 'Call controller error', error });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

export async function scheduleCallHandler(req, res) {
  try {
    const application = await scheduleCall(
      req.params.id,
      (req.validatedBody || req.body)?.scheduledAt,
      req.user?.email
    );
    return res.status(200).json({ success: true, application });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function completeCallHandler(req, res) {
  try {
    const result = await completeCall(
      req.params.id,
      req.user?.email,
      (req.validatedBody || req.body)?.notes
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function rescheduleCallHandler(req, res) {
  try {
    const application = await rescheduleCall(
      req.params.id,
      (req.validatedBody || req.body)?.scheduledAt,
      req.user?.email,
      (req.validatedBody || req.body)?.reason
    );
    return res.status(200).json({ success: true, application });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getCallQueueHandler(req, res) {
  try {
    const queue = await getCallQueue();
    return res.status(200).json({ success: true, queue });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function markCallNoShowHandler(req, res) {
  try {
    const result = await markCallNoShow(req.params.id, req.user?.email, {
      action: (req.validatedBody || req.body)?.action,
      scheduledAt: (req.validatedBody || req.body)?.scheduledAt,
      reason: (req.validatedBody || req.body)?.reason,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}
