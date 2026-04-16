import prisma from '../../lib/prisma.js';
import sanitizeHtml from 'sanitize-html';
import { performTransition, WorkflowError } from '../workflow/stage-engine.js';
import { STAGES, STAGE_SLA_HOURS } from '../workflow/transition-matrix.js';
import { createApplicationSchema, formatZodError } from './application.schemas.js';
import {
  cancelContract,
  getContractStatus,
  markContractAsSigned,
  resendContract,
  sendContract,
} from '../integrations/dropbox-sign/contract.service.js';

export class ApplicationServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ApplicationServiceError';
    this.statusCode = statusCode;
  }
}

const STAGE_LABELS = {
  applied: 'Applied',
  pending_review: 'Under Review',
  screening: 'Screening',
  acknowledgements: 'Acknowledgements',
  contract_sent: 'Contract Sent',
  contract_signed: 'Contract Signed',
  documents_pending: 'Documents Pending',
  documents_under_review: 'Documents Under Review',
  payment_details_pending: 'Payment Details Pending',
  onboarding_call: 'Onboarding Call',
  questionnaire: 'Questionnaire',
  decision_pending: 'Decision Pending',
  approved: 'Approved',
  first_block_assigned: 'First Block Assigned',
  active: 'Active',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  first_block_failed: 'First Block Failed',
};

