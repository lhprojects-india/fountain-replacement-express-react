import prisma from '../../lib/prisma.js';
import { STAGES } from '../workflow/transition-matrix.js';
import { transitionApplication } from '../workflow/stage-engine.js';

export class DecisionServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'DecisionServiceError';
    this.statusCode = statusCode;
  }
}

function toId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new DecisionServiceError('Invalid application id.', 400);
  return id;
}

async function loadApplication(applicationId, prismaClient = prisma) {
  const app = await prismaClient.application.findUnique({
    where: { id: toId(applicationId) },
    include: {
      job: { include: { city: true } },
      driver: { include: { onboardingSteps: true } },
      documents: { orderBy: { uploadedAt: 'desc' } },
      paymentDetails: true,
      stageHistory: { orderBy: { occurredAt: 'asc' } },
      notes: { orderBy: { createdAt: 'desc' } },
      questionnaireResponses: {
        orderBy: { submittedAt: 'desc' },
        include: {
          questionnaire: { include: { questions: { orderBy: { sortOrder: 'asc' } } } },
        },
      },
    },
  });
  if (!app) throw new DecisionServiceError('Application not found.', 404);
  return app;
}

function getLatestByRequirement(submissions = []) {
  const byCode = new Map();
  const sorted = [...submissions].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  for (const row of sorted) {
    if (!byCode.has(row.requirementCode)) byCode.set(row.requirementCode, row);
  }
  return byCode;
}

function computeRecommendation({ questionnaireResult, docsApproved, paymentVerified }) {
  const score = questionnaireResult?.score ?? 0;
  const passed = Boolean(questionnaireResult?.passed);
  if (!passed) return 'reject';
  if (passed && docsApproved && paymentVerified && score >= 80) return 'approve';
  return 'review';
}

export async function getDecisionSummary(applicationId, prismaClient = prisma) {
  const app = await loadApplication(applicationId, prismaClient);

  const [requiredRequirements] = await Promise.all([
    prismaClient.documentRequirement.findMany({
      where: { cityId: app.job.cityId, isRequired: true },
      select: { code: true, name: true },
    }),
  ]);
  const latestByCode = getLatestByRequirement(app.documents || []);
  const requiredLatest = requiredRequirements.map((r) => latestByCode.get(r.code)).filter(Boolean);
  const docsApproved = requiredLatest.length === requiredRequirements.length
    && requiredLatest.every((d) => d.status === 'approved');

  const questionnaireResult = app.questionnaireResponses[0] || null;
  const screeningCompleted = (app.driver?.onboardingSteps || []).length
    ? app.driver.onboardingSteps.every((s) => s.isConfirmed)
    : false;
  const paymentVerified = Boolean(app.paymentDetails?.verifiedAt);

  const recommendation = computeRecommendation({
    questionnaireResult,
    docsApproved,
    paymentVerified,
  });

  return {
    application: {
      id: app.id,
      firstName: app.firstName,
      lastName: app.lastName,
      email: app.email,
      phone: app.phone,
      city: app.city,
      currentStage: app.currentStage,
      approvedAt: app.approvedAt,
      rejectedAt: app.rejectedAt,
      rejectionReason: app.rejectionReason,
    },
    screeningProgress: {
      completed: screeningCompleted,
      total: app.driver?.onboardingSteps?.length || 0,
      done: (app.driver?.onboardingSteps || []).filter((s) => s.isConfirmed).length,
    },
    documentsStatus: {
      totalRequired: requiredRequirements.length,
      approvedRequired: requiredLatest.filter((d) => d.status === 'approved').length,
      allApproved: docsApproved,
    },
    contractStatus: {
      status: app.contractStatus,
      signedAt: app.contractSignedAt,
      isSigned: app.contractStatus === 'signed' || Boolean(app.contractSignedAt),
    },
    paymentDetails: {
      submitted: Boolean(app.paymentDetails),
      verified: paymentVerified,
      submittedAt: app.paymentDetails?.submittedAt || null,
      verifiedAt: app.paymentDetails?.verifiedAt || null,
      details: app.paymentDetails?.details || null,
    },
    callNotes: {
      scheduledAt: app.onboardingCallScheduledAt,
      completedAt: app.onboardingCallCompletedAt,
      notes: app.onboardingCallNotes || null,
    },
    questionnaireResult: questionnaireResult
      ? {
        id: questionnaireResult.id,
        score: questionnaireResult.score,
        passed: questionnaireResult.passed,
        submittedAt: questionnaireResult.submittedAt,
        details: questionnaireResult,
      }
      : null,
    stageTimeline: app.stageHistory,
    adminNotes: app.notes,
    recommendation,
  };
}

export async function approveApplication(applicationId, adminEmail, notes = '', prismaClient = prisma) {
  const app = await loadApplication(applicationId, prismaClient);
  if (app.currentStage !== STAGES.DECISION_PENDING) {
    throw new DecisionServiceError('Application must be in decision_pending stage.', 400);
  }
  const actor = String(adminEmail || '').trim().toLowerCase() || null;
  const cleanNotes = String(notes || '').trim();
  if (cleanNotes) {
    await prismaClient.applicationNote.create({
      data: {
        applicationId: app.id,
        authorEmail: actor || 'system',
        content: `[Decision] Approved. ${cleanNotes}`,
      },
    });
  }
  await prismaClient.application.update({
    where: { id: app.id },
    data: { approvedAt: new Date(), rejectedAt: null, rejectionReason: null },
  });
  return transitionApplication(
    app.id,
    STAGES.APPROVED,
    {
      actorEmail: actor,
      actorType: 'admin',
      reason: 'final_decision_approved',
      metadata: { notes: cleanNotes || null },
    },
    prismaClient
  );
}

export async function rejectApplication(applicationId, adminEmail, reason, notes = '', prismaClient = prisma) {
  const app = await loadApplication(applicationId, prismaClient);
  if (app.currentStage !== STAGES.DECISION_PENDING) {
    throw new DecisionServiceError('Application must be in decision_pending stage.', 400);
  }
  const actor = String(adminEmail || '').trim().toLowerCase() || null;
  const rejectionReason = String(reason || '').trim();
  if (!rejectionReason) {
    throw new DecisionServiceError('Rejection reason is required.', 400);
  }
  const cleanNotes = String(notes || '').trim();
  if (cleanNotes) {
    await prismaClient.applicationNote.create({
      data: {
        applicationId: app.id,
        authorEmail: actor || 'system',
        content: `[Decision] Rejected (${rejectionReason}). ${cleanNotes}`,
      },
    });
  }
  await prismaClient.application.update({
    where: { id: app.id },
    data: { rejectedAt: new Date(), approvedAt: null, rejectionReason },
  });
  return transitionApplication(
    app.id,
    STAGES.REJECTED,
    {
      actorEmail: actor,
      actorType: 'admin',
      reason: rejectionReason,
      metadata: { notes: cleanNotes || null, source: 'decision_engine' },
    },
    prismaClient
  );
}
