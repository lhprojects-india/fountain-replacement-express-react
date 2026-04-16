import twilio from 'twilio';
import prisma from '../../lib/prisma.js';
import logger from '../../lib/logger.js';

function isValidTwilioSignature(req) {
  const token = String(process.env.TWILIO_AUTH_TOKEN || '').trim();
  if (!token) return true;
  const signature = req.headers['x-twilio-signature'];
  if (!signature) return false;
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = String(forwardedProto || req.protocol || 'https').split(',')[0].trim();
  const host = req.get('host');
  const url = `${protocol}://${host}${req.originalUrl}`;
  return twilio.validateRequest(token, signature, url, req.body || {});
}

export async function handleTwilioWebhook(req, res) {
  try {
    if (!isValidTwilioSignature(req)) {
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }
    const sid = String(req.body?.MessageSid || req.body?.SmsSid || '').trim();
    const status = String(req.body?.MessageStatus || '').trim().toLowerCase();
    if (!sid || !status) {
      return res.status(200).json({ success: true, ignored: true });
    }

    const log = await prisma.communicationLog.findFirst({
      where: { providerMessageId: sid },
      orderBy: { createdAt: 'desc' },
    });
    if (!log) return res.status(200).json({ success: true, ignored: true });

    await prisma.communicationLog.update({
      where: { id: log.id },
      data: {
        status,
        errorMessage:
          status === 'failed' || status === 'undelivered'
            ? req.body?.ErrorMessage || req.body?.ErrorCode || log.errorMessage
            : log.errorMessage,
      },
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ msg: 'Twilio webhook error', error });
    return res.status(200).json({ success: false, message: error?.message || 'Webhook error' });
  }
}
