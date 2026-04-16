import {
  DriverAuthServiceError,
  getDriverSession,
  requestVerificationCode,
  verifyCode,
} from './auth.service.js';
import logger from '../../lib/logger.js';

function handleError(res, error) {
  if (error instanceof DriverAuthServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }
  logger.error({ msg: 'Driver auth controller error', error });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

export async function requestCodeHandler(req, res) {
  try {
    const result = await requestVerificationCode(req.validatedBody?.email || req.body?.email);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function verifyCodeHandler(req, res) {
  try {
    const result = await verifyCode(
      req.validatedBody?.email || req.body?.email,
      req.validatedBody?.code || req.body?.code
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function sessionHandler(req, res) {
  try {
    if (req.user?.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Driver access required.',
      });
    }
    const result = await getDriverSession(req.user?.email);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}
