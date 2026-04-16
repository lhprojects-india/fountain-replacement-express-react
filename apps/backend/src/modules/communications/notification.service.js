import prisma from '../../lib/prisma.js';
import { PRODUCT_DISPLAY_NAME } from '../../lib/product-name.js';
import { sendTemplatedEmail } from './email.service.js';
import { sendTemplatedSms } from './sms.service.js';

function buildVariables(application = {}, extra = {}) {
  let firstBlockDateISO = extra.firstBlockDate != null ? String(extra.firstBlockDate) : '';
  let firstBlockDateHuman = extra.firstBlockDateHuman != null ? String(extra.firstBlockDateHuman) : '';
  if (application.firstBlockDate) {
    const fd = new Date(application.firstBlockDate);
    if (!Number.isNaN(fd.getTime())) {
      if (!firstBlockDateISO) firstBlockDateISO = fd.toISOString();
      if (!firstBlockDateHuman) {
        firstBlockDateHuman = fd.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' });
      }
    }
  }
  return {
    applicationId: application.id || extra.applicationId || null,
    firstName: application.firstName || extra.firstName || '',
    lastName: application.lastName || extra.lastName || '',
    fullName:
      extra.fullName ||
      [application.firstName || extra.firstName, application.lastName || extra.lastName]
        .filter(Boolean)
        .join(' ')
        .trim(),
    email: application.email || extra.email || '',
    phone: application.phone || extra.phone || '',
    jobTitle: application.job?.title || extra.jobTitle || '',
    cityName: application.job?.city?.city || extra.cityName || '',
    currentStage: application.currentStage || extra.currentStage || '',
    stageLabelHuman: extra.stageLabelHuman || '',
    dashboardUrl: extra.dashboardUrl || process.env.DRIVER_DASHBOARD_URL || process.env.APP_BASE_URL || '',
    companyName: PRODUCT_DISPLAY_NAME,
    firstBlockDate: firstBlockDateISO,
    firstBlockDateHuman,
    ...extra,
  };
}

export async function getNotificationMatrix() {
  const templates = await prisma.messageTemplate.findMany({
    where: { locale: 'en' },
    orderBy: [{ eventKey: 'asc' }, { channel: 'asc' }],
  });

  const matrix = {};
  for (const template of templates) {
    if (!matrix[template.eventKey]) {
      matrix[template.eventKey] = { eventKey: template.eventKey, email: null, sms: null };
    }
    if (template.channel === 'email' || template.channel === 'sms') {
      matrix[template.eventKey][template.channel] = template;
    }
  }
  return Object.values(matrix);
}

export async function dispatchNotifications(eventKey, application = {}, extraVariables = {}) {
  const key = String(eventKey || '').trim();
  if (!key) return [];

  const templates = await prisma.messageTemplate.findMany({
    where: {
      eventKey: key,
      locale: 'en',
      isActive: true,
    },
    select: { channel: true },
  });

  const channels = [...new Set(templates.map((t) => t.channel))];
  if (channels.length === 0) return [];

  const variables = buildVariables(application, extraVariables);
  const tasks = channels.map(async (channel) => {
    if (channel === 'email' && variables.email) {
      return sendTemplatedEmail(key, variables.email, variables);
    }
    if (channel === 'sms' && variables.phone) {
      return sendTemplatedSms(key, variables.phone, variables);
    }
    return { status: 'skipped', reason: `Missing recipient for channel ${channel}` };
  });

  const settled = await Promise.allSettled(tasks);
  return settled.map((result) =>
    result.status === 'fulfilled' ? result.value : { status: 'failed', reason: result.reason?.message }
  );
}
