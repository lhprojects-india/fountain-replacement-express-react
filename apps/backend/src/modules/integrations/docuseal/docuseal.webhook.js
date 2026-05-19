import { handleSignatureEvent } from './contract.service.js';
import { verifyWebhookSignature } from './docuseal.client.js';
import prisma from '../../../lib/prisma.js';
import logger from '../../../lib/logger.js';

function rawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8');
  try {
    return Buffer.from(JSON.stringify(req.body || {}), 'utf8');
  } catch {
    return Buffer.from('');
  }
}

function parseEvent(req) {
  if (Buffer.isBuffer(req.body)) {
    const text = req.body.toString('utf8');
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  if (req.body && typeof req.body === 'object') return req.body;
  return null;
}

export async function handleDocusealWebhook(req, res) {
  try {
    const signatureHeader =
      req.headers['x-docuseal-signature'] ||
      req.headers['x-docuseal-event-signature'] ||
      req.headers['x-webhook-signature'];

    const isValid = verifyWebhookSignature(rawBody(req), signatureHeader);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = parseEvent(req);
    if (!event) {
      return res.status(400).json({ success: false, message: 'Invalid event payload' });
    }

    const result = await handleSignatureEvent(event, prisma);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    logger.error({ msg: 'Docuseal webhook handling error', error: error?.message || error });
    // Return 200 so Docuseal does not aggressively retry on internal errors;
    // we have logged and will pick up state via polling.
    return res.status(200).json({ success: false, message: error?.message || 'Webhook error' });
  }
}
