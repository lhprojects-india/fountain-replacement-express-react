import prisma from '../../lib/prisma.js';
import { Webhook } from 'svix';
import logger from '../../lib/logger.js';

function isValidSignature(req) {
  const secret = String(process.env.RESEND_WEBHOOK_SECRET || '').trim();
  if (!secret) return true;
  try {
    const svixHeaders = {
      'svix-id': req.headers['svix-id'],
      'svix-signature': req.headers['svix-signature'],
      'svix-timestamp': req.headers['svix-timestamp'],
    };
    const body =
      Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body || {});
    const webhook = new Webhook(secret);
    webhook.verify(body, svixHeaders);
    return true;
  } catch {
    return false;
  }
}

function toStatus(type) {
  switch (type) {
    case 'email.delivered':
      return 'delivered';
    case 'email.bounced':
      return 'bounced';
    case 'email.complained':
      return 'complained';
    case 'email.opened':
      return 'opened';
    default:
      return null;
  }
}

export async function handleResendWebhook(req, res) {
  try {
    if (!isValidSignature(req)) {
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }
    const body =
      Buffer.isBuffer(req.body) && req.body.length
        ? JSON.parse(req.body.toString('utf8'))
        : req.body || {};
    const eventType = body.type || body.event?.type;
    const providerMessageId =
      body.data?.email_id || body.data?.id || body.data?.message_id || body.email_id || body.id;
    const nextStatus = toStatus(eventType);
    if (!providerMessageId || !nextStatus) {
      return res.status(200).json({ success: true, ignored: true });
    }

    const log = await prisma.communicationLog.findFirst({
      where: { providerMessageId: String(providerMessageId) },
      orderBy: { createdAt: 'desc' },
    });
    if (!log) {
      return res.status(200).json({ success: true, ignored: true });
    }

    await prisma.communicationLog.update({
      where: { id: log.id },
      data: {
        status: nextStatus,
        errorMessage:
          nextStatus === 'bounced' || nextStatus === 'complained'
            ? body.data?.reason || body.data?.bounce?.reason || log.errorMessage
            : log.errorMessage,
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ msg: 'Resend webhook error', error });
    return res.status(200).json({ success: false, message: error?.message || 'Webhook error' });
  }
}
