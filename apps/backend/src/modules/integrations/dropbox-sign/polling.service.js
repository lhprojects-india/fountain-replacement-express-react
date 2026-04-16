import { getSignatureRequestStatus } from './dropbox-sign.client.js';
import { handleSignatureEvent } from './contract.service.js';
import { logCommunication } from '../../communications/communication.service.js';

export async function pollPendingContracts(prisma) {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000);
  const pending = await prisma.application.findMany({
    where: {
      contractStatus: 'sent',
      contractRequestId: { not: null },
      updatedAt: { lt: cutoff },
    },
    select: {
      id: true,
      contractRequestId: true,
      email: true,
    },
    take: 200,
    orderBy: { updatedAt: 'asc' },
  });

  const results = [];
  for (const app of pending) {
    try {
      const provider = await getSignatureRequestStatus(app.contractRequestId);
      const statusCode = String(provider?.is_complete ? 'signed' : provider?.signatures?.[0]?.status_code || '');
      if (statusCode === 'signed') {
        await handleSignatureEvent(
          {
            event: { event_type: 'signature_request_signed' },
            signature_request: { signature_request_id: app.contractRequestId },
          },
          prisma
        );
      } else if (statusCode === 'declined') {
        await handleSignatureEvent(
          {
            event: { event_type: 'signature_request_declined' },
            signature_request: { signature_request_id: app.contractRequestId },
          },
          prisma
        );
      }

      await logCommunication({
        applicationId: app.id,
        channel: 'contract',
        templateEventKey: 'contract.poll_status',
        recipientEmail: app.email,
        status: 'sent',
        body: JSON.stringify({ polled: true, statusCode }),
        sentAt: new Date(),
      });
      results.push({ applicationId: app.id, status: statusCode || 'pending' });
    } catch (error) {
      await logCommunication({
        applicationId: app.id,
        channel: 'contract',
        templateEventKey: 'contract.poll_status_failed',
        recipientEmail: app.email,
        status: 'failed',
        errorMessage: error?.message || 'Polling failed',
      });
      results.push({ applicationId: app.id, status: 'error', error: error?.message });
    }
  }

  return {
    checked: pending.length,
    results,
  };
}