function parseStageFilter(stage) {
  if (!stage) return [];
  if (Array.isArray(stage)) return stage.filter(Boolean);
  if (typeof stage === 'string') {
    return stage
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function parseListFilter(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function parseBool(value) {
  if (value === true || value === 'true' || value === '1' || value === 1) return true;
  if (value === false || value === 'false' || value === '0' || value === 0) return false;
  return null;
}

function asDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDurationMs(value) {
  const d = asDate(value);
  if (!d) return null;
  return Math.max(0, Date.now() - d.getTime());
}

function toApplicationSummary(app) {
  const timeInCurrentStageMs = toDurationMs(app.currentStageEnteredAt);
  const slaHours = STAGE_SLA_HOURS[app.currentStage];
  const slaHoursRemaining =
    slaHours != null && timeInCurrentStageMs != null
      ? Number((slaHours - timeInCurrentStageMs / (1000 * 60 * 60)).toFixed(2))
      : null;
  return {
    id: app.id,
    firstName: app.firstName,
    lastName: app.lastName,
    name: `${app.firstName} ${app.lastName}`.trim(),
    email: app.email,
    city: app.city,
    vehicleType: app.vehicleType,
    currentStage: app.currentStage,
    currentStageLabel: STAGE_LABELS[app.currentStage] || app.currentStage,
    createdAt: app.createdAt,
    currentStageEnteredAt: app.currentStageEnteredAt,
    timeInCurrentStageMs,
    isOverdue: slaHoursRemaining != null ? slaHoursRemaining < 0 : false,
    slaHoursRemaining,
  };
}

function buildApplicationWhere(filters = {}) {
  const where = {};
  const and = [];
  const search = filters.search?.trim();
  const stages = parseListFilter(filters.stages).length
    ? parseListFilter(filters.stages)
    : parseStageFilter(filters.stage);
  const regionIds = parseListFilter(filters.cityIds ?? filters.regionIds).length
    ? parseListFilter(filters.cityIds ?? filters.regionIds)
    : parseListFilter(filters.cityId ?? filters.regionId);
  const jobIds = parseListFilter(filters.jobIds).length
    ? parseListFilter(filters.jobIds)
    : parseListFilter(filters.jobId);
  const vehicleTypes = parseListFilter(filters.vehicleTypes);
  const contractStatuses = parseListFilter(filters.contractStatus);

  if (stages.length > 0) {
    and.push({ currentStage: { in: stages } });
  }

  const parsedJobIds = jobIds.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0);
  if (parsedJobIds.length > 0) {
    and.push({ jobId: { in: parsedJobIds } });
  }

  const parsedRegionIds = regionIds.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0);
  if (parsedRegionIds.length > 0) {
    and.push({ job: { cityId: { in: parsedRegionIds } } });
  }

  if (vehicleTypes.length > 0) {
    and.push({ vehicleType: { in: vehicleTypes } });
  }

  if (search) {
    and.push({
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  const createdAt = {};
  const dateFrom = asDate(filters.dateFrom);
  const dateTo = asDate(filters.dateTo);
  if (dateFrom) createdAt.gte = dateFrom;
  if (dateTo) createdAt.lte = dateTo;
  if (Object.keys(createdAt).length > 0) {
    and.push({ createdAt });
  }

  const stageEnteredAt = {};
  const stageEnteredFrom = asDate(filters.stageEnteredFrom);
  const stageEnteredTo = asDate(filters.stageEnteredTo);
  if (stageEnteredFrom) stageEnteredAt.gte = stageEnteredFrom;
  if (stageEnteredTo) stageEnteredAt.lte = stageEnteredTo;
  if (Object.keys(stageEnteredAt).length > 0) {
    and.push({ currentStageEnteredAt: stageEnteredAt });
  }

  const hasDocuments = parseBool(filters.hasDocuments);
  if (hasDocuments === true) {
    and.push({ documents: { some: {} } });
  } else if (hasDocuments === false) {
    and.push({ documents: { none: {} } });
  }

  if (contractStatuses.length > 0) {
    and.push({ contractStatus: { in: contractStatuses } });
  }

  if (and.length === 1) return { where: and[0], parsed: { search, stages, parsedRegionIds, parsedJobIds, vehicleTypes, contractStatuses, dateFrom, dateTo, stageEnteredFrom, stageEnteredTo, hasDocuments } };
  if (and.length > 1) where.AND = and;
  return {
    where,
    parsed: {
      search,
      stages,
      parsedRegionIds,
      parsedJobIds,
      vehicleTypes,
      contractStatuses,
      dateFrom,
      dateTo,
      stageEnteredFrom,
      stageEnteredTo,
      hasDocuments,
    },
  };
}

/**
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 */
async function loadApplyContextOrThrow(tx, rawSlug) {
  const normalized = typeof rawSlug === 'string' ? rawSlug.trim() : '';
  if (!normalized) {
    throw new ApplicationServiceError('Invalid job link.', 400);
  }
  const link = await tx.jobPublicLink.findUnique({
    where: { slug: normalized },
    include: {
      job: { include: { city: true } },
    },
  });
  if (!link?.job) {
    throw new ApplicationServiceError('This position is no longer accepting applications.', 400);
  }
  const now = new Date();
  if (!link.isActive) {
    throw new ApplicationServiceError('This position is no longer accepting applications.', 400);
  }
  if (link.expiresAt && link.expiresAt < now) {
    throw new ApplicationServiceError('This position is no longer accepting applications.', 400);
  }
  if (!link.job.isPublished || link.job.closedAt) {
    throw new ApplicationServiceError('This position is no longer accepting applications.', 400);
  }
  return { jobId: link.job.id, job: link.job };
}

export async function submitApplication(raw) {
  let data;
  try {
    data = createApplicationSchema.parse(raw);
  } catch (e) {
    throw new ApplicationServiceError(formatZodError(e), 400);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const { jobId, job } = await loadApplyContextOrThrow(tx, data.jobSlug);

      const existing = await tx.application.findUnique({
        where: {
          jobId_email: { jobId, email: data.email },
        },
      });
      if (existing) {
        throw new ApplicationServiceError(
          'You have already applied for this position with this email.',
          409
        );
      }

      const app = await tx.application.create({
        data: {
          jobId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          vehicleType: data.vehicleType ?? null,
          vehicleDetails: data.vehicleDetails?.trim() || null,
          addressLine1: data.addressLine1?.trim() || null,
          addressLine2: data.addressLine2?.trim() || null,
          city: data.city?.trim() || null,
          postcode: data.postcode?.trim() || null,
          country: data.country?.trim() || null,
          source: data.source ?? 'job_portal',
          currentStage: STAGES.APPLIED,
          currentStageEnteredAt: new Date(),
        },
      });

      await tx.applicationStageHistory.create({
        data: {
          applicationId: app.id,
          fromStage: null,
          toStage: STAGES.APPLIED,
          actorType: 'system',
          actorEmail: null,
          reason: null,
          metadata: { source: 'public_apply' },
        },
      });

      const withJob = await tx.application.findUnique({
        where: { id: app.id },
        include: { job: { select: { cityId: true } } },
      });

      await performTransition(tx, withJob, STAGES.PENDING_REVIEW, {
        actorType: 'system',
        actorEmail: null,
        reason: null,
        metadata: { source: 'auto_after_apply' },
      });

      const finalApp = await tx.application.findUnique({
        where: { id: app.id },
        select: {
          id: true,
          currentStage: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      });

      return { application: finalApp, jobTitle: job.title };
    });

    return result;
  } catch (e) {
    if (e instanceof ApplicationServiceError) {
      throw e;
    }
    if (e instanceof WorkflowError) {
      throw new ApplicationServiceError(e.message, e.statusCode);
    }
    if (e.code === 'P2002') {
      throw new ApplicationServiceError(
        'You have already applied for this position with this email.',
        409
      );
    }
    throw e;
  }
}

export async function getApplication(id) {
  const appId = Number(id);
  if (!Number.isInteger(appId) || appId <= 0) {
    throw new ApplicationServiceError('Invalid application id.', 400);
  }
  const application = await prisma.application.findUnique({
    where: { id: appId },
    include: {
      job: { include: { city: true, contractTemplate: true } },
      driver: { include: { onboardingSteps: true } },
      stageHistory: { orderBy: { occurredAt: 'asc' } },
      tasks: { orderBy: { createdAt: 'asc' } },
      documents: { orderBy: { uploadedAt: 'desc' } },
      notes: { orderBy: { createdAt: 'desc' } },
      questionnaireResponses: {
        orderBy: { submittedAt: 'desc' },
        include: {
          questionnaire: {
            include: {
              questions: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      },
    },
  });
  if (!application) {
    throw new ApplicationServiceError('Application not found.', 404);
  }
  const requiredScreeningSteps = [
    'confirm_details',
    'introduction',
    'about',
    'role',
    'availability',
    'facility_locations',
    'blocks_classification',
    'fee_structure',
    'payment_cycle_schedule',
    'routes_policy',
    'cancellation_policy',
    'smoking_fitness_check',
    'liabilities',
  ];
  const labels = {
    confirm_details: 'Personal Details',
    introduction: 'Introduction',
    about: 'Company Overview',
    role: 'Role Understanding',
    availability: 'Availability',
    facility_locations: 'Facility Locations',
    blocks_classification: 'Blocks Classification',
    fee_structure: 'Fee Structure',
    payment_cycle_schedule: 'Payment Cycle',
    routes_policy: 'Route Policy',
    cancellation_policy: 'Cancellation Policy',
    smoking_fitness_check: 'Health & Fitness Check',
    liabilities: 'Liabilities',
  };
  const stepMap = new Map((application.driver?.onboardingSteps || []).map((s) => [s.stepName, s]));
  const steps = requiredScreeningSteps.map((name) => {
    const row = stepMap.get(name);
    return {
      name,
      label: labels[name] || name,
      completed: Boolean(row?.isConfirmed),
      completedAt: row?.confirmedAt || null,
    };
  });
  const completedSteps = steps.filter((s) => s.completed).length;
  application.screeningProgress = {
    totalSteps: steps.length,
    completedSteps,
    percentage: steps.length ? Math.round((completedSteps / steps.length) * 100) : 0,
    steps,
  };
  return application;
}

export async function getApplicationDetail(id) {
  return getApplication(id);
}

export async function getApplicationsByJob(jobId, filters = {}) {
  const jid = Number(jobId);
  if (!Number.isInteger(jid) || jid <= 0) {
    throw new ApplicationServiceError('Invalid job id.', 400);
  }
  const where = { jobId: jid };
  if (filters.stage) {
    where.currentStage = filters.stage;
  }
  return prisma.application.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      job: { select: { id: true, title: true } },
    },
  });
}

export async function getAllApplications(filters = {}) {
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 25));
  const skip = (page - 1) * pageSize;

  const { where, parsed } = buildApplicationWhere(filters);

  const sortFieldMap = {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    currentStageEnteredAt: 'currentStageEnteredAt',
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
  };
  const sortBy = sortFieldMap[filters.sortBy] || 'createdAt';
  const sortOrder = String(filters.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

  const [items, total, emailDeliveryFailedRows] = await Promise.all([
    prisma.application.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            city: { select: { id: true, city: true, cityCode: true } },
          },
        },
        documents: { select: { status: true } },
        paymentDetails: { select: { id: true } },
      },
    }),
    prisma.application.count({ where }),
    prisma.communicationLog.findMany({
      where: {
        channel: 'email',
        status: { in: ['bounced', 'complained', 'failed'] },
      },
      select: { applicationId: true },
      distinct: ['applicationId'],
    }),
  ]);
  const emailDeliveryFailedIds = new Set(
    emailDeliveryFailedRows.map((r) => r.applicationId).filter((v) => Number.isInteger(v))
  );

  const applications = items.map((app) => {
    const docSummary = app.documents.reduce((acc, d) => {
      const key = d.status || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return {
      id: app.id,
      firstName: app.firstName,
      lastName: app.lastName,
      name: `${app.firstName} ${app.lastName}`.trim(),
      email: app.email,
      phone: app.phone,
      city: app.city,
      vehicleType: app.vehicleType,
      currentStage: app.currentStage,
      currentStageLabel: STAGE_LABELS[app.currentStage] || app.currentStage,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      currentStageEnteredAt: app.currentStageEnteredAt,
      timeInCurrentStageMs: toDurationMs(app.currentStageEnteredAt),
      isOverdue:
        STAGE_SLA_HOURS[app.currentStage] != null
          ? toDurationMs(app.currentStageEnteredAt) > STAGE_SLA_HOURS[app.currentStage] * 60 * 60 * 1000
          : false,
      slaHoursRemaining:
        STAGE_SLA_HOURS[app.currentStage] != null
          ? Number(
              (
                STAGE_SLA_HOURS[app.currentStage] -
                (toDurationMs(app.currentStageEnteredAt) || 0) / (1000 * 60 * 60)
              ).toFixed(2)
            )
          : null,
      contractStatus: app.contractStatus,
      onboardingCallScheduledAt: app.onboardingCallScheduledAt,
      onboardingCallCompletedAt: app.onboardingCallCompletedAt,
      onboardingCallNotes: app.onboardingCallNotes,
      job: app.job,
      jobTitle: app.job?.title || null,
      cityName: app.job?.city?.city || null,
      documentSummary: {
        total: app.documents.length,
        byStatus: docSummary,
      },
      adminNotes: app.adminNotes,
      hasPaymentDetails: Boolean(app.paymentDetails),
      emailDeliveryFailed: emailDeliveryFailedIds.has(app.id),
    };
  });

  return {
    applications,
    pagination: {
      page,
      pageSize,
      totalCount: total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
    filters: {
      search: parsed.search || '',
      stage: parsed.stages,
      stages: parsed.stages,
      cityIds: parsed.parsedRegionIds,
      jobIds: parsed.parsedJobIds,
      vehicleTypes: parsed.vehicleTypes,
      dateFrom: parsed.dateFrom,
      dateTo: parsed.dateTo,
      stageEnteredFrom: parsed.stageEnteredFrom,
      stageEnteredTo: parsed.stageEnteredTo,
      hasDocuments: parsed.hasDocuments,
      contractStatus: parsed.contractStatuses,
      sortBy,
      sortOrder,
    },
  };
}

export async function getApplicationsByStage(filters = {}) {
  const { where, parsed } = buildApplicationWhere(filters);

  const items = await prisma.application.findMany({
    where,
    orderBy: [{ currentStageEnteredAt: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      city: true,
      vehicleType: true,
      currentStage: true,
      createdAt: true,
      currentStageEnteredAt: true,
    },
  });

  const grouped = {};
  for (const app of items) {
    if (!grouped[app.currentStage]) {
      grouped[app.currentStage] = { count: 0, applications: [] };
    }
    grouped[app.currentStage].applications.push(toApplicationSummary(app));
    grouped[app.currentStage].count += 1;
  }

  return {
    grouped,
    filters: {
      search: parsed.search || '',
      stage: parsed.stages,
      stages: parsed.stages,
      cityIds: parsed.parsedRegionIds,
      jobIds: parsed.parsedJobIds,
      vehicleTypes: parsed.vehicleTypes,
      dateFrom: parsed.dateFrom,
      dateTo: parsed.dateTo,
      stageEnteredFrom: parsed.stageEnteredFrom,
      stageEnteredTo: parsed.stageEnteredTo,
      hasDocuments: parsed.hasDocuments,
      contractStatus: parsed.contractStatuses,
    },
  };
}

function csvCell(value) {
  const str = value == null ? '' : String(value);
  return `"${str.replaceAll('"', '""')}"`;
}

export async function exportApplications(filters = {}, format = 'csv') {
  if (format !== 'csv') {
    throw new ApplicationServiceError('Unsupported export format.', 400);
  }
  const { where } = buildApplicationWhere(filters);
  const items = await prisma.application.findMany({
    where,
    take: 5000,
    orderBy: { createdAt: 'desc' },
    include: {
      job: {
        select: {
          title: true,
          city: { select: { city: true } },
        },
      },
      documents: { select: { status: true } },
    },
  });

  const header = [
    'ID',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'City',
    'Vehicle Type',
    'Job Title',
    'City',
    'Current Stage',
    'Applied Date',
    'Time in Current Stage',
    'Contract Status',
    'Documents Status',
  ];

  const rows = items.map((app) => {
    const byStatus = app.documents.reduce((acc, d) => {
      acc[d.status || 'unknown'] = (acc[d.status || 'unknown'] || 0) + 1;
      return acc;
    }, {});
    const docStatus = Object.entries(byStatus)
      .map(([status, count]) => `${status}:${count}`)
      .join('; ');
    return [
      app.id,
      app.firstName,
      app.lastName,
      app.email,
      app.phone,
      app.city,
      app.vehicleType,
      app.job?.title,
      app.job?.city?.city,
      app.currentStage,
      app.createdAt?.toISOString(),
      toDurationMs(app.currentStageEnteredAt),
      app.contractStatus || '',
      docStatus || (app.documents.length > 0 ? 'submitted' : 'none'),
    ];
  });

  const csv = [header, ...rows].map((line) => line.map(csvCell).join(',')).join('\n');
  return { csv, count: items.length };
}

export async function getRecentActivity(limit = 20, offset = 0, filters = {}) {
  const take = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = Math.max(0, Number(offset) || 0);
  const where = {};
  if (filters.actorEmail) where.actorEmail = String(filters.actorEmail).trim().toLowerCase();
  if (filters.cityId != null && filters.cityId !== '') {
    const cid = Number(filters.cityId);
    if (Number.isInteger(cid) && cid > 0) {
      where.application = { job: { cityId: cid } };
    }
  } else if (filters.regionId != null && filters.regionId !== '') {
    const rid = Number(filters.regionId);
    if (Number.isInteger(rid) && rid > 0) {
      where.application = { job: { cityId: rid } };
    }
  }

  const [items, total] = await Promise.all([
    prisma.applicationStageHistory.findMany({
      where,
      skip,
      take,
      orderBy: { occurredAt: 'desc' },
      include: {
        application: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
    prisma.applicationStageHistory.count({ where }),
  ]);

  return {
    items: items.map((row) => ({
      id: row.id,
      applicationId: row.applicationId,
      applicantName: `${row.application?.firstName || ''} ${row.application?.lastName || ''}`.trim(),
      applicantEmail: row.application?.email || null,
      fromStage: row.fromStage,
      toStage: row.toStage,
      actorEmail: row.actorEmail,
      actorType: row.actorType,
      reason: row.reason,
      occurredAt: row.occurredAt,
    })),
    pagination: {
      limit: take,
      offset: skip,
      total,
      hasMore: skip + take < total,
    },
  };
}

export async function quickSearchApplications(query, limit = 5) {
  const q = String(query || '').trim();
  if (!q) return [];
  const take = Math.min(20, Math.max(1, Number(limit) || 5));
  const items = await prisma.application.findMany({
    where: {
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
      ],
    },
    take,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      currentStage: true,
    },
  });
  return items;
}

export async function getApplicationByEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new ApplicationServiceError('Email is required.', 400);
  }
  const normalized = email.toLowerCase().trim();
  return prisma.application.findMany({
    where: { email: normalized },
    orderBy: { createdAt: 'desc' },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          city: { select: { id: true, city: true, cityCode: true } },
        },
      },
    },
  });
}

