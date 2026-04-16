# Week 5 — Day 4: Contract Fallbacks & Status Polling

## Context

Yesterday we integrated Dropbox Sign for contract signing. Today we handle edge cases — fallback when no Dropbox Sign template is configured, status polling as backup to webhooks, and manual contract management.

**Previous day**: Dropbox Sign integration — signature requests, webhook handler, auto-transition on signed, admin contract actions.

**What we're building today**: Robust contract handling — fallback flows, polling, manual override, and contract template preview for admin.

## Today's Focus

1. Fallback: manual contract upload (no Dropbox Sign)
2. Status polling scheduler
3. Manual "mark as signed" for admin
4. Contract template preview/management
5. Error handling and retry logic

## Detailed Changes

### Backend

#### 1. Manual contract flow (fallback)

When a `ContractTemplate` has no `dropboxSignTemplateId`, use a manual flow:

`sendContract` in `contract.service.js` checks:
- If template has `dropboxSignTemplateId` → Dropbox Sign flow
- If template has only `content` text → send contract as email attachment (PDF generated from content) + set `contractStatus = 'sent_manual'`
- Admin must then manually mark as signed when they receive the signed copy

Add endpoint:
```
POST /api/applications/:id/contract/mark-signed
```

This manually sets `contractStatus = 'signed'`, `contractSignedAt = now`, and transitions to `contract_signed`.

Only allowed from `contract_sent` stage, by admin role.

#### 2. Contract status polling

Create `apps/backend/src/modules/integrations/dropbox-sign/polling.service.js`:

```javascript
export async function pollPendingContracts(prisma) {
  // 1. Find all applications where contractStatus = 'sent' and contractRequestId exists
  //    and contract was sent > 1 hour ago (don't poll too fresh)
  // 2. For each: call getSignatureRequestStatus
  // 3. If signed: handleSignatureEvent with synthetic event
  // 4. Log each check
}
```

This runs on a schedule (cron). For now, create a manual trigger endpoint:
```
POST /api/admin/contract/poll-status — triggers polling of all pending contracts
```

Later this could be a cron job via Render's cron service or pg-boss.

#### 3. Retry logic for failed sends

In `contract.service.js`, add retry handling:
- If Dropbox Sign API fails, set `contractStatus = 'send_failed'`
- Store error in `application.metadata` or a new field
- Admin can retry from the detail panel
- Max 3 retry attempts tracked

#### 4. Contract template management in admin

Enhance `ContractTemplateManager.jsx`:
- **Preview button**: Renders the template content with sample data
- **Test send**: Send a test signature request to admin's email
- **Linked jobs indicator**: Show which jobs use this template
- **Status indicator**: Whether Dropbox Sign template ID is valid (verified via API)

### Frontend (Admin Web)

#### 1. Enhanced contract panel in ApplicationDetailPanel

When in `contract_sent`:
- Show method: "Via Dropbox Sign" or "Manual"
- Show status with refresh button
- "Resend" button for Dropbox Sign
- "Mark as Signed" button (only for manual flow OR override)
- "Retry Send" if previous send failed
- Timer: "Sent 3 days ago — no signature yet" with warning styling

When in `contract_signed`:
- Show signed date + method
- "Download" button (if Dropbox Sign, calls download API)
- Automatically shows: "Contract signed. Application can proceed to documents."

#### 2. Bulk contract operations

In the pipeline, when filtering for `contract_sent` stage:
- Bulk action: "Send Reminders" — sends Dropbox Sign reminders to all selected
- Bulk action: "Poll Status" — checks status for all selected

### Frontend (Driver Web)

No additional driver-web changes beyond yesterday's contract dashboard states.

## Acceptance Criteria

- [ ] Manual contract flow works when no Dropbox Sign template
- [ ] Manual "mark as signed" endpoint works
- [ ] Status polling correctly detects signed contracts
- [ ] Failed contract sends are tracked and retryable
- [ ] Contract template preview renders correctly
- [ ] Admin can retry failed contract sends
- [ ] Bulk reminder and poll actions work
- [ ] Error states display clearly (send failed, expired, etc.)
- [ ] Both Dropbox Sign and manual flows transition correctly

## What's Next (Day 5)

Tomorrow we wrap up Week 5 with **communication delivery tracking** — email/SMS bounce handling, delivery status webhooks from Resend/Twilio, and a communication analytics dashboard.
