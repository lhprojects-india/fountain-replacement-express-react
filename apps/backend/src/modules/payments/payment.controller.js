import {
  getPaymentDetails,
  getPaymentSchema,
  PaymentServiceError,
  submitPaymentDetails,
  verifyPaymentDetails,
} from './payment.service.js';
import logger from '../../lib/logger.js';

function handleError(res, error) {
  if (error instanceof PaymentServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors || undefined,
    });
  }
  logger.error({ msg: 'Payment controller error', error });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

function assertDriverUser(req, res) {
  if (req.user?.role !== 'driver' || !req.user?.applicationId || !req.user?.email) {
    res.status(403).json({ success: false, message: 'Driver access required.' });
    return false;
  }
  return true;
}

export async function getDriverPaymentSchemaHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const schema = await getPaymentSchema(req.user.applicationId);
    return res.status(200).json({ success: true, schema });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getDriverPaymentDetailsHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const payment = await getPaymentDetails(req.user.applicationId, undefined, { view: 'driver' });
    return res.status(200).json({ success: true, payment });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function submitDriverPaymentDetailsHandler(req, res) {
  if (!assertDriverUser(req, res)) return undefined;
  try {
    const result = await submitPaymentDetails(
      req.user.applicationId,
      req.user.email,
      (req.validatedBody || req.body)?.details || {}
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getApplicationPaymentDetailsHandler(req, res) {
  try {
    const payment = await getPaymentDetails(req.params.id, undefined, { redacted: false });
    return res.status(200).json({ success: true, payment });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function verifyApplicationPaymentDetailsHandler(req, res) {
  try {
    const result = await verifyPaymentDetails(req.params.id, req.user?.email);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}
