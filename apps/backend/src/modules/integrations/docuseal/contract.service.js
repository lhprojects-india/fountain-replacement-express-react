import { STAGES } from '../../workflow/transition-matrix.js';
import { transitionApplication } from '../../workflow/stage-engine.js';
import { dispatchNotifications } from '../../communications/notification.service.js';
import { logCommunication } from '../../communications/communication.service.js';
import logger from '../../../lib/logger.js';
import {
  archiveSubmission,
  buildSigningUrl,
  createSubmission,
  getSubmission,
  hasClientConfig,
  resendSubmitterInvite,
} from './docuseal.client.js';

export class ContractError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ContractError';
    this.statusCode = statusCode;
  }
}

function buildPrefillValues(application) {
  return {
    full_name: `${application.firstName || ''} ${application.lastName || ''}`.trim(),
    first_name: application.firstName || '',
    last_name: application.lastName || '',
    email: application.email || '',
    phone: application.phone || '',
    city: application.city || '',
    postcode: application.postcode || '',
    country: application.country || '',
    vehicle_type: application.vehicleType || '',
    address_line_1: application.addressLine1 || '',
    address_line_2: application.addressLine2 || '',
    job_title: application.job?.title || '',
    city_name: application.job?.city?.city || '',
  };
}

async function loadApplication(applicationId, prisma) {
  const id = Number(applicationId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ContractError('Invalid application id.', 400);
  }
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      job: {
        include: {
          city: true,
          contractTemplate: true,
        },
      },
    },
  });
  if (!app) throw new ContractError('Application not found.', 404);
  return app;
}

export async function sendContract(applicationId, prisma) {
  const application = await loadApplication(applicationId, prisma);
  const rawTemplateId = application.job?.contractTemplate?.docusealTemplateId;
  const templateId = typeof rawTemplateId === 'string' ? rawTemplateId.trim() : rawTemplateId || '';
  const hasTemplate = Boolean(templateId);
  const hasManualTemplateContent = Boolean(application.job?.contractTemplate?.content);

  const previousFailures = await prisma.communicationLog.count({
    where: {
      applicationId: application.id,
      channel: 'contract',
      templateEventKey: 'contract.send_failed',
    },
  });
  if (previousFailures >= 3) {
    throw new ContractError('Contract send retry limit reached (3 attempts).', 409);
  }

  // No Docuseal template but admins have supplied fallback content → mark as
  // manually sent so admins can deliver/follow up offline.
  if (!hasTemplate && hasManualTemplateContent) {
    const updated = await prisma.application.update({
      where: { id: application.id },
      data: {
        contractRequestId: null,
        contractStatus: 'sent_manual',
        docusealSubmitterSlug: null,
        updatedAt: new Date(),
      },
    });

    await logCommunication({
      applicationId: application.id,
      channel: 'contract',
      templateEventKey: 'contract.manual_sent',
      recipientEmail: application.email,
      subject: `${application.job?.title || 'Driver'} Contract`,
      body: application.job?.contractTemplate?.content || null,
      status: 'sent',
      sentAt: new Date(),
    });

    void dispatchNotifications('stage.contract_sent', application).catch((error) => {
      logger.error({
        msg: '[contract] failed to dispatch contract sent notifications',
        error: error?.message || error,
      });
    });

    return {
      application: updated,
      contractRequestId: null,
      signingUrl: null,
      method: 'manual',
    };
  }

  if (!hasTemplate) {
    throw new ContractError(
      'No Docuseal template configured for this job. Link one in admin → Cities → Contract templates.',
      400
    );
  }

  if (!hasClientConfig()) {
    throw new ContractError(
      'Docuseal is not configured. Set DOCUSEAL_BASE_URL and DOCUSEAL_API_KEY.',
      500
    );
  }

  try {
    const submission = await createSubmission({
      templateId,
      submitter: {
        email: application.email,
        name: `${application.firstName || ''} ${application.lastName || ''}`.trim(),
        role: 'Driver',
      },
      prefillValues: buildPrefillValues(application),
      externalId: application.id,
      sendEmail: true,
      message: {
        subject: `${application.job?.title || 'Driver'} Contract`,
      },
    });

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: {
        contractRequestId: submission.submissionId,
        contractStatus: 'sent',
        docusealSubmitterSlug: submission.slug || null,
        updatedAt: new Date(),
      },
    });

    await logCommunication({
      applicationId: application.id,
      channel: 'contract',
      templateEventKey: 'contract.send',
      recipientEmail: application.email,
      subject: `${application.job?.title || 'Driver'} Contract`,
      body: null,
      providerMessageId: submission.submissionId,
      status: 'sent',
      sentAt: new Date(),
    });

    void dispatchNotifications('stage.contract_sent', application, {
      contractSigningUrl: submission.signingUrl || '',
    }).catch((error) => {
      logger.error({
        msg: '[contract] failed to dispatch contract sent notifications',
        error: error?.message || error,
      });
    });

    return {
      application: updated,
      contractRequestId: submission.submissionId,
      signingUrl: submission.signingUrl,
      method: 'docuseal',
    };
  } catch (error) {
    await prisma.application.update({
      where: { id: application.id },
      data: {
        contractStatus: 'send_failed',
        updatedAt: new Date(),
      },
    });
    await logCommunication({
      applicationId: application.id,
      channel: 'contract',
      templateEventKey: 'contract.send_failed',
      recipientEmail: application.email,
      subject: `${application.job?.title || 'Driver'} Contract`,
      body: null,
      status: 'failed',
      errorMessage: error?.message || 'Contract send failed',
      sentAt: null,
    });
    throw new ContractError(error?.message || 'Contract send failed.', 502);
  }
}

