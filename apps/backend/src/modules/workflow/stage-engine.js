import {
  isValidTransition,
  REJECTION_ALLOWED_FROM,
  STAGES,
  TRANSITION_MATRIX,
} from './transition-matrix.js';
import { getGuard } from './guards.js';
import { getActions } from './actions.js';

class WorkflowError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'WorkflowError';
    this.statusCode = statusCode;
  }
}

/**
 * Run a validated transition using an existing Prisma transaction client (no nested $transaction).
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {import('@prisma/client').Application & { job?: { cityId: number } }} application
 */
export async function performTransition(tx, application, toStage, { actorEmail, actorType, reason, metadata } = {}) {
  const id = application.id;
  const fromStage = application.currentStage;
  if (!toStage) {
    throw new WorkflowError('Target stage is required.', 400);
  }
  if (!isValidTransition(fromStage, toStage)) {
    throw new WorkflowError(`Invalid stage transition: ${fromStage} -> ${toStage}`, 400);
  }
  if (toStage === STAGES.REJECTED && !REJECTION_ALLOWED_FROM.includes(fromStage)) {
    throw new WorkflowError(`Rejection is not allowed from stage ${fromStage}.`, 400);
  }

  const guard = getGuard(fromStage, toStage);
  const guardResult = await guard(application, tx);
  if (!guardResult?.allowed) {
    throw new WorkflowError(guardResult?.reason || 'Transition guard failed.', 400);
  }

  const transitionMeta = {
    fromStage,
    toStage,
    reason: reason ?? null,
    actorEmail: actorEmail ?? null,
    actorType: actorType ?? 'admin',
    metadata: metadata ?? null,
  };

  const updatedApplication = await tx.application.update({
    where: { id },
    data: {
      currentStage: toStage,
      currentStageEnteredAt: new Date(),
    },
  });

  const history = await tx.applicationStageHistory.create({
    data: {
      applicationId: id,
      fromStage,
      toStage,
      reason: transitionMeta.reason,
      actorEmail: transitionMeta.actorEmail,
      actorType: transitionMeta.actorType,
      metadata: transitionMeta.metadata,
    },
  });

  const actions = getActions(fromStage, toStage);
  for (const action of actions) {
    await action(updatedApplication, transitionMeta, tx);
  }

  return { application: updatedApplication, transition: history };
}

export async function transitionApplication(
  applicationId,
  toStage,
  { actorEmail, actorType, reason, metadata } = {},
  prisma
) {
  const id = Number(applicationId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new WorkflowError('Invalid application id.', 400);
  }
  if (!toStage) {
    throw new WorkflowError('Target stage is required.', 400);
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: { job: { select: { cityId: true } } },
  });

  if (!application) {
    throw new WorkflowError('Application not found.', 404);
  }

  if (
    fromStageIsReopenCandidate(application.currentStage, toStage) &&
    !['super_admin', 'app_admin'].includes(String(metadata?.actorRole || ''))
  ) {
    throw new WorkflowError('Only super_admin or app_admin can re-open applications.', 403);
  }

  return prisma.$transaction(async (tx) => {
    const result = await performTransition(tx, application, toStage, {
      actorEmail,
      actorType,
      reason,
      metadata,
    });

    const summary = await tx.application.findUnique({
      where: { id },
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

    return { ...result, applicationSummary: summary };
  });
}

function fromStageIsReopenCandidate(fromStage, toStage) {
  return toStage === STAGES.PENDING_REVIEW && (fromStage === STAGES.REJECTED || fromStage === STAGES.WITHDRAWN);
}

export async function reopenApplication(applicationId, reason, { actorEmail, actorRole } = {}, prisma) {
  return transitionApplication(
    applicationId,
    STAGES.PENDING_REVIEW,
    {
      actorEmail,
      actorType: 'admin',
      reason: reason || 'application_reopened',
      metadata: { actorRole },
    },
    prisma
  );
}

export async function getApplicationStageHistory(applicationId, prisma) {
  const id = Number(applicationId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new WorkflowError('Invalid application id.', 400);
  }

  const history = await prisma.applicationStageHistory.findMany({
    where: { applicationId: id },
    orderBy: { occurredAt: 'asc' },
  });

  return history;
}

export async function getAvailableTransitions(applicationId, prisma) {
  const id = Number(applicationId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new WorkflowError('Invalid application id.', 400);
  }

  const application = await prisma.application.findUnique({
    where: { id },
    select: { currentStage: true },
  });

  if (!application) {
    throw new WorkflowError('Application not found.', 404);
  }

  return TRANSITION_MATRIX[application.currentStage] ?? [];
}

export async function bulkTransitionApplications(
  applicationIds,
  toStage,
  { actorEmail, actorType, reason, metadata } = {},
  prisma
) {
  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    throw new WorkflowError('applicationIds must be a non-empty array.', 400);
  }
  if (!toStage) {
    throw new WorkflowError('Target stage is required.', 400);
  }

  const succeeded = [];
  const failed = [];

  for (const rawId of applicationIds) {
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      failed.push({ id: rawId, error: 'Invalid application id.' });
      continue;
    }
    try {
      await transitionApplication(
        id,
        toStage,
        { actorEmail, actorType, reason, metadata },
        prisma
      );
      succeeded.push(id);
    } catch (error) {
      failed.push({ id, error: error?.message || 'Transition failed.' });
    }
  }

  return { succeeded, failed };
}

export { WorkflowError };
