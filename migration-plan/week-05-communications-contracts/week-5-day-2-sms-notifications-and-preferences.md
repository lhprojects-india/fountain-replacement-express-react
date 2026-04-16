# Week 5 — Day 2: SMS Notifications & Preferences

## Context

Yesterday we built the email infrastructure with Resend — templates, sending, logging, and stage transition integration. Today we add SMS as a second channel.

**Previous day**: Email infrastructure — Resend integration, template CRUD, email sending on transitions, verification code emails.

**What we're building today**: SMS sending via Twilio, notification configuration per stage transition, and an admin UI for managing which notifications fire when.

## Today's Focus

1. Twilio SMS integration
2. Unified notification dispatch (email + SMS)
3. Notification configuration per transition
4. Admin notification settings UI

## Detailed Changes

### Backend

#### 1. Install Twilio SDK

Add `twilio` to `apps/backend/package.json`.

Environment variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

#### 2. `apps/backend/src/modules/communications/sms.service.js`

```javascript
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function sendSms({ to, body }) {
  const message = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
  return { messageId: message.sid, status: message.status };
}

export async function sendTemplatedSms(templateEventKey, phone, variables) {
  // Same pattern as email: lookup template, interpolate, send, log
}
```

#### 3. Unified notification dispatcher

Create `apps/backend/src/modules/communications/notification.service.js`:

```javascript
export async function dispatchNotifications(eventKey, application) {
  // 1. Look up all active templates for this eventKey (could be email + sms)
  // 2. For each template:
  //    - If channel === 'email': sendTemplatedEmail(...)
  //    - If channel === 'sms': sendTemplatedSms(...)
  // 3. All sends are fire-and-forget (don't block the transition)
  // 4. Log all attempts
}
```

#### 4. Update stage transition actions

Replace direct `sendTemplatedEmail` calls with `dispatchNotifications`:

```javascript
const transitionActions = {
  'applied->pending_review': async (app) => {
    await dispatchNotifications('application.received', app);
  },
  'pending_review->screening': async (app) => {
    await dispatchNotifications('stage.screening', app);
  },
  // ... etc
};
```

This means adding an SMS template for a stage automatically enables SMS for that transition — no code changes needed.

#### 5. Add default SMS templates

Seed SMS templates for key events:
- `application.received`: "Hi {{firstName}}, your application for {{jobTitle}} at Laundryheap has been received. We'll review it shortly."
- `stage.screening`: "Hi {{firstName}}, your application has been accepted! Log in to begin screening: {{dashboardUrl}}"
- `auth.verification_code`: "Your Laundryheap verification code: {{code}}. Expires in 10 minutes."

Not all stages need SMS — email is the primary channel. SMS is for high-priority moments.

#### 6. Notification configuration model (optional, could use template isActive)

The template `isActive` flag already controls whether a notification fires. But for more granular control, consider:

```prisma
model NotificationConfig {
  id          Int     @id @default(autoincrement())
  eventKey    String  @map("event_key")
  channel     String  // email, sms
  isEnabled   Boolean @default(true) @map("is_enabled")
  
  @@unique([eventKey, channel])
  @@map("notification_configs")
}
```

This lets admins enable/disable notifications without editing templates. For now, using template `isActive` is sufficient.

### Frontend (Admin Web)

#### 1. Notification Settings UI

In the Settings area, add a "Notifications" sub-section:

**Notification matrix table:**

| Event | Email | SMS |
|-------|-------|-----|
| Application Received | ✅ [Edit] | ✅ [Edit] |
| Moved to Screening | ✅ [Edit] | ✅ [Edit] |
| Contract Sent | ✅ [Edit] | ❌ [Add] |
| Documents Needed | ✅ [Edit] | ❌ [Add] |
| Approved | ✅ [Edit] | ✅ [Edit] |
| Rejected | ✅ [Edit] | ❌ [Add] |
| Verification Code | ✅ [Edit] | ✅ [Edit] |

- Toggle switches to enable/disable each
- [Edit] opens the template editor for that event+channel
- [Add] creates a new template for that event+channel

#### 2. Test send feature

In the template editor, add a "Send Test" button:
- Prompts for a test email/phone
- Sends the template with sample variables
- Shows success/failure inline

Add backend endpoint:
```
POST /api/communications/templates/:id/test-send
Body: { recipient: 'test@email.com' or '+1234567890' }
```

## Acceptance Criteria

- [ ] Twilio SMS sending works
- [ ] SMS templates stored alongside email templates
- [ ] `dispatchNotifications` sends both email + SMS when templates exist
- [ ] Stage transitions trigger SMS for configured events
- [ ] Verification code sent via SMS (in addition to email)
- [ ] Notification settings UI shows matrix of events × channels
- [ ] Admins can enable/disable notifications per event + channel
- [ ] Test send works for both email and SMS
- [ ] CommunicationLog records both email and SMS sends
- [ ] Failed sends logged with error message

## What's Next (Day 3)

Tomorrow we start the **Dropbox Sign integration** — setting up the API client, sending signature requests when applications reach the contract stage, and handling signed callbacks.
