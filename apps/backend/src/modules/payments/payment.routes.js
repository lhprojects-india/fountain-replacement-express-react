import express from 'express';
import { validate } from '../../api/middleware/validate.js';
import asyncHandler from '../../api/middleware/asyncHandler.js';
import {
  getApplicationPaymentDetailsHandler,
  getDriverPaymentDetailsHandler,
  getDriverPaymentSchemaHandler,
  submitDriverPaymentDetailsHandler,
  verifyApplicationPaymentDetailsHandler,
} from './payment.controller.js';
import { submitPaymentDetailsSchema, verifyPaymentDetailsSchema } from './payment.schemas.js';

const driverPaymentRoutes = express.Router();
const adminPaymentRoutes = express.Router();

driverPaymentRoutes.get('/payment/schema', asyncHandler(getDriverPaymentSchemaHandler));
driverPaymentRoutes.get('/payment', asyncHandler(getDriverPaymentDetailsHandler));
driverPaymentRoutes.post('/payment', validate(submitPaymentDetailsSchema), asyncHandler(submitDriverPaymentDetailsHandler));

adminPaymentRoutes.get('/:id/payment', asyncHandler(getApplicationPaymentDetailsHandler));
adminPaymentRoutes.post(
  '/:id/payment/verify',
  validate(verifyPaymentDetailsSchema),
  asyncHandler(verifyApplicationPaymentDetailsHandler)
);

export { driverPaymentRoutes, adminPaymentRoutes };
