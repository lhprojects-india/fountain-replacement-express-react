import { STAGES } from './transition-matrix.js';

const allow = { allowed: true };
const deny = (reason) => ({ allowed: false, reason });

async function screeningToAcknowledgements(application) {
  if (!application.driverId) {
    return deny('Driver must be linked before moving to acknowledgements.');
  }

  return allow;
}

async function acknowledgementsToContractSent(application, prisma) {
  if (!application.driverId) {
    return deny('Driver must be linked before contract can be sent.');
  }

  const steps = await prisma.driverOnboardingStep.findMany({
    where: { driverId: application.driverId },
    select: { isConfirmed: true },
  });

  if (steps.length === 0) {
    return deny('No onboarding steps found for this driver.');
  }

  const allConfirmed = steps.every((step) => step.isConfirmed);
  return allConfirmed ? allow : deny('All onboarding steps must be completed.');
}

async function contractSentToContractSigned(application) {
  if (!application.contractRequestId) {
    return deny('Contract request ID is required before marking as signed.');
  }

  return allow;
}

async function documentsPendingToUnderReview(application, prisma) {
  const app = await prisma.application.findUnique({
    where: { id: application.id },
    select: {
      id: true,
      job: {
        select: {
          cityId: true,
        },
      },
    },
  });

  if (!app?.job?.cityId) {
    return deny('Application city is required to validate document requirements.');
  }

  const requirements = await prisma.documentRequirement.findMany({
    where: { cityId: app.job.cityId, isRequired: true },
    select: { code: true },
  });

  if (requirements.length === 0) {
    return deny('No required documents configured for this city.');
  }

  const submissions = await prisma.documentSubmission.findMany({
    where: { applicationId: application.id },
    select: { requirementCode: true },
  });

  const submittedCodes = new Set(submissions.map((s) => s.requirementCode));
  const missing = requirements.some((r) => !submittedCodes.has(r.code));

  return missing ? deny('All required documents must be uploaded first.') : allow;
}

async function documentsUnderReviewToPaymentPending(application, prisma) {
  const pendingOrRejected = await prisma.documentSubmission.count({
    where: {
      applicationId: application.id,
      status: { not: 'approved' },
    },
  });

  return pendingOrRejected === 0 ? allow : deny('All submitted documents must be approved.');
}

async function questionnaireToDecisionPending(application, prisma) {
  const response = await prisma.questionnaireResponse.findFirst({
    where: { applicationId: application.id },
    orderBy: { submittedAt: 'desc' },
    select: { score: true },
  });

  if (!response) {
    return deny('Questionnaire response is required before decision review.');
  }
  if (response.score === null) {
    return deny('Questionnaire response must include a score.');
  }

  return allow;
}

async function decisionPendingToApproved(application, prisma) {
  const latestResponse = await prisma.questionnaireResponse.findFirst({
    where: { applicationId: application.id },
    orderBy: { submittedAt: 'desc' },
    select: {
      score: true,
      questionnaire: { select: { passingScore: true } },
    },
  });

  if (!latestResponse || latestResponse.score === null) {
    return deny('Questionnaire score is required before approval.');
  }

  const passingScore = latestResponse.questionnaire?.passingScore ?? 70;
  return latestResponse.score >= passingScore
    ? allow
    : deny(`MOQ score below passing threshold (${passingScore}).`);
}

async function firstBlockAssignedToActive(application) {
  return application.firstBlockResult === 'passed'
    ? allow
    : deny('First block result must be "passed" before activating.');
}

async function approvedToFirstBlockAssigned(application) {
  return application.firstBlockDate ? allow : deny('Set a first block date before moving to first block assigned.');
}

const guardRegistry = {
  [`${STAGES.SCREENING}->${STAGES.ACKNOWLEDGEMENTS}`]: screeningToAcknowledgements,
  [`${STAGES.ACKNOWLEDGEMENTS}->${STAGES.CONTRACT_SENT}`]: acknowledgementsToContractSent,
  [`${STAGES.CONTRACT_SENT}->${STAGES.CONTRACT_SIGNED}`]: contractSentToContractSigned,
  [`${STAGES.DOCUMENTS_PENDING}->${STAGES.DOCUMENTS_UNDER_REVIEW}`]: documentsPendingToUnderReview,
  [`${STAGES.DOCUMENTS_UNDER_REVIEW}->${STAGES.PAYMENT_DETAILS_PENDING}`]:
    documentsUnderReviewToPaymentPending,
  [`${STAGES.QUESTIONNAIRE}->${STAGES.DECISION_PENDING}`]: questionnaireToDecisionPending,
  [`${STAGES.DECISION_PENDING}->${STAGES.APPROVED}`]: decisionPendingToApproved,
  [`${STAGES.APPROVED}->${STAGES.FIRST_BLOCK_ASSIGNED}`]: approvedToFirstBlockAssigned,
  [`${STAGES.FIRST_BLOCK_ASSIGNED}->${STAGES.ACTIVE}`]: firstBlockAssignedToActive,
};

export function getGuard(fromStage, toStage) {
  const key = `${fromStage}->${toStage}`;
  return guardRegistry[key] ?? (async () => allow);
}
