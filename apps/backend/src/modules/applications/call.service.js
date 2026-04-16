import prisma from '../../lib/prisma.js';
import { STAGES } from '../workflow/transition-matrix.js';
import { transitionApplication } from '../workflow/stage-engine.js';
import { dispatchNotifications } from '../communications/notification.service.js';

export class CallServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'CallServiceError';
    this.statusCode = statusCode;
  }
}

function toId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new CallServiceError('Invalid application id.', 400);
  }
  return id;
}

function toDate(raw) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new CallServiceError('Invalid scheduledAt value.', 400);
  }
  return d;
}

async function getApplication(applicationId, prismaClient = prisma) {
  const app = await prismaClient.application.findUnique({
    where: { id: toId(applicationId) },
    include: {
      job: { include: { city: true } },
    },
  });
  if (!app) throw new CallServiceError('Application not found.', 404);
  return app;
}

export async function scheduleCall(applicationId, scheduledAt, adminEmail, prismaClient = prisma) {
  const app = await getApplication(applicationId, prismaClient);
  if (app.currentStage !== STAGES.ONBOARDING_CALL) {
    throw new CallServiceError('Application must be in onboarding_call stage.', 400);
  }
  const scheduledDate = toDate(scheduledAt);

  const updated = await prismaClient.application.update({
    where: { id: app.id },
    data: { onboardingCallScheduledAt: scheduledDate },
  });
  await prismaClient.applicationStageHistory.create({
    data: {
      applicationId: app.id,
      fromStage: app.currentStage,
      toStage: app.currentStage,
      reason: 'onboarding_call_scheduled',
      actorEmail: String(adminEmail || '').trim().toLowerCase() || null,
      actorType: 'admin',
      metadata: { scheduledAt: scheduledDate.toISOString() },
    },
  });
  void dispatchNotifications('stage.onboarding_call', app, {
    scheduledAt: scheduledDate.toISOString(),
    scheduledAtHuman: scheduledDate.toLocaleString(),
  }).catch(() => {});
  return updated;
}

export async function completeCall(applicationId, adminEmail, notes, prismaClient = prisma) {
  const app = await getApplication(applicationId, prismaClient);
  if (app.currentStage !== STAGES.ONBOARDING_CALL) {
    throw new CallServiceError('Application must be in onboarding_call stage.', 400);
  }
  const cleanNotes = String(notes || '').trim();

  await prismaClient.application.update({
    where: { id: app.id },
    data: {
      onboardingCallCompletedAt: new Date(),
      onboardingCallNotes: cleanNotes || null,
    },
  });

  const transitionResult = await transitionApplication(
    app.id,
    STAGES.QUESTIONNAIRE,
    {
      actorEmail: String(adminEmail || '').trim().toLowerCase() || null,
      actorType: 'admin',
      reason: 'onboarding_call_completed',
      metadata: { notes: cleanNotes || null, source: 'admin_call_completion' },
    },
    prismaClient
  );
  return transitionResult;
}

export async function rescheduleCall(applicationId, scheduledAt, adminEmail, reason = '', prismaClient = prisma) {
  const app = await getApplication(applicationId, prismaClient);
  if (app.currentStage !== STAGES.ONBOARDING_CALL) {
    throw new CallServiceError('Application must be in onboarding_call stage.', 400);
  }
  const scheduledDate = toDate(scheduledAt);
  const cleanReason = String(reason || '').trim();

  const updated = await prismaClient.application.update({
    where: { id: app.id },
    data: { onboardingCallScheduledAt: scheduledDate },
  });
  await prismaClient.applicationStageHistory.create({
    data: {
      applicationId: app.id,
      fromStage: app.currentStage,
      toStage: app.currentStage,
      reason: 'onboarding_call_rescheduled',
      actorEmail: String(adminEmail || '').trim().toLowerCase() || null,
      actorType: 'admin',
      metadata: { scheduledAt: scheduledDate.toISOString(), rescheduleReason: cleanReason || null },
    },
  });
  void dispatchNotifications('stage.onboarding_call', app, {
    scheduledAt: scheduledDate.toISOString(),
    scheduledAtHuman: scheduledDate.toLocaleString(),
    rescheduled: true,
    rescheduleReason: cleanReason || undefined,
  }).catch(() => {});
  return updated;
}

