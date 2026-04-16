import {
  approveApplication,
  DecisionServiceError,
  getDecisionSummary,
  rejectApplication,
} from './decision.service.js';
import logger from '../../lib/logger.js';

function handleError(res, error) {
  if (error instanceof DecisionServiceError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  logger.error({ msg: 'Decision controller error', error });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

export async function getDecisionSummaryHandler(req, res) {
  try {
    const summary = await getDecisionSummary(req.params.id);
    return res.status(200).json({ success: true, summary });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function approveApplicationHandler(req, res) {
  try {
    const result = await approveApplication(
      req.params.id,
      req.user?.email,
      (req.validatedBody || req.body)?.notes
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function rejectApplicationHandler(req, res) {
  try {
    const result = await rejectApplication(
      req.params.id,
      req.user?.email,
      (req.validatedBody || req.body)?.reason,
      (req.validatedBody || req.body)?.notes
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}
