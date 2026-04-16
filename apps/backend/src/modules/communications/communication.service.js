import prisma from '../../lib/prisma.js';

export class CommunicationServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'CommunicationServiceError';
    this.statusCode = statusCode;
  }
}

function toId(rawId, label = 'id') {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new CommunicationServiceError(`Invalid ${label}.`, 400);
  }
  return id;
}

function normalizeTemplatePayload(data = {}) {
  const eventKey = String(data.eventKey || '').trim();
  const channel = String(data.channel || '').trim().toLowerCase();
  const locale = String(data.locale || 'en').trim().toLowerCase();
  const subject = data.subject == null ? null : String(data.subject);
  const body = String(data.body || '');
  const isActive = data.isActive == null ? true : Boolean(data.isActive);

  if (!eventKey) {
    throw new CommunicationServiceError('eventKey is required.', 400);
  }
  if (!channel) {
    throw new CommunicationServiceError('channel is required.', 400);
  }
  if (!body.trim()) {
    throw new CommunicationServiceError('body is required.', 400);
  }

  return {
    eventKey,
    channel,
    locale,
    subject: subject?.trim?.() || null,
    body,
    isActive,
  };
}

export async function logCommunication(data) {
  return prisma.communicationLog.create({ data });
}

export async function getCommunicationsByApplication(applicationId) {
  return prisma.communicationLog.findMany({
    where: { applicationId: toId(applicationId, 'application id') },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTemplates(filters = {}) {
  const where = {};
  if (filters.eventKey) where.eventKey = String(filters.eventKey).trim();
  if (filters.channel) where.channel = String(filters.channel).trim().toLowerCase();
  if (filters.locale) where.locale = String(filters.locale).trim().toLowerCase();
  if (filters.isActive != null) where.isActive = Boolean(filters.isActive);

  return prisma.messageTemplate.findMany({
    where,
    orderBy: [{ eventKey: 'asc' }, { channel: 'asc' }, { locale: 'asc' }],
  });
}

export async function getTemplate(id) {
  const template = await prisma.messageTemplate.findUnique({
    where: { id: toId(id) },
  });
  if (!template) {
    throw new CommunicationServiceError('Template not found.', 404);
  }
  return template;
}

export async function createTemplate(data) {
  const payload = normalizeTemplatePayload(data);
  try {
    return await prisma.messageTemplate.create({ data: payload });
  } catch (error) {
    if (error?.code === 'P2002') {
      throw new CommunicationServiceError(
        'A template already exists for this eventKey/channel/locale.',
        409
      );
    }
    throw error;
  }
}

export async function updateTemplate(id, data) {
  const templateId = toId(id);
  const existing = await prisma.messageTemplate.findUnique({ where: { id: templateId } });
  if (!existing) {
    throw new CommunicationServiceError('Template not found.', 404);
  }

  const next = normalizeTemplatePayload({
    ...existing,
    ...data,
  });

  try {
    return await prisma.messageTemplate.update({
      where: { id: templateId },
      data: next,
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      throw new CommunicationServiceError(
        'A template already exists for this eventKey/channel/locale.',
        409
      );
    }
    throw error;
  }
}

export async function deleteTemplate(id) {
  const templateId = toId(id);
  try {
    return await prisma.messageTemplate.delete({
      where: { id: templateId },
    });
  } catch (error) {
    if (error?.code === 'P2025') {
      throw new CommunicationServiceError('Template not found.', 404);
    }
    throw error;
  }
}

export async function previewTemplate(id, sampleVariables = {}) {
  const template = await getTemplate(id);
  const { renderTemplate, renderEmailHtml } = await import('./email.service.js');
  const isEmail = String(template.channel || '').toLowerCase() === 'email';
  return {
    template,
    rendered: {
      subject: renderTemplate(template.subject || '', sampleVariables),
      body: isEmail
        ? await renderEmailHtml(template.body, sampleVariables)
        : renderTemplate(template.body, sampleVariables),
    },
  };
}

export async function sendTemplateTest(id, recipient, variables = {}) {
  const template = await getTemplate(id);
  const cleanRecipient = String(recipient || '').trim();
  if (!cleanRecipient) {
    throw new CommunicationServiceError('recipient is required.', 400);
  }

  if (template.channel === 'email') {
    const { sendTemplatedEmail } = await import('./email.service.js');
    return sendTemplatedEmail(template.eventKey, cleanRecipient, variables);
  }
  if (template.channel === 'sms') {
    const { sendTemplatedSms } = await import('./sms.service.js');
    return sendTemplatedSms(template.eventKey, cleanRecipient, variables);
  }

  throw new CommunicationServiceError(`Unsupported channel: ${template.channel}`, 400);
}

export async function getCommunicationStats(dateFrom, dateTo) {
  const where = {};
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }
  const rows = await prisma.communicationLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      application: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      },
    },
    take: 5000,
  });

  const deliveredStatuses = new Set(['delivered', 'opened', 'sent']);
  const failedStatuses = new Set(['failed', 'bounced', 'complained', 'undelivered']);
  const sentCount = rows.length;
  const delivered = rows.filter((r) => deliveredStatuses.has(String(r.status || '').toLowerCase())).length;
  const failed = rows.filter((r) => failedStatuses.has(String(r.status || '').toLowerCase())).length;
  const bounced = rows.filter((r) => ['bounced', 'complained'].includes(String(r.status || '').toLowerCase())).length;

  const channelSummary = { email: { sent: 0, delivered: 0, bounced: 0, failed: 0 }, sms: { sent: 0, delivered: 0, bounced: 0, failed: 0 } };
  const eventMap = new Map();
  const recentFailures = [];

  for (const row of rows) {
    const channel = row.channel === 'sms' ? 'sms' : row.channel === 'email' ? 'email' : null;
    const status = String(row.status || '').toLowerCase();
    if (channel) {
      channelSummary[channel].sent += 1;
      if (deliveredStatuses.has(status)) channelSummary[channel].delivered += 1;
      if (status === 'bounced' || status === 'complained') channelSummary[channel].bounced += 1;
      if (failedStatuses.has(status)) channelSummary[channel].failed += 1;
    }
    const eventKey = row.templateEventKey || 'unknown';
    if (!eventMap.has(eventKey)) eventMap.set(eventKey, { eventKey, sent: 0, delivered: 0, failed: 0 });
    const agg = eventMap.get(eventKey);
    agg.sent += 1;
    if (deliveredStatuses.has(status)) agg.delivered += 1;
    if (failedStatuses.has(status)) agg.failed += 1;

    if (failedStatuses.has(status) && recentFailures.length < 30) {
      recentFailures.push({
        id: row.id,
        applicationId: row.applicationId,
        applicationName: row.application
          ? `${row.application.firstName || ''} ${row.application.lastName || ''}`.trim() || row.application.email
          : null,
        recipientEmail: row.recipientEmail,
        recipientPhone: row.recipientPhone,
        channel: row.channel,
        error: row.errorMessage || row.status,
        sentAt: row.sentAt || row.createdAt,
      });
    }
  }

  const byEvent = Array.from(eventMap.values()).map((item) => ({
    ...item,
    deliveryRate: item.sent ? Number(((item.delivered / item.sent) * 100).toFixed(2)) : 0,
  }));

  return {
    totalSent: sentCount,
    delivered,
    bounced,
    failed,
    byChannel: channelSummary,
    byEvent,
    recentFailures,
    deliveryRate: sentCount ? Number(((delivered / sentCount) * 100).toFixed(2)) : 0,
  };
}

export async function retryCommunicationLog(logId) {
  const id = toId(logId, 'communication log id');
  const row = await prisma.communicationLog.findUnique({ where: { id } });
  if (!row) throw new CommunicationServiceError('Communication log not found.', 404);
  const channel = String(row.channel || '').toLowerCase();
  if (!row.templateEventKey) {
    throw new CommunicationServiceError('Cannot retry communication without template event key.', 400);
  }

  if (channel === 'email') {
    const { sendTemplatedEmail } = await import('./email.service.js');
    return sendTemplatedEmail(row.templateEventKey, row.recipientEmail, { applicationId: row.applicationId });
  }
  if (channel === 'sms') {
    const { sendTemplatedSms } = await import('./sms.service.js');
    return sendTemplatedSms(row.templateEventKey, row.recipientPhone, { applicationId: row.applicationId });
  }
  throw new CommunicationServiceError(`Retry not supported for channel: ${row.channel}`, 400);
}
