import crypto from 'node:crypto';

/**
 * Thin wrapper around the Docuseal REST API.
 *
 * The instance is expected to be self-hosted (e.g. on Render) but the client
 * also works against the Docuseal cloud API. All endpoints expect an
 * `X-Auth-Token` header carrying the Docuseal API key.
 */

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function apiBaseUrl() {
  const raw = trimTrailingSlash(process.env.DOCUSEAL_BASE_URL || '');
  if (!raw) return '';
  // Allow callers to set either the bare host (https://docuseal.example.com)
  // or the full /api prefix (https://docuseal.example.com/api).
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

function publicBaseUrl() {
  const explicit = trimTrailingSlash(process.env.DOCUSEAL_PUBLIC_URL || '');
  if (explicit) return explicit;
  const raw = trimTrailingSlash(process.env.DOCUSEAL_BASE_URL || '');
  if (!raw) return '';
  return raw.endsWith('/api') ? raw.replace(/\/api$/, '') : raw;
}

function apiKey() {
  return String(process.env.DOCUSEAL_API_KEY || '').trim();
}

function authHeaders(extra = {}) {
  const key = apiKey();
  if (!key) {
    throw new Error('DOCUSEAL_API_KEY missing');
  }
  return {
    'X-Auth-Token': key,
    Accept: 'application/json',
    ...extra,
  };
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const base = apiBaseUrl();
  if (!base) {
    throw new Error('DOCUSEAL_BASE_URL missing');
  }
  const url = `${base}${path}`;
  const isJsonBody = body && typeof body === 'object' && !(body instanceof URLSearchParams);
  const response = await fetch(url, {
    method,
    headers: authHeaders(
      isJsonBody
        ? { 'Content-Type': 'application/json', ...headers }
        : headers
    ),
    body: isJsonBody ? JSON.stringify(body) : body,
  });
  const raw = await response.text();
  let json;
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    json = { raw };
  }
  if (!response.ok) {
    const message =
      json?.error?.message ||
      json?.error ||
      json?.message ||
      `Docuseal request failed (${response.status})`;
    const err = new Error(typeof message === 'string' ? message : JSON.stringify(message));
    err.statusCode = response.status;
    err.responseBody = json;
    throw err;
  }
  return json;
}

/**
 * Build a public signing URL the driver can open to complete their submission.
 */
export function buildSigningUrl(slug) {
  const base = publicBaseUrl();
  if (!base || !slug) return null;
  return `${base}/s/${encodeURIComponent(slug)}`;
}

/**
 * Build the URL of the in-Docuseal template editor (for admin shortcut links).
 */
export function buildTemplateEditUrl(templateId) {
  const base = publicBaseUrl();
  if (!base || !templateId) return null;
  return `${base}/templates/${encodeURIComponent(templateId)}/edit`;
}

/**
 * POST /submissions
 * Creates a single-submitter signature request from an existing template.
 */
export async function createSubmission({
  templateId,
  submitter,
  prefillValues = {},
  externalId,
  sendEmail = true,
  completedRedirectUrl,
  message,
}) {
  if (!templateId) {
    throw new Error('Missing Docuseal template id');
  }
  if (!submitter?.email) {
    throw new Error('Submitter email is required');
  }

  const payload = {
    template_id: typeof templateId === 'string' && /^\d+$/.test(templateId)
      ? Number(templateId)
      : templateId,
    send_email: sendEmail,
    submitters: [
      {
        email: submitter.email,
        name: submitter.name || undefined,
        role: submitter.role || 'Driver',
        external_id: externalId != null ? String(externalId) : undefined,
        send_email: sendEmail,
        values: prefillValues || undefined,
        completed_redirect_url: completedRedirectUrl || undefined,
      },
    ],
  };

  if (message?.subject || message?.body) {
    payload.message = {
      subject: message.subject || undefined,
      body: message.body || undefined,
    };
  }

  const json = await request('/submissions', {
    method: 'POST',
    body: payload,
  });

  // The submissions endpoint returns an array of created submitter records.
  const submitters = Array.isArray(json) ? json : json?.submitters || [];
  const primary = submitters[0] || {};
  const submissionId =
    primary.submission_id ||
    json?.id ||
    json?.submission?.id ||
    null;
  const slug = primary.slug || null;

  return {
    submissionId: submissionId != null ? String(submissionId) : null,
    submitterId: primary.id != null ? String(primary.id) : null,
    slug,
    embedSrc: primary.embed_src || (slug ? buildSigningUrl(slug) : null),
    signingUrl: slug ? buildSigningUrl(slug) : primary.embed_src || null,
    raw: json,
  };
}

/**
 * GET /submissions/{id}
 */
export async function getSubmission(submissionId) {
  if (!submissionId) {
    throw new Error('Missing Docuseal submission id');
  }
  return request(`/submissions/${encodeURIComponent(submissionId)}`);
}

/**
 * GET /submissions/{id}/documents
 */
export async function getSubmissionDocuments(submissionId) {
  if (!submissionId) {
    throw new Error('Missing Docuseal submission id');
  }
  return request(`/submissions/${encodeURIComponent(submissionId)}/documents`);
}

/**
 * DELETE /submissions/{id} — archives the submission. Used for "cancel contract".
 */
export async function archiveSubmission(submissionId) {
  if (!submissionId) {
    throw new Error('Missing Docuseal submission id');
  }
  return request(`/submissions/${encodeURIComponent(submissionId)}`, {
    method: 'DELETE',
  });
}

/**
 * PUT /submitters/{id} — used to re-send the signature request email.
 */
export async function resendSubmitterInvite(submitterId) {
  if (!submitterId) {
    throw new Error('Missing Docuseal submitter id');
  }
  return request(`/submitters/${encodeURIComponent(submitterId)}`, {
    method: 'PUT',
    body: { send_email: true },
  });
}

/**
 * GET /templates — list templates available in the connected Docuseal instance.
 */
export async function listTemplates({ q, limit = 100, after } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (limit) params.set('limit', String(limit));
  if (after) params.set('after', String(after));
  const suffix = params.toString();
  return request(`/templates${suffix ? `?${suffix}` : ''}`);
}

/**
 * GET /templates/{id}
 */
export async function getTemplate(templateId) {
  if (!templateId) {
    throw new Error('Missing Docuseal template id');
  }
  return request(`/templates/${encodeURIComponent(templateId)}`);
}

/**
 * Verify Docuseal webhook signature. Self-hosted Docuseal can be configured
 * with a webhook secret; the signature is sent in the `X-Docuseal-Signature`
 * header as the hex HMAC-SHA256 of the raw request body.
 *
 * If no secret is configured we accept the payload (callers should make sure
 * the endpoint is otherwise protected, e.g. by URL secret).
 */
export function verifyWebhookSignature(rawPayload, headerSignature) {
  const secret = String(process.env.DOCUSEAL_WEBHOOK_SECRET || '').trim();
  if (!secret) return true;
  if (!rawPayload || !headerSignature) return false;

  const buffer = Buffer.isBuffer(rawPayload)
    ? rawPayload
    : Buffer.from(String(rawPayload), 'utf8');
  const provided = String(headerSignature).trim().replace(/^sha256=/i, '');
  const digest = crypto.createHmac('sha256', secret).update(buffer).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(digest));
  } catch {
    return false;
  }
}

export function hasClientConfig() {
  return Boolean(apiKey()) && Boolean(apiBaseUrl());
}