export async function getApplicationStats() {
  const byStageRaw = await prisma.application.groupBy({
    by: ['currentStage'],
    _count: { id: true },
  });
  const byStage = Object.fromEntries(
    byStageRaw.map((row) => [row.currentStage, row._count.id])
  );
  const total = Object.values(byStage).reduce((a, b) => a + b, 0);

  const byCityRaw = await prisma.$queryRaw`
    SELECT c.id AS "cityId", c.city AS "cityName", COUNT(a.id)::int AS count
    FROM applications a
    INNER JOIN jobs j ON j.id = a.job_id
    INNER JOIN cities c ON c.id = j.city_id
    GROUP BY c.id, c.city
    ORDER BY c.city ASC
  `;

  return {
    total,
    byStage,
    byCity: byCityRaw,
  };
}

export async function updateApplicationNotes(applicationId, notes, adminEmail) {
  const id = Number(applicationId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApplicationServiceError('Invalid application id.', 400);
  }
  const nextNotes =
    typeof notes === 'string'
      ? sanitizeHtml(notes.trim(), { allowedTags: [], allowedAttributes: {} })
      : '';
  const updated = await prisma.application.update({
    where: { id },
    data: {
      adminNotes: nextNotes || null,
      updatedAt: new Date(),
    },
  });

  await prisma.applicationStageHistory.create({
    data: {
      applicationId: id,
      fromStage: updated.currentStage,
      toStage: updated.currentStage,
      actorEmail: adminEmail || null,
      actorType: 'admin',
      reason: 'admin_notes_updated',
      metadata: { notesUpdated: true },
    },
  });

  return updated;
}

