import { handleSignatureEvent } from './contract.service.js';
import { verifyDropboxSignSignature } from './dropbox-sign.client.js';
import prisma from '../../../lib/prisma.js';
import logger from '../../../lib/logger.js';

function getRawPayload(req) {
  if (typeof req.body === 'string') return req.body;
  if (req.body?.json) return req.body.json;
  try {
    return JSON.stringify(req.body || {});
  } catch {
    return '';
  }
}

function parseEvent(req) {
  if (req.body?.json && typeof req.body.json === 'string') {
    try {
      return JSON.parse(req.body.json);
    } catch {
      return null;
    }
  }
  if (typeof req.body === 'object' && req.body) return req.body;
  return null;
}

export async function handleDropboxSignWebhookChallenge(req, res) {
  const challenge = req.query?.challenge;
  if (!challenge) {
    return res.status(400).send('Missing challenge');
  }
  return res.status(200).send(String(challenge));
}

export async function handleDropboxSignWebhook(req, res) {
  try {
    const signatureHeader =
      req.headers['x-dropbox-signature'] ||
      req.headers['x-hellosign-signature'] ||
      req.headers['x-hellosign-signature-sha256'];
    const rawPayload = getRawPayload(req);
    const isValid = verifyDropboxSignSignature(rawPayload, signatureHeader);
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
    logger.error({ msg: 'Dropbox Sign webhook handling error', error });
    return res.status(200).json({ success: false, message: error?.message || 'Webhook error' });
  }
}
