import { getSubmission, hasClientConfig } from './docuseal.client.js';
import { handleSignatureEvent } from './contract.service.js';
import { logCommunication } from '../../communications/communication.service.js';

function deriveStatus(submission = {}) {
  const submitters = Array.isArray(submission.submitters) ? submission.submitters : [];
  const statuses = submitters.map((s) => String(s?.status || '').toLowerCase()).filter(Boolean);
  if (submission.completed_at || statuses.every((s) => s === 'completed')) return 'completed';
  if (statuses.some((s) => s === 'declined')) return 'declined';
  if (statuses.some((s) => s === 'expired')) return 'expired';
  if (submission.archived_at) return 'archived';
  return statuses[0] || 'pending';
}

export async function pollPendingContracts(prisma) {
  if (!hasClientConfig()) {
    return { checked: 0, results: [], skipped: 'docuseal_not_configured' };
  }

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
      const submission = await getSubmission(app.contractRequestId);
      const status = deriveStatus(submission || {});

      if (status === 'completed') {
        await handleSignatureEvent(
          {
            event_type: 'form.completed',
            data: {
              submission: { id: app.contractRequestId, status: 'completed' },
              external_id: String(app.id),
            },
          },
          prisma
        );
      } else if (status === 'declined') {
        await handleSignatureEvent(
          {
            event_type: 'form.declined',
            data: {
              submission: { id: app.contractRequestId, status: 'declined' },
              external_id: String(app.id),
            },
          },
          prisma
        );
      } else if (status === 'expired') {
        await handleSignatureEvent(
          {
            event_type: 'form.expired',
            data: {
              submission: { id: app.contractRequestId, status: 'expired' },
              external_id: String(app.id),
            },
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
        body: JSON.stringify({ polled: true, status }),
        sentAt: new Date(),
      });
      results.push({ applicationId: app.id, status: status || 'pending' });
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