export async function getApplicationNotes(applicationId) {
  const id = Number(applicationId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApplicationServiceError('Invalid application id.', 400);
  }
  return prisma.applicationNote.findMany({
    where: { applicationId: id },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addApplicationNote(applicationId, content, authorEmail) {
  const id = Number(applicationId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApplicationServiceError('Invalid application id.', 400);
  }
  const note = sanitizeHtml(String(content || '').trim(), { allowedTags: [], allowedAttributes: {} });
  if (!note) {
    throw new ApplicationServiceError('Note content is required.', 400);
  }
  const email = String(authorEmail || '').trim().toLowerCase();
  if (!email) {
    throw new ApplicationServiceError('Author is required.', 400);
  }
  return prisma.applicationNote.create({
    data: {
      applicationId: id,
      authorEmail: email,
      content: note,
    },
  });
}

export async function sendApplicationContract(applicationId) {
  const id = Number(applicationId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApplicationServiceError('Invalid application id.', 400);
  }
  const app = await prisma.application.findUnique({
    where: { id },
    select: { id: true, currentStage: true },
  });
  if (!app) throw new ApplicationServiceError('Application not found.', 404);

  if (app.currentStage === STAGES.ACKNOWLEDGEMENTS) {
    return transitionApplication(
      id,
      STAGES.CONTRACT_SENT,
      {
        actorType: 'admin',
        reason: 'manual_contract_send',
        metadata: { source: 'admin_contract_action' },
      },
      prisma
    );
  }

  return sendContract(id, prisma);
}

export async function getApplicationContractStatus(applicationId) {
  return getContractStatus(applicationId, prisma);
}

export async function resendApplicationContract(applicationId) {
  return resendContract(applicationId, prisma);
}

export async function cancelApplicationContract(applicationId) {
  return cancelContract(applicationId, prisma);
}

export async function markApplicationContractSigned(applicationId) {
  return markContractAsSigned(applicationId, prisma);
}
