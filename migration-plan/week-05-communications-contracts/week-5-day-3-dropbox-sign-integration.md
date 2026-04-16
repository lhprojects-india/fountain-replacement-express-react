# Week 5 — Day 3: Dropbox Sign Integration

## Context

We have email + SMS notifications working on stage transitions. Now we integrate Dropbox Sign for contract signing — the critical step between screening and document collection.

**Previous day**: SMS via Twilio, unified notification dispatcher, notification settings matrix.

**What we're building today**: Dropbox Sign API integration — creating signature requests, tracking status, and handling webhooks for signed/declined events.

## Today's Focus

1. Dropbox Sign API client
2. Contract sending service
3. Webhook handler for signature events
4. Admin contract management UI

## Detailed Changes

### Backend

#### 1. Install Dropbox Sign SDK

Add `@dropbox/sign` to `apps/backend/package.json`.

Environment variables: `DROPBOX_SIGN_API_KEY`, `DROPBOX_SIGN_CLIENT_ID`, `DROPBOX_SIGN_WEBHOOK_SECRET`

#### 2. `apps/backend/src/modules/integrations/dropbox-sign/dropbox-sign.client.js`

Wrapper around the Dropbox Sign API:

```javascript
import * as DropboxSign from '@dropbox/sign';

const signatureRequestApi = new DropboxSign.SignatureRequestApi();
signatureRequestApi.username = process.env.DROPBOX_SIGN_API_KEY;

export async function createSignatureRequest({ templateId, signerEmail, signerName, customFields, title }) {
  // Uses sendWithTemplate if templateId provided, else send with file
  // Returns: { signatureRequestId, signatureId, signingUrl }
}

export async function getSignatureRequestStatus(signatureRequestId) {
  // Returns current status of the request
}

export async function cancelSignatureRequest(signatureRequestId) {
  // Cancel a pending request
}

export async function downloadSignedDocument(signatureRequestId) {
  // Download the signed PDF
  // Return buffer or stream
}
```

#### 3. `apps/backend/src/modules/integrations/dropbox-sign/contract.service.js`

Business logic layer:

```javascript
export async function sendContract(applicationId, prisma) {
  // 1. Load application + job + contractTemplate
  // 2. Get Dropbox Sign template ID from contractTemplate
  // 3. Build custom fields from application data:
  //    - Full name, email, address, vehicle type, city, etc.
  // 4. Call createSignatureRequest
  // 5. Update application:
  //    - contractRequestId = signatureRequestId
  //    - contractStatus = 'sent'
  // 6. Transition: contract_sent (if not already in that stage)
  // 7. Dispatch notification: 'stage.contract_sent'
  // 8. Return result
}

export async function handleSignatureEvent(event, prisma) {
  // Called by webhook handler
  // event.signatureRequestId → find application
  // event.event_type:
  //   'signature_request_signed' → update contractStatus='signed', contractSignedAt=now
  //                                 → transition to contract_signed → documents_pending
  //   'signature_request_declined' → update contractStatus='declined'
  //   'signature_request_expired' → update contractStatus='expired'
}

export async function getContractStatus(applicationId, prisma) {
  // Return contract status + signing URL if still pending
}

export async function resendContract(applicationId, prisma) {
  // Resend the signing reminder via Dropbox Sign API
}
```

#### 4. `apps/backend/src/modules/integrations/dropbox-sign/dropbox-sign.webhook.js`

Webhook handler:

```javascript
export async function handleDropboxSignWebhook(req, res) {
  // 1. Verify webhook signature using DROPBOX_SIGN_WEBHOOK_SECRET
  // 2. Handle Dropbox Sign's GET verification challenge (they send a GET to verify the endpoint)
  // 3. Parse event from POST body
  // 4. Call handleSignatureEvent
  // 5. Return 200 (Dropbox Sign expects a 200 — they retry on failures)
}
```

Routes:
```
GET  /api/webhooks/dropbox-sign — verification challenge response
POST /api/webhooks/dropbox-sign — incoming events
```

This webhook route has NO auth middleware (external callback).

#### 5. Wire contract sending to stage actions

In `apps/backend/src/modules/workflow/actions.js`:

Add action for `acknowledgements → contract_sent`:
```javascript
'acknowledgements->contract_sent': async (application, transition, prisma) => {
  await sendContract(application.id, prisma);
},
```

This means when an admin transitions an application to `contract_sent`, it automatically triggers the Dropbox Sign request.

#### 6. Admin endpoint for manual contract operations

```
POST /api/applications/:id/contract/send     — manually send/resend contract
GET  /api/applications/:id/contract/status    — check current status
POST /api/applications/:id/contract/cancel    — cancel pending contract
```

### Frontend (Admin Web)

#### 1. Contract actions in ApplicationDetailPanel

When application is in `acknowledgements` stage:
- "Send Contract" button → calls transition to `contract_sent`
- Shows which contract template will be used

When application is in `contract_sent` stage:
- Show contract status: "Sent on {date}" / "Awaiting signature"
- "Resend Reminder" button
- "Cancel Contract" button
- Time since sent + reminder if > 48h unsigned

When in `contract_signed`:
- Show "Signed on {date}" ✅
- "Download Signed Contract" button (stretch goal)

#### 2. Contract status in pipeline views

In the application table/kanban, show a small icon or indicator for contract status in the Stage column when relevant:
- 📝 Contract pending
- ✅ Contract signed
- ❌ Contract declined

### Frontend (Driver Web)

#### 1. Contract status on dashboard

When application is in `contract_sent`:
- Dashboard action panel shows:
  "A contract has been sent to **{email}**. Please check your inbox (including spam) and sign it."
- Refresh button to check status
- Link: "Didn't receive it? Click here to request a resend" → calls resend API

When in `contract_signed`:
- "Your contract has been signed! ✅ We'll let you know about next steps."

## Acceptance Criteria

- [ ] Dropbox Sign API client connects successfully
- [ ] Signature request created with correct signer info
- [ ] Application `contractRequestId` stored on send
- [ ] Webhook endpoint handles Dropbox Sign verification challenge
- [ ] Signed event transitions application to `contract_signed` → `documents_pending`
- [ ] Declined event updates contract status
- [ ] Admin can send contract from detail panel
- [ ] Admin can resend/cancel contract
- [ ] Contract status visible in pipeline views
- [ ] Driver dashboard shows appropriate contract messaging
- [ ] Communication log records contract-related events

## What's Next (Day 4)

Tomorrow we build **contract fallback handling** — for when Dropbox Sign templates aren't configured, email-based contract delivery, and contract status polling as backup to webhooks.
