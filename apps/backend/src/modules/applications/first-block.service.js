import prisma from '../../lib/prisma.js';
import { STAGES } from '../workflow/transition-matrix.js';
import { transitionApplication } from '../workflow/stage-engine.js';
import { dispatchNotifications } from '../communications/notification.service.js';

export class FirstBlockServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'FirstBlockServiceError';
    this.statusCode = statusCode;
  }
}

function toId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new FirstBlockServiceError('Invalid application id.', 400);
  }
  return id;
}

function toDate(raw) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new FirstBlockServiceError('Invalid date value.', 400);
  }
  return d;
}

function startOfUtcDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x.getTime();
}

function blockQueueStatus(firstBlockDate) {
  if (!firstBlockDate) return 'unscheduled';
  const block = startOfUtcDay(firstBlockDate);
  const today = startOfUtcDay(new Date());
  if (block < today) return 'past_due';
  if (block === today) return 'today';
  return 'upcoming';
}

async function getApplication(applicationId, prismaClient = prisma) {
  const app = await prismaClient.application.findUnique({
    where: { id: toId(applicationId) },
    include: {
      job: { include: { city: true } },
    },
  });
  if (!app) throw new FirstBlockServiceError('Application not found.', 404);
  return app;
}

/**
 * @param {unknown} applicationId
 * @param {unknown} blockDate
 * @param {string} [adminEmail]
 * @param {Record<string, unknown>} [metadata]
 * @param {import('@prisma/client').PrismaClient} [prismaClient]
 */
export async function assignFirstBlock(applicationId, blockDate, adminEmail, metadata, prismaClient = prisma) {
  const app = await getApplication(applicationId, prismaClient);
  if (app.currentStage !== STAGES.APPROVED) {
    throw new FirstBlockServiceError('Application must be in approved stage to assign a first block.', 400);
  }
  const when = toDate(blockDate);
  const actor = String(adminEmail || '').trim().toLowerCase() || null;

  await prismaClient.application.update({
    where: { id: app.id },
    data: { firstBlockDate: when, firstBlockResult: null },
  });

  return transitionApplication(
    app.id,
    STAGES.FIRST_BLOCK_ASSIGNED,
    {
      actorEmail: actor,
      actorType: 'admin',
      reason: 'first_block_assigned',
      metadata: { ...(metadata && typeof metadata === 'object' ? metadata : {}), firstBlockDate: when.toISOString() },
    },
    prismaClient
  );
}

/**
 * @param {unknown} applicationId
 * @param {'passed'|'failed'} result
 * @param {string} [adminEmail]
 * @param {string} [notes]
 * @param {import('@prisma/client').PrismaClient} [prismaClient]
 */
export async function recordBlockResult(applicationId, result, adminEmail, notes, prismaClient = prisma) {
  const r = String(result || '').trim().toLowerCase();
  if (r !== 'passed' && r !== 'failed') {
    throw new FirstBlockServiceError('result must be "passed" or "failed".', 400);
  }
  const app = await getApplication(applicationId, prismaClient);
  if (app.currentStage !== STAGES.FIRST_BLOCK_ASSIGNED) {
    throw new FirstBlockServiceError('Application must be in first_block_assigned stage.', 400);
  }
  const actor = String(adminEmail || '').trim().toLowerCase() || null;
  const cleanNotes = String(notes || '').trim();

  if (cleanNotes) {
    await prismaClient.applicationNote.create({
      data: {
        applicationId: app.id,
        authorEmail: actor || 'system',
        content: `[First block] Result: ${r}. ${cleanNotes}`,
      },
    });
  }

  await prismaClient.application.update({
    where: { id: app.id },
    data: { firstBlockResult: r },
  });

  if (r === 'passed') {
    return transitionApplication(
      app.id,
      STAGES.ACTIVE,
      {
        actorEmail: actor,
        actorType: 'admin',
        reason: 'first_block_passed',
        metadata: { notes: cleanNotes || null },
      },
      prismaClient
    );
  }

  await transitionApplication(
    app.id,
    STAGES.FIRST_BLOCK_FAILED,
    {
      actorEmail: actor,
      actorType: 'admin',
      reason: 'first_block_failed',
      metadata: { notes: cleanNotes || null },
    },
    prismaClient
  );

  await prismaClient.application.update({
    where: { id: app.id },
    data: { rejectedAt: new Date(), rejectionReason: 'failed_first_block', approvedAt: null },
  });

  return transitionApplication(
    app.id,
    STAGES.REJECTED,
    {
      actorEmail: actor,
      actorType: 'admin',
      reason: 'failed_first_block',
      metadata: { notes: cleanNotes || null, source: 'first_block' },
    },
    prismaClient
  );
}

