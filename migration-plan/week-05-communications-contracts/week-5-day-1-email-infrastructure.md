# Week 5 — Day 1: Email Infrastructure

## Context

Weeks 1-4 built the core platform: schema, pipeline, portal, admin management, and screening. All stage transitions currently log actions to console. Now we build the communications layer so transitions trigger real emails.

**Previous day (Week 4, Day 5)**: Removed Fountain dependencies, cleaned up old flow, deleted dead code.

**What we're building today**: Email sending infrastructure using Resend — template management, email service, and integration with the stage transition actions.

## Today's Focus

1. Resend integration setup
2. Email template management (DB + API)
3. Email sending service
4. Wire email sending to stage transition actions
5. Admin UI for template management

## Detailed Changes

### Backend

#### 1. Install Resend SDK

Add `resend` package to `apps/backend/package.json`.

Environment variable: `RESEND_API_KEY`

Add to `.env` and `render.yaml`.

#### 2. `apps/backend/src/modules/communications/email.service.js`

```javascript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@laundryheap.com';

export async function sendEmail({ to, subject, html, text }) {
  // 1. Call resend.emails.send(...)
  // 2. Return { messageId, status }
  // 3. Handle errors gracefully (log, don't throw)
}

export async function sendTemplatedEmail(templateEventKey, recipientEmail, variables) {
  // 1. Look up MessageTemplate by eventKey + channel='email'
  // 2. Interpolate variables into subject and body
  // 3. Call sendEmail
  // 4. Log to CommunicationLog table
  // 5. Return result
}
```

Variable interpolation: simple `{{variable}}` replacement in template strings.

Variables available in all templates:
```javascript
{
  firstName, lastName, fullName, email,
  jobTitle, cityName, currentStage, stageLabelHuman,
  dashboardUrl, // link back to driver dashboard
  companyName: 'Laundryheap',
}
```

#### 3. `apps/backend/src/modules/communications/communication.service.js`

Functions:
- `logCommunication(data)` — create CommunicationLog entry
- `getCommunicationsByApplication(applicationId)` — list all comms for an application
- `getTemplates(filters?)` — list templates
- `getTemplate(id)` — single template
- `createTemplate(data)` — create (validate eventKey uniqueness per channel+locale)
- `updateTemplate(id, data)` — update
- `deleteTemplate(id)` — delete
- `previewTemplate(id, sampleVariables)` — render template with sample data

#### 4. `apps/backend/src/modules/communications/communication.routes.js`

Admin routes:
```
GET    /api/communications/templates          — list all templates
GET    /api/communications/templates/:id      — get template
POST   /api/communications/templates          — create template
PUT    /api/communications/templates/:id      — update template
DELETE /api/communications/templates/:id      — delete template
POST   /api/communications/templates/:id/preview — preview with sample data

GET    /api/communications/logs/:applicationId — communication history for an application
```

#### 5. Seed default email templates

Create seed script or migration that adds default templates:

| Event Key | Subject | Description |
|-----------|---------|-------------|
| `application.received` | "Application Received — {{jobTitle}}" | Confirmation when driver applies |
| `stage.screening` | "Start Your Screening — {{jobTitle}}" | When moved to screening |
| `stage.contract_sent` | "Your Contract is Ready to Sign" | When contract is sent |
| `stage.documents_pending` | "Upload Your Documents" | When contract signed, docs needed |
| `stage.approved` | "Congratulations! You're Approved" | Final approval |
| `stage.rejected` | "Application Update" | Rejection notification |
| `stage.onboarding_call` | "Schedule Your Onboarding Call" | Onboarding call stage |
| `stage.questionnaire` | "Complete Your Assessment" | Questionnaire stage |
| `auth.verification_code` | "Your Verification Code" | Login OTP code |

Each template has a professional HTML body with Laundryheap branding.

#### 6. Wire to stage transition actions

Update `apps/backend/src/modules/workflow/actions.js`:

Replace the `console.log` placeholders with actual `sendTemplatedEmail` calls:

```javascript
import { sendTemplatedEmail } from '../communications/email.service.js';

const transitionActions = {
  'applied->pending_review': async (app) => {
    await sendTemplatedEmail('application.received', app.email, {
      firstName: app.firstName, jobTitle: app.job.title, ...
    });
  },
  'pending_review->screening': async (app) => {
    await sendTemplatedEmail('stage.screening', app.email, { ... });
  },
  // ... etc.
};
```

#### 7. Wire verification code email

Update `apps/backend/src/modules/applications/auth.service.js`:
- In `requestVerificationCode`, replace `console.log` with:
```javascript
await sendTemplatedEmail('auth.verification_code', email, { code });
```

### Frontend (Admin Web)

#### 1. Add "Email Templates" to Settings

Under the Settings tab, add a sub-section for email templates.

#### 2. `apps/admin-web/src/components/admin/EmailTemplateManager.jsx`

Features:
- **List**: Table of templates — Event Key, Channel, Subject, Active, Last Updated
- **Create/Edit dialog**:
  - Event key (text, e.g., "stage.screening")
  - Channel (select: email / sms)
  - Subject (text input with variable tokens)
  - Body (rich textarea with variable token buttons)
  - Active toggle
  - Preview button (shows rendered template with sample data)
- **Variable token helper**: Clickable list of available variables that inserts `{{variable}}` into the textarea
- **Preview panel**: Renders the template with sample data (split view)

#### 3. Communication log in ApplicationDetailPanel

In the admin application detail, add a "Communications" tab:
- Lists all emails/SMS sent to this applicant
- Columns: Channel, Subject, Status, Sent At
- Click to expand and see full body

#### 4. Update `admin-services.js`

Add:
```javascript
getEmailTemplates()
createEmailTemplate(data)
updateEmailTemplate(id, data)
deleteEmailTemplate(id)
previewEmailTemplate(id, variables)
getCommunicationLog(applicationId)
```

## Acceptance Criteria

- [ ] Resend SDK integrated and configured
- [ ] Email sending works (test with a real email)
- [ ] Templates stored in DB with variable interpolation
- [ ] Default templates seeded
- [ ] Stage transitions trigger appropriate emails
- [ ] Verification code sent via email (not just console.log)
- [ ] CommunicationLog entries created for every send
- [ ] Admin can view/create/edit email templates
- [ ] Template preview renders with sample data
- [ ] Communication log visible in application detail
- [ ] Emails have professional HTML with branding

## What's Next (Day 2)

Tomorrow we add **SMS notifications** using Twilio and set up the notification preferences so admins can control which transitions trigger which notifications.
