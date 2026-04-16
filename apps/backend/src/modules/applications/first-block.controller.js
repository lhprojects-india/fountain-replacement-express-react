import {
  assignFirstBlock,
  FirstBlockServiceError,
  getBlockQueue,
  recordBlockResult,
  rescheduleBlock,
} from './first-block.service.js';
import logger from '../../lib/logger.js';

function handleError(res, error) {
  if (error instanceof FirstBlockServiceError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  logger.error({ msg: 'First block controller error', error });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

export async function assignFirstBlockHandler(req, res) {
  try {
    const body = req.validatedBody || req.body;
    const date = body?.date ?? body?.blockDate;
    const result = await assignFirstBlock(
      req.params.id,
      date,
      req.user?.email,
      body?.metadata
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function recordBlockResultHandler(req, res) {
  try {
    const body = req.validatedBody || req.body;
    const result = await recordBlockResult(
      req.params.id,
      body?.result,
      req.user?.email,
      body?.notes
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function rescheduleBlockHandler(req, res) {
  try {
    const body = req.validatedBody || req.body;
    const date = body?.date ?? body?.newDate;
    const application = await rescheduleBlock(
      req.params.id,
      date,
      req.user?.email,
      body?.reason
    );
    return res.status(200).json({ success: true, application });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getBlockQueueHandler(req, res) {
  try {
    const queue = await getBlockQueue({ cityId: req.query.cityId ?? req.query.regionId });
    return res.status(200).json({ success: true, queue });
  } catch (error) {
    return handleError(res, error);
  }
}