/**
 * Locate the application referenced by an incoming Docuseal webhook payload.
 * Docuseal posts the submission shape under `data` for `form.*` events.
 */
function extractEventInfo(eventPayload) {
  const data = eventPayload?.data || eventPayload || {};
  const submission = data.submission || data;
  const submitter = data.submitter || data;

  const submissionId =
    submission?.id ??
    submission?.submission_id ??
    eventPayload?.submission_id ??
    null;
  const externalId =
    submitter?.external_id ??
    submission?.external_id ??
    data?.external_id ??
    eventPayload?.external_id ??
    null;
  const status =
    submitter?.status ||
    submission?.status ||
    data?.status ||
    null;

  return {
    eventType: String(eventPayload?.event_type || eventPayload?.event || '').toLowerCase(),
    submissionId: submissionId != null ? String(submissionId) : null,
    externalId: externalId != null ? String(externalId) : null,
    status: status ? String(status).toLowerCase() : null,
  };
}

async function findApplicationForEvent({ submissionId, externalId }, prisma) {
  if (externalId) {
    const numericId = Number(externalId);
    if (Number.isInteger(numericId) && numericId > 0) {
      const app = await prisma.application.findUnique({
        where: { id: numericId },
        select: {
          id: true,
          currentStage: true,
          contractRequestId: true,
          email: true,
        },
      });
      if (app) return app;
    }
  }
  if (submissionId) {
    return prisma.application.findFirst({
      where: { contractRequestId: submissionId },
      select: {
        id: true,
        currentStage: true,
        contractRequestId: true,
        email: true,
      },
    });
  }
  return null;
}

export async function handleSignatureEvent(eventPayload, prisma) {
  const info = extractEventInfo(eventPayload);
  if (!info.eventType) {
    return { handled: false, reason: 'Missing event type' };
  }

  const application = await findApplicationForEvent(info, prisma);
  if (!application) {
    return { handled: false, reason: 'No matching application', ...info };
  }

  // Treat any of these Docuseal events as "signed".
  const isSigned =
    info.eventType === 'form.completed' ||
    info.eventType === 'submission.completed' ||
    info.status === 'completed';

  const isDeclined =
    info.eventType === 'form.declined' ||
    info.eventType === 'submission.declined' ||
    info.status === 'declined';

  const isExpired =
    info.eventType === 'form.expired' ||
    info.eventType === 'submission.expired' ||
    info.status === 'expired';

  if (isSigned) {
    await prisma.application.update({
      where: { id: application.id },
      data: {
        contractStatus: 'signed',
        contractSignedAt: new Date(),
      },
    });
    if (application.currentStage === STAGES.CONTRACT_SENT) {
      await transitionApplication(
        application.id,
        STAGES.CONTRACT_SIGNED,
        {
          actorType: 'system',
          actorEmail: null,
          reason: 'docuseal_webhook_signed',
          metadata: { source: 'docuseal_webhook' },
        },
        prisma
      );
      await transitionApplication(
        application.id,
        STAGES.DOCUMENTS_PENDING,
        {
          actorType: 'system',
          actorEmail: null,
          reason: 'auto_after_contract_signed',
          metadata: { source: 'docuseal_webhook' },
        },
        prisma
      );
    }
    return { handled: true, status: 'signed' };
  }

  if (isDeclined) {
    await prisma.application.update({
      where: { id: application.id },
      data: { contractStatus: 'declined' },
    });
    return { handled: true, status: 'declined' };
  }

  if (isExpired) {
    await prisma.application.update({
      where: { id: application.id },
      data: { contractStatus: 'expired' },
    });
    return { handled: true, status: 'expired' };
  }

  return { handled: true, status: 'ignored', eventType: info.eventType };
}