export async function getCallQueue(prismaClient = prisma) {
  const apps = await prismaClient.application.findMany({
    where: { currentStage: STAGES.ONBOARDING_CALL },
    orderBy: [{ onboardingCallScheduledAt: 'asc' }, { currentStageEnteredAt: 'asc' }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      city: true,
      onboardingCallScheduledAt: true,
      onboardingCallCompletedAt: true,
      onboardingCallNotes: true,
      currentStageEnteredAt: true,
    },
  });
  const appIds = apps.map((app) => app.id);
  const noShowEvents = appIds.length
    ? await prismaClient.applicationStageHistory.findMany({
      where: {
        applicationId: { in: appIds },
        reason: 'onboarding_call_no_show',
      },
      select: { applicationId: true, occurredAt: true },
      orderBy: { occurredAt: 'desc' },
    })
    : [];
  const noShowByApp = noShowEvents.reduce((acc, row) => {
    if (!acc[row.applicationId]) {
      acc[row.applicationId] = { count: 0, lastAt: null };
    }
    acc[row.applicationId].count += 1;
    if (!acc[row.applicationId].lastAt) acc[row.applicationId].lastAt = row.occurredAt;
    return acc;
  }, {});

  const queueItems = apps.map((app) => ({
    id: app.id,
    name: `${app.firstName || ''} ${app.lastName || ''}`.trim(),
    firstName: app.firstName,
    lastName: app.lastName,
    email: app.email,
    phone: app.phone,
    city: app.city,
    scheduledAt: app.onboardingCallScheduledAt,
    completedAt: app.onboardingCallCompletedAt,
    notes: app.onboardingCallNotes,
    status: app.onboardingCallScheduledAt ? 'scheduled' : 'unscheduled',
    stageEnteredAt: app.currentStageEnteredAt,
    noShowCount: noShowByApp[app.id]?.count || 0,
    lastNoShowAt: noShowByApp[app.id]?.lastAt || null,
  }));

  return {
    scheduled: queueItems.filter((item) => item.status === 'scheduled'),
    unscheduled: queueItems.filter((item) => item.status === 'unscheduled'),
    all: queueItems,
  };
}

export async function markCallNoShow(
  applicationId,
  adminEmail,
  { action = 'none', scheduledAt = null, reason = '' } = {},
  prismaClient = prisma
) {
  const app = await getApplication(applicationId, prismaClient);
  if (app.currentStage !== STAGES.ONBOARDING_CALL) {
    throw new CallServiceError('Application must be in onboarding_call stage.', 400);
  }

  const actorEmail = String(adminEmail || '').trim().toLowerCase() || null;
  const cleanReason = String(reason || '').trim() || 'Driver no-show';
  await prismaClient.applicationStageHistory.create({
    data: {
      applicationId: app.id,
      fromStage: app.currentStage,
      toStage: app.currentStage,
      reason: 'onboarding_call_no_show',
      actorEmail,
      actorType: 'admin',
      metadata: { note: cleanReason, action },
    },
  });

  if (action === 'reschedule') {
    if (!scheduledAt) {
      throw new CallServiceError('scheduledAt is required when action is reschedule.', 400);
    }
    await rescheduleCall(app.id, scheduledAt, actorEmail, cleanReason, prismaClient);
    return { status: 'rescheduled' };
  }

  if (action === 'reject') {
    await transitionApplication(
      app.id,
      STAGES.REJECTED,
      {
        actorEmail,
        actorType: 'admin',
        reason: 'onboarding_call_no_show',
        metadata: { note: cleanReason, source: 'admin_call_queue' },
      },
      prismaClient
    );
    return { status: 'rejected' };
  }

  await prismaClient.application.update({
    where: { id: app.id },
    data: { onboardingCallScheduledAt: null },
  });
  return { status: 'marked_no_show' };
}
