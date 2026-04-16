# Week 5 — Day 5: Communication Delivery Tracking

## Context

This week we built email (Resend), SMS (Twilio), Dropbox Sign integration, and fallback/polling. Today we close with delivery tracking and monitoring.

**Previous day**: Contract fallbacks — manual flow, polling, retry logic, template preview.

**What we're building today**: Delivery status tracking for emails and SMS — webhook handlers for Resend/Twilio status updates, bounce handling, and a communications overview for admin.

## Today's Focus

1. Resend delivery webhooks
2. Twilio delivery status callbacks
3. Update CommunicationLog with delivery status
4. Communication overview in admin
5. Failed delivery alerts

## Detailed Changes

### Backend

#### 1. Resend webhook handler

Resend can send webhooks for: `email.delivered`, `email.bounced`, `email.complained`, `email.opened`.

Create `apps/backend/src/modules/communications/resend-webhook.js`:
```javascript
export async function handleResendWebhook(req, res) {
  // 1. Verify webhook signature (Resend webhook signing)
  // 2. Extract event type and message ID
  // 3. Find CommunicationLog by providerMessageId
  // 4. Update status: delivered, bounced, opened, complained
  // 5. If bounced: flag the application (email might be invalid)
  // 6. Return 200
}
```

Route (no auth — external callback):
```
POST /api/webhooks/resend
```

#### 2. Twilio status callback

When sending SMS, include a `statusCallback` URL. Twilio posts delivery status updates.

Create `apps/backend/src/modules/communications/twilio-webhook.js`:
```javascript
export async function handleTwilioWebhook(req, res) {
  // 1. Validate Twilio signature
  // 2. Extract MessageSid and MessageStatus
  // 3. Find CommunicationLog by providerMessageId
  // 4. Update status: queued, sent, delivered, failed, undelivered
  // 5. Return 200
}
```

Route:
```
POST /api/webhooks/twilio
```

Update SMS sending to include callback URL:
```javascript
client.messages.create({
  body,
  from: TWILIO_PHONE_NUMBER,
  to,
  statusCallback: `${process.env.API_BASE_URL}/api/webhooks/twilio`,
});
```

#### 3. Communication analytics endpoint

Add to `apps/backend/src/modules/communications/communication.service.js`:

```javascript
export async function getCommunicationStats(dateFrom, dateTo) {
  return {
    totalSent: number,
    delivered: number,
    bounced: number,
    failed: number,
    byChannel: { email: { sent, delivered, bounced }, sms: { sent, delivered, failed } },
    byEvent: [{ eventKey, count, deliveryRate }],
    recentFailures: [{ applicationId, channel, error, sentAt }],
  };
}
```

Route:
```
GET /api/communications/stats?dateFrom=&dateTo=
```

### Frontend (Admin Web)

#### 1. Communications tab in Settings or Dashboard

Add a "Communications" section with:

**Overview cards:**
- Emails sent (today/this week)
- SMS sent (today/this week)
- Delivery rate (%)
- Bounced/failed count

**Recent failures table:**
- Application name + email/phone
- Channel (email/SMS)
- Error message
- Sent timestamp
- Action: "Retry" button

**Delivery by event chart:**
- Bar chart: each event key, showing sent vs delivered vs failed

#### 2. Communication status in ApplicationDetailPanel

Update the "Communications" tab:
- Each log entry now shows delivery status icon:
  - ⏳ Queued
  - ✉️ Sent
  - ✅ Delivered
  - 📖 Opened (email only)
  - ❌ Bounced/Failed
- Failed entries show error message
- "Retry" button on failed entries

#### 3. Bounced email warning

If an application's email has bounced:
- Show a warning banner in the detail panel: "⚠️ Email delivery failed — email may be invalid"
- Flag in the pipeline table: small warning icon next to the name

## Acceptance Criteria

- [ ] Resend webhooks update CommunicationLog status
- [ ] Twilio callbacks update CommunicationLog status
- [ ] Bounced emails flagged on the application
- [ ] Communication stats endpoint returns correct data
- [ ] Admin overview shows delivery metrics
- [ ] Recent failures table with retry action
- [ ] Communication log shows delivery status icons
- [ ] Failed entries have retry capability
- [ ] Webhook endpoints return 200 consistently (no crashes)
- [ ] Invalid/duplicate webhook events handled gracefully

## What's Next (Week 6, Day 1)

Week 6 starts **document collection**. Day 1 focuses on building the file upload infrastructure — S3-compatible storage setup, signed URL generation, and the document upload API.