/**
 * @param {unknown} applicationId
 * @param {unknown} newDate
 * @param {string} [adminEmail]
 * @param {string} [reason]
 * @param {import('@prisma/client').PrismaClient} [prismaClient]
 */
export async function rescheduleBlock(applicationId, newDate, adminEmail, reason, prismaClient = prisma) {
  const app = await getApplication(applicationId, prismaClient);
  if (app.currentStage !== STAGES.FIRST_BLOCK_ASSIGNED) {
    throw new FirstBlockServiceError('Application must be in first_block_assigned stage.', 400);
  }
  const when = toDate(newDate);
  const actor = String(adminEmail || '').trim().toLowerCase() || null;
  const cleanReason = String(reason || '').trim();

  await prismaClient.application.update({
    where: { id: app.id },
    data: { firstBlockDate: when },
  });

  await prismaClient.applicationStageHistory.create({
    data: {
      applicationId: app.id,
      fromStage: app.currentStage,
      toStage: app.currentStage,
      reason: 'first_block_rescheduled',
      actorEmail: actor,
      actorType: 'admin',
      metadata: { firstBlockDate: when.toISOString(), rescheduleReason: cleanReason || null },
    },
  });

  const refreshed = await prismaClient.application.findUnique({
    where: { id: app.id },
    include: {
      job: { select: { title: true, region: { select: { name: true } } } },
    },
  });

  void dispatchNotifications('stage.first_block_rescheduled', refreshed, {
    firstBlockDate: when.toISOString(),
    firstBlockDateHuman: when.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' }),
  }).catch(() => {});

  return refreshed;
}

/**
 * @param {object} filters
 * @param {import('@prisma/client').PrismaClient} [prismaClient]
 */
export async function getBlockQueue(filters = {}, prismaClient = prisma) {
  const cityId = (filters.cityId ?? filters.regionId) != null && (filters.cityId ?? filters.regionId) !== '' ? Number(filters.cityId ?? filters.regionId) : null;
  const where = {
    currentStage: STAGES.FIRST_BLOCK_ASSIGNED,
    ...(Number.isInteger(cityId) && cityId > 0 ? { job: { cityId } } : {}),
  };

  const rows = await prismaClient.application.findMany({
    where,
    orderBy: [{ firstBlockDate: 'asc' }, { id: 'asc' }],
    include: {
      job: { select: { id: true, title: true, region: { select: { id: true, name: true, code: true } } } },
    },
  });

  const mapped = rows.map((a) => {
    const name = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email;
    const status = blockQueueStatus(a.firstBlockDate);
    return {
      id: a.id,
      name,
      email: a.email,
      phone: a.phone,
      city: a.city,
      vehicleType: a.vehicleType,
      firstBlockDate: a.firstBlockDate,
      blockStatus: status,
      jobTitle: a.job?.title,
      cityName: a.job?.city?.city,
    };
  });

  const upcoming = mapped.filter((m) => m.blockStatus === 'upcoming');
  const today = mapped.filter((m) => m.blockStatus === 'today');
  const pastDue = mapped.filter((m) => m.blockStatus === 'past_due');
  const unscheduled = mapped.filter((m) => m.blockStatus === 'unscheduled');

  return {
    all: mapped,
    upcoming,
    today,
    pastDue,
    unscheduled,
  };
}
