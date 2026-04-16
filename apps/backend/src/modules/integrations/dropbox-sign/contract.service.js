import { STAGES } from '../../workflow/transition-matrix.js';
import { transitionApplication } from '../../workflow/stage-engine.js';
import { dispatchNotifications } from '../../communications/notification.service.js';
import { logCommunication } from '../../communications/communication.service.js';
import logger from '../../../lib/logger.js';
import {
  cancelSignatureRequest,
  createSignatureRequest,
  getSignatureRequestStatus,
} from './dropbox-sign.client.js';

export class DropboxContractError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'DropboxContractError';
    this.statusCode = statusCode;
  }
}

function buildCustomFields(application) {
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
    throw new DropboxContractError('Invalid application id.', 400);
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
  if (!app) throw new DropboxContractError('Application not found.', 404);
  return app;
}

export async function sendContract(applicationId, prisma) {
  const application = await loadApplication(applicationId, prisma);
  const templateId = application.job?.contractTemplate?.dropboxSignTemplateId;
  const hasManualTemplateContent = Boolean(application.job?.contractTemplate?.content);
  const previousFailures = await prisma.communicationLog.count({
    where: {
      applicationId: application.id,
      channel: 'contract',
      templateEventKey: 'contract.send_failed',
    },
  });
  if (previousFailures >= 3) {
    throw new DropboxContractError('Contract send retry limit reached (3 attempts).', 409);
  }

  if (!templateId && hasManualTemplateContent) {
    const updated = await prisma.application.update({
      where: { id: application.id },
      data: {
        contractRequestId: null,
        contractStatus: 'sent_manual',
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
      signatureRequestId: null,
      signatureId: null,
      signingUrl: null,
      method: 'manual',
    };
  }

  if (!templateId) {
    throw new DropboxContractError('No Dropbox Sign template configured for this application.', 400);
  }

  try {
    const request = await createSignatureRequest({
      templateId,
      signerEmail: application.email,
      signerName: `${application.firstName || ''} ${application.lastName || ''}`.trim(),
      customFields: buildCustomFields(application),
      title: `${application.job?.title || 'Driver'} Contract`,
    });

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: {
        contractRequestId: request.signatureRequestId,
        contractStatus: 'sent',
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
      providerMessageId: request.signatureRequestId,
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
      signatureRequestId: request.signatureRequestId,
      signatureId: request.signatureId,
      signingUrl: request.signingUrl,
      method: 'dropbox_sign',
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
    throw new DropboxContractError(error?.message || 'Contract send failed.', 502);
  }
}

export async function handleSignatureEvent(eventPayload, prisma) {
  const eventType = eventPayload?.event?.event_type || eventPayload?.event_type || '';
  const signatureRequestId =
    eventPayload?.signature_request?.signature_request_id || eventPayload?.signature_request_id;
  if (!eventType || !signatureRequestId) {
    return { handled: false, reason: 'Missing event type or signature request id' };
  }

  const application = await prisma.application.findFirst({
    where: { contractRequestId: signatureRequestId },
    select: { id: true, currentStage: true, email: true, firstName: true, lastName: true, phone: true },
  });
  if (!application) {
    return { handled: false, reason: 'No matching application' };
  }

  if (eventType === 'signature_request_signed') {
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
          reason: 'dropbox_sign_webhook_signed',
          metadata: { source: 'dropbox_sign_webhook' },
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
          metadata: { source: 'dropbox_sign_webhook' },
        },
        prisma
      );
    }
    return { handled: true, status: 'signed' };
  }

  if (eventType === 'signature_request_declined') {
    await prisma.application.update({
      where: { id: application.id },
      data: { contractStatus: 'declined' },
    });
    return { handled: true, status: 'declined' };
  }

  if (eventType === 'signature_request_expired') {
    await prisma.application.update({
      where: { id: application.id },
      data: { contractStatus: 'expired' },
    });
    return { handled: true, status: 'expired' };
  }

  return { handled: true, status: 'ignored', eventType };
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
  if (app.contractRequestId && app.contractStatus === 'sent') {
    try {
      providerStatus = await getSignatureRequestStatus(app.contractRequestId);
    } catch (error) {
      providerStatus = { error: error?.message || 'Unable to fetch provider status' };
    }
  }
  return {
    applicationId: app.id,
    contractRequestId: app.contractRequestId,
    contractStatus: app.contractStatus,
    contractSignedAt: app.contractSignedAt,
    sendFailedAttempts,
    method: app.contractRequestId ? 'dropbox_sign' : 'manual',
    providerStatus,
  };
}

export async function resendContract(applicationId, prisma) {
  return sendContract(applicationId, prisma);
}

export async function cancelContract(applicationId, prisma) {
  const app = await loadApplication(applicationId, prisma);
  if (!app.contractRequestId) {
    throw new DropboxContractError('No contract request to cancel.', 400);
  }
  await cancelSignatureRequest(app.contractRequestId);
  const updated = await prisma.application.update({
    where: { id: app.id },
    data: { contractStatus: 'cancelled', updatedAt: new Date() },
  });
  return { application: updated, cancelled: true };
}

export async function markContractAsSigned(applicationId, prisma) {
  const app = await loadApplication(applicationId, prisma);
  if (app.currentStage !== STAGES.CONTRACT_SENT) {
    throw new DropboxContractError('Can only mark as signed from contract_sent stage.', 400);
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