export async function getContractStatus(applicationId, prisma) {
  const app = await loadApplication(applicationId, prisma);
  const sendFailedAttempts = await prisma.communicationLog.count({
    where: {
      applicationId: app.id,
      channel: 'contract',
      templateEventKey: 'contract.send_failed',
    },
  });

  let providerStatus = null;
  if (app.contractRequestId && hasClientConfig() && app.contractStatus !== 'sent_manual') {
    try {
      providerStatus = await getSubmission(app.contractRequestId);
    } catch (error) {
      providerStatus = { error: error?.message || 'Unable to fetch provider status' };
    }
  }

  const method = app.contractStatus === 'sent_manual' ? 'manual' : 'docuseal';
  const signingUrl = app.docusealSubmitterSlug ? buildSigningUrl(app.docusealSubmitterSlug) : null;

  return {
    applicationId: app.id,
    contractRequestId: app.contractRequestId,
    contractStatus: app.contractStatus,
    contractSignedAt: app.contractSignedAt,
    sendFailedAttempts,
    method,
    signingUrl,
    providerStatus,
  };
}

export async function resendContract(applicationId, prisma) {
  const app = await loadApplication(applicationId, prisma);

  if (app.contractRequestId && hasClientConfig()) {
    try {
      const submission = await getSubmission(app.contractRequestId);
      const submitter = Array.isArray(submission?.submitters) ? submission.submitters[0] : null;
      if (submitter?.id) {
        await resendSubmitterInvite(submitter.id);
        await logCommunication({
          applicationId: app.id,
          channel: 'contract',
          templateEventKey: 'contract.resent',
          recipientEmail: app.email,
          subject: `${app.job?.title || 'Driver'} Contract`,
          providerMessageId: app.contractRequestId,
          status: 'sent',
          sentAt: new Date(),
        });
        return {
          application: app,
          contractRequestId: app.contractRequestId,
          signingUrl: app.docusealSubmitterSlug ? buildSigningUrl(app.docusealSubmitterSlug) : null,
          method: 'docuseal',
          resent: true,
        };
      }
    } catch (error) {
      logger.warn({
        msg: '[contract] resend invite failed, falling back to new submission',
        error: error?.message || error,
        applicationId,
      });
    }
  }

  return sendContract(applicationId, prisma);
}

export async function cancelContract(applicationId, prisma) {
  const app = await loadApplication(applicationId, prisma);
  if (!app.contractRequestId) {
    throw new ContractError('No contract request to cancel.', 400);
  }
  try {
    await archiveSubmission(app.contractRequestId);
  } catch (error) {
    logger.warn({
      msg: '[contract] Docuseal archive failed (continuing to mark cancelled locally)',
      error: error?.message || error,
      applicationId,
    });
  }
  const updated = await prisma.application.update({
    where: { id: app.id },
    data: {
      contractStatus: 'cancelled',
      docusealSubmitterSlug: null,
      updatedAt: new Date(),
    },
  });
  return { application: updated, cancelled: true };
}

export async function markContractAsSigned(applicationId, prisma) {
  const app = await loadApplication(applicationId, prisma);
  if (app.currentStage !== STAGES.CONTRACT_SENT) {
    throw new ContractError('Can only mark as signed from contract_sent stage.', 400);
  }
  await prisma.application.update({
    where: { id: app.id },
    data: {
      contractStatus: 'signed',
      contractSignedAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await transitionApplication(
    app.id,
    STAGES.CONTRACT_SIGNED,
    {
      actorType: 'admin',
      actorEmail: null,
      reason: 'manual_contract_mark_signed',
      metadata: { source: 'admin_manual_override' },
    },
    prisma
  );
  return transitionApplication(
    app.id,
    STAGES.DOCUMENTS_PENDING,
    {
      actorType: 'admin',
      actorEmail: null,
      reason: 'manual_contract_mark_signed_auto_progress',
      metadata: { source: 'admin_manual_override' },
    },
    prisma
  );
}

/**
 * Used by driver-facing endpoints to surface the active signing URL.
 */
export async function getSigningUrlForApplication(applicationId, prisma) {
  const app = await prisma.application.findUnique({
    where: { id: Number(applicationId) },
    select: {
      id: true,
      contractStatus: true,
      docusealSubmitterSlug: true,
    },
  });
  if (!app) return null;
  if (!app.docusealSubmitterSlug) return null;
  return buildSigningUrl(app.docusealSubmitterSlug);
}
