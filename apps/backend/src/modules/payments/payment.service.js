import prisma from '../../lib/prisma.js';
import { STAGES } from '../workflow/transition-matrix.js';
import { transitionApplication } from '../workflow/stage-engine.js';

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400, errors = null) {
    super(message);
    this.name = 'PaymentServiceError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

function toId(raw, label = 'id') {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new PaymentServiceError(`Invalid ${label}.`, 400);
  }
  return value;
}

function normalizeSchema(schema) {
  if (!schema || typeof schema !== 'object') return { fields: [] };
  const fields = Array.isArray(schema.fields) ? schema.fields : [];
  return {
    fields: fields
      .filter((field) => field && typeof field === 'object' && field.key)
      .map((field) => ({
        key: String(field.key),
        label: String(field.label || field.key),
        type: String(field.type || 'text').toLowerCase(),
        required: Boolean(field.required),
        pattern: field.pattern ? String(field.pattern) : null,
        patternMessage: field.patternMessage ? String(field.patternMessage) : null,
        helpText: field.helpText ? String(field.helpText) : null,
        options: Array.isArray(field.options) ? field.options : [],
      })),
  };
}

function redactValue(key, value) {
  const k = String(key || '').toLowerCase();
  const raw = String(value ?? '');
  const isSensitive = ['account', 'iban', 'routing', 'sort_code'].some((part) => k.includes(part));
  if (!isSensitive) return value;
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const last4 = trimmed.slice(-4);
  return `****${last4}`;
}

function redactDetails(details = {}, schema = { fields: [] }) {
  const output = {};
  for (const field of schema.fields || []) {
    output[field.key] = redactValue(field.key, details[field.key]);
  }
  return output;
}

export function validatePaymentDetails(details, schema) {
  const errors = {};
  for (const field of schema.fields || []) {
    const value = details?.[field.key];
    const asString = value == null ? '' : String(value);
    const isEmpty = !asString.trim();

    if (field.required && isEmpty) {
      errors[field.key] = `${field.label} is required`;
      continue;
    }
    if (isEmpty) continue;

    if (field.type === 'number' && Number.isNaN(Number(asString))) {
      errors[field.key] = `${field.label} must be a number`;
      continue;
    }

    if (field.type === 'select' && Array.isArray(field.options) && field.options.length > 0) {
      const allowed = new Set(field.options.map((opt) => String(opt.value)));
      if (!allowed.has(asString)) {
        errors[field.key] = field.patternMessage || `Invalid selection for ${field.label}`;
        continue;
      }
    }

    if (field.pattern) {
      const re = new RegExp(field.pattern);
      if (!re.test(asString)) {
        errors[field.key] = field.patternMessage || `Invalid format for ${field.label}`;
      }
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

async function getDriverApplication(applicationId, email, prismaClient = prisma) {
  return prismaClient.application.findFirst({
    where: { id: applicationId, email: String(email || '').trim().toLowerCase() },
    include: {
      job: { include: { city: true } },
      paymentDetails: true,
    },
  });
}

async function getApplicationById(applicationId, prismaClient = prisma) {
  return prismaClient.application.findUnique({
    where: { id: applicationId },
    include: {
      job: { include: { city: true } },
      paymentDetails: true,
    },
  });
}

export async function getPaymentSchema(applicationId, prismaClient = prisma) {
  const id = toId(applicationId, 'application id');
  const app = await getApplicationById(id, prismaClient);
  if (!app) throw new PaymentServiceError('Application not found.', 404);
  return normalizeSchema(app.job?.city?.paymentFieldsSchema);
}

export async function getPaymentDetails(applicationId, prismaClient = prisma, { redacted = true, view = 'admin' } = {}) {
  const id = toId(applicationId, 'application id');
  const app = await getApplicationById(id, prismaClient);
  if (!app) throw new PaymentServiceError('Application not found.', 404);
  const schema = normalizeSchema(app.job?.city?.paymentFieldsSchema);
  const details = app.paymentDetails?.details || {};
  const shouldRedact = view === 'driver' ? app.currentStage !== STAGES.PAYMENT_DETAILS_PENDING : redacted;
  return {
    hasSubmission: Boolean(app.paymentDetails),
    submittedAt: app.paymentDetails?.submittedAt || null,
    verifiedAt: app.paymentDetails?.verifiedAt || null,
    verifiedBy: app.paymentDetails?.verifiedBy || null,
    details: shouldRedact ? redactDetails(details, schema) : details,
  };
}

export async function submitPaymentDetails(applicationId, email, details, prismaClient = prisma) {
  const id = toId(applicationId, 'application id');
  const app = await getDriverApplication(id, email, prismaClient);
  if (!app) throw new PaymentServiceError('Application not found.', 404);
  if (app.currentStage !== STAGES.PAYMENT_DETAILS_PENDING) {
    throw new PaymentServiceError('Payment details can only be submitted in payment details pending stage.', 400);
  }

  const schema = normalizeSchema(app.job?.city?.paymentFieldsSchema);
  if (!schema.fields.length) {
    throw new PaymentServiceError('Payment schema is not configured for this city.', 400);
  }
  const { valid, errors } = validatePaymentDetails(details || {}, schema);
  if (!valid) {
    throw new PaymentServiceError('Payment details validation failed.', 400, errors);
  }

  const cleanDetails = {};
  for (const field of schema.fields) {
    if (details?.[field.key] == null) continue;
    cleanDetails[field.key] = String(details[field.key]).trim();
  }

  await prismaClient.paymentDetailSubmission.upsert({
    where: { applicationId: app.id },
    create: { applicationId: app.id, details: cleanDetails },
    update: { details: cleanDetails, submittedAt: new Date() },
  });

  await transitionApplication(
    app.id,
    STAGES.ONBOARDING_CALL,
    {
      actorEmail: String(email || '').trim().toLowerCase(),
      actorType: 'driver',
      reason: 'payment_details_submitted',
      metadata: { source: 'driver_payment_form' },
    },
    prismaClient
  );

  return { submitted: true };
}

export async function verifyPaymentDetails(applicationId, adminEmail, prismaClient = prisma) {
  const id = toId(applicationId, 'application id');
  const app = await getApplicationById(id, prismaClient);
  if (!app) throw new PaymentServiceError('Application not found.', 404);
  if (!app.paymentDetails) throw new PaymentServiceError('Payment details not submitted yet.', 400);

  const updated = await prismaClient.paymentDetailSubmission.update({
    where: { applicationId: id },
    data: {
      verifiedAt: new Date(),
      verifiedBy: String(adminEmail || '').trim().toLowerCase() || null,
    },
  });
  return { verified: true, paymentDetails: updated };
}
