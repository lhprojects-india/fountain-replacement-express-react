import crypto from 'node:crypto';
import * as DropboxSign from '@dropbox/sign';
import { PRODUCT_DISPLAY_NAME } from '../../../lib/product-name.js';

const API_BASE = 'https://api.hellosign.com/v3';

function apiKey() {
  return String(process.env.DROPBOX_SIGN_API_KEY || '').trim();
}

function authHeader() {
  return `Basic ${Buffer.from(`${apiKey()}:`).toString('base64')}`;
}

function hasClientConfig() {
  return Boolean(apiKey());
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const key = apiKey();
  if (!key) {
    throw new Error('DROPBOX_SIGN_API_KEY missing');
  }
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      ...headers,
    },
    body,
  });
  const raw = await response.text();
  let json;
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    json = { raw };
  }
  if (!response.ok) {
    const msg = json?.error?.error_msg || json?.error_msg || `Dropbox Sign request failed (${response.status})`;
    throw new Error(msg);
  }
  return json;
}

export async function createSignatureRequest({
  templateId,
  signerEmail,
  signerName,
  customFields = {},
  title,
}) {
  if (!templateId) {
    throw new Error('Missing Dropbox Sign template id');
  }

  const payload = new URLSearchParams();
  payload.set('test_mode', '1');
  payload.set('client_id', String(process.env.DROPBOX_SIGN_CLIENT_ID || '').trim());
  payload.set('template_id', templateId);
  payload.set('subject', title || `${PRODUCT_DISPLAY_NAME} — contract`);
  payload.set('message', `Please sign your ${PRODUCT_DISPLAY_NAME} contract.`);
  payload.set('signers[0][email_address]', signerEmail);
  payload.set('signers[0][name]', signerName || signerEmail);

  Object.entries(customFields || {}).forEach(([key, value], idx) => {
    payload.set(`custom_fields[${idx}][name]`, key);
    payload.set(`custom_fields[${idx}][value]`, String(value ?? ''));
  });

  const json = await request('/signature_request/send_with_template', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload.toString(),
  });

  const req = json?.signature_request || {};
  const signature = Array.isArray(req.signatures) ? req.signatures[0] : null;
  return {
    signatureRequestId: req.signature_request_id || null,
    signatureId: signature?.signature_id || null,
    signingUrl: signature?.sign_url || null,
    raw: json,
  };
}

export async function createTemplateFromFile({
  templateTitle,
  signerRole,
  fileBuffer,
  fileName,
  mimeType,
}) {
  if (!fileBuffer || !fileName) {
    throw new Error('Template file is required');
  }
  const title = String(templateTitle || '').trim();
  if (!title) {
    throw new Error('Template title is required');
  }
  const roleName = String(signerRole || '').trim() || 'Signer';

  const formData = new FormData();
  formData.append('test_mode', '1');
  formData.append('client_id', String(process.env.DROPBOX_SIGN_CLIENT_ID || '').trim());
  formData.append('title', title);
  formData.append('subject', `${PRODUCT_DISPLAY_NAME} contract`);
  formData.append('message', `Please sign your ${PRODUCT_DISPLAY_NAME} contract.`);
  formData.append('signer_roles[0][name]', roleName);
  formData.append(
    'files[0]',
    new Blob([fileBuffer], { type: mimeType || 'application/octet-stream' }),
    fileName
  );

  const json = await request('/template/create_embedded_draft', {
    method: 'POST',
    body: formData,
  });

  const template = json?.template || {};
  return {
    templateId: template.template_id || null,
    title: template.title || title,
    raw: json,
  };
}

export async function getSignatureRequestStatus(signatureRequestId) {
  const json = await request(`/signature_request/${encodeURIComponent(signatureRequestId)}`);
  return json?.signature_request || null;
}

export async function cancelSignatureRequest(signatureRequestId) {
  const payload = new URLSearchParams();
  payload.set('signature_request_id', signatureRequestId);
  await request(`/signature_request/cancel/${encodeURIComponent(signatureRequestId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload.toString(),
  });
  return { cancelled: true };
}

export async function downloadSignedDocument(signatureRequestId) {
  if (!hasClientConfig()) {
    throw new Error('DROPBOX_SIGN_API_KEY missing');
  }
  const response = await fetch(
    `${API_BASE}/signature_request/files/${encodeURIComponent(signatureRequestId)}?file_type=pdf`,
    { headers: { Authorization: authHeader() } }
  );
  if (!response.ok) {
    throw new Error(`Failed to download signed document (${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function verifyDropboxSignSignature(rawPayload, expectedSignature) {
  const secret = String(process.env.DROPBOX_SIGN_WEBHOOK_SECRET || '').trim();
  if (!secret) return true;
  if (!rawPayload || !expectedSignature) return false;
  const digest = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(String(expectedSignature)));
  } catch {
    return false;
  }
}

export { DropboxSign };
