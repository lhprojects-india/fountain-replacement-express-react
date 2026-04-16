import twilio from 'twilio';
import prisma from '../../lib/prisma.js';
import logger from '../../lib/logger.js';
import { renderTemplate } from './email.service.js';
import { logCommunication } from './communication.service.js';

function getTwilioClient() {
  const sid = String(process.env.TWILIO_ACCOUNT_SID || '').trim();
  const token = String(process.env.TWILIO_AUTH_TOKEN || '').trim();
  if (!sid || !token) return null;
  try {
    return twilio(sid, token);
  } catch (error) {
    logger.error({ msg: '[sms] failed to initialize twilio client', error: error?.message || error });
    return null;
  }
}

function normalizePhone(value) {
  return String(value || '').trim();
}

async function inferApplicationId(phone, variables = {}) {
  if (variables.applicationId && Number.isInteger(Number(variables.applicationId))) {
    return Number(variables.applicationId);
  }
  if (!phone) return null;
  const app = await prisma.application.findFirst({
    where: { phone },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  return app?.id || null;
}

export async function sendSms({ to, body }) {
  const client = getTwilioClient();
  const from = String(process.env.TWILIO_PHONE_NUMBER || '').trim();
  if (!client || !from) {
    logger.warn({ msg: '[sms] twilio config missing; skipping send', to });
    return { messageId: null, status: 'skipped', error: 'Twilio credentials missing' };
  }
  try {
    const message = await client.messages.create({
      body,
      from,
      to,
      statusCallback: process.env.API_BASE_URL
        ? `${String(process.env.API_BASE_URL).replace(/\/$/, '')}/api/webhooks/twilio`
        : undefined,
    });
    return { messageId: message.sid, status: message.status || 'sent', error: null };
  } catch (error) {
    logger.error({ msg: '[sms] send failed', error: error?.message || error });
    return { messageId: null, status: 'failed', error: error?.message || 'SMS provider failed' };
  }
}

export async function sendTemplatedSms(templateEventKey, phone, variables = {}) {
  const eventKey = String(templateEventKey || '').trim();
  const recipientPhone = normalizePhone(phone);
  if (!eventKey || !recipientPhone) {
    return { status: 'failed', reason: 'Missing event key or recipient phone' };
  }

  const template = await prisma.messageTemplate.findFirst({
    where: {
      eventKey,
      channel: 'sms',
      locale: 'en',
      isActive: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!template) {
    const msg = `Missing active sms template for event "${eventKey}"`;
    await logCommunication({
      applicationId: await inferApplicationId(recipientPhone, variables),
      channel: 'sms',
      templateEventKey: eventKey,
      recipientPhone,
      subject: null,
      body: null,
      providerMessageId: null,
      status: 'failed',
      errorMessage: msg,
      sentAt: null,
    });
    return { status: 'failed', reason: msg };
  }

  const body = renderTemplate(template.body || '', variables);
  const result = await sendSms({ to: recipientPhone, body });
  await logCommunication({
    applicationId: await inferApplicationId(recipientPhone, variables),
    channel: 'sms',
    templateEventKey: eventKey,
    recipientPhone,
    subject: null,
    body,
    providerMessageId: result.messageId,
    status: result.status,
    errorMessage: result.error || null,
    sentAt: result.status === 'sent' ? new Date() : null,
  });
  return result;
}
