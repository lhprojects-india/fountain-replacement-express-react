import { STAGES } from './transition-matrix.js';
import { dispatchNotifications } from '../communications/notification.service.js';
import { sendContract } from '../integrations/dropbox-sign/contract.service.js';
import logger from '../../lib/logger.js';

function logAction(message, payload) {
  logger.info({ msg: `[workflow-action] ${message}`, payload });
}

async function loadApplicationNotificationContext(applicationId, prisma) {
  return prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        select: {
          title: true,
          city: { select: { city: true } },
        },
      },
    },
  });
}

async function queueNotification(eventKey, application, prisma, extraVariables = {}) {
  const context = await loadApplicationNotificationContext(application.id, prisma);
  if (!context) return;
  void dispatchNotifications(eventKey, context, extraVariables).catch((error) => {
    logger.error({
      msg: '[workflow-action] notification dispatch failed',
      eventKey,
      applicationId: application.id,
      error: error?.message || error,
    });
  });
}

const actionRegistry = {
  [`${STAGES.APPLIED}->${STAGES.PENDING_REVIEW}`]: [
    async (application, _transition, prisma) => {
      logAction('Queue application received email', { applicationId: application.id });
      void queueNotification('application.received', application, prisma);
    },
  ],
  [`${STAGES.PENDING_REVIEW}->${STAGES.SCREENING}`]: [
    async (application, transition, prisma) => onEnterScreening(application, transition, prisma),
    async (application, _transition, prisma) => {
      logAction('Queue accepted/start screening email', { applicationId: application.id });
      void queueNotification('stage.screening', application, prisma);
    },
  ],
  [`${STAGES.ACKNOWLEDGEMENTS}->${STAGES.CONTRACT_SENT}`]: [
    async (application, _transition, prisma) => {
      logAction('Trigger Dropbox Sign contract send', { applicationId: application.id });
      await sendContract(application.id, prisma);
    },
  ],
  [`${STAGES.CONTRACT_SIGNED}->${STAGES.DOCUMENTS_PENDING}`]: [
    async (application, _transition, prisma) => {
      logAction('Queue upload documents email', { applicationId: application.id });
      void queueNotification('stage.documents_pending', application, prisma);
    },
  ],
  [`${STAGES.DOCUMENTS_UNDER_REVIEW}->${STAGES.PAYMENT_DETAILS_PENDING}`]: [
    async (application) =>
      logAction('Queue documents approved email', { applicationId: application.id }),
  ],
  [`${STAGES.PAYMENT_DETAILS_PENDING}->${STAGES.ONBOARDING_CALL}`]: [
    async (application, _transition, prisma) => {
      logAction('Queue onboarding call notification', { applicationId: application.id });
      void queueNotification('stage.onboarding_call', application, prisma);
    },
  ],
  [`${STAGES.ONBOARDING_CALL}->${STAGES.QUESTIONNAIRE}`]: [
    async (application, _transition, prisma) => {
      void queueNotification('stage.questionnaire', application, prisma);
    },
  ],
  [`${STAGES.DECISION_PENDING}->${STAGES.APPROVED}`]: [
    async (application, _transition, prisma) => {
      logAction('Queue congratulations email', { applicationId: application.id });
      void queueNotification('stage.approved', application, prisma);
    },
  ],
  [`${STAGES.APPROVED}->${STAGES.FIRST_BLOCK_ASSIGNED}`]: [
    async (application, _transition, prisma) => {
      logAction('Queue first block assigned notification', { applicationId: application.id });
      void queueNotification('stage.first_block_assigned', application, prisma);
    },
  ],
  [`${STAGES.FIRST_BLOCK_ASSIGNED}->${STAGES.ACTIVE}`]: [
    async (application, _transition, prisma) => {
      logAction('Queue active / welcome notification', { applicationId: application.id });
      void queueNotification('stage.active', application, prisma);
    },
  ],
};

async function onEnterScreening(application, _transition, prisma) {
  const fullName = [application.firstName, application.lastName].filter(Boolean).join(' ').trim();
  const driver = await prisma.driver.upsert({
    where: { email: application.email },
    update: {
      name: fullName || null,
      phone: application.phone || null,
      city: application.city || null,
      onboardingStatus: 'started',
      updatedAt: new Date(),
    },
    create: {
      email: application.email,
      name: fullName || null,
      phone: application.phone || null,
      city: application.city || null,
      onboardingStatus: 'started',
    },
  });

  await prisma.application.update({
    where: { id: application.id },
    data: { driverId: driver.id },
  });
}

const genericRejectionAction = async (application, transition, prisma) => {
  logAction('Queue generic rejection email', {
    applicationId: application.id,
    fromStage: transition.fromStage,
    toStage: transition.toStage,
  });
  void queueNotification('stage.rejected', application, prisma);
};

export function getActions(fromStage, toStage) {
  const key = `${fromStage}->${toStage}`;
  const exactActions = actionRegistry[key] ?? [];
  if (toStage === STAGES.REJECTED) {
    return [...exactActions, genericRejectionAction];
  }
  return exactActions;
}
