# Week 7 — Day 3: Onboarding Call Tracking

## Context

Payment details are now collected. The next stage is `onboarding_call` — a call between the driver and an agent/team member. We need to track scheduling and completion.

**Previous day**: Payment details collection — dynamic form from city payment schema, submission, admin verification.

**What we're building today**: Onboarding call scheduling, completion tracking, call notes, and the transition to the questionnaire stage.

## Today's Focus

1. Call scheduling/tracking API
2. Admin call management UI
3. Driver call status on dashboard
4. Call completion → questionnaire transition

## Detailed Changes

### Backend

#### 1. Call management service

`apps/backend/src/modules/applications/call.service.js`:

```javascript
export async function scheduleCall(applicationId, scheduledAt, adminEmail, prisma) {
  // Update application: onboardingCallScheduledAt = scheduledAt
  // Send notification to driver with date/time
  // Log in stage history
}

export async function completeCall(applicationId, adminEmail, notes, prisma) {
  // 1. Validate application is in onboarding_call stage
  // 2. Update: onboardingCallCompletedAt = now, onboardingCallNotes = notes
  // 3. Transition to questionnaire via stage engine
  // 4. Dispatch 'stage.questionnaire' notification
}

export async function rescheduleCall(applicationId, newDate, adminEmail, reason, prisma) {
  // Update scheduledAt
  // Notify driver of reschedule
  // Log reason
}

export async function cancelCall(applicationId, adminEmail, reason, prisma) {
  // Clear schedule
  // Optionally reject application
}

export async function getCallQueue(filters, prisma) {
  // List applications in onboarding_call stage
  // Grouped by: scheduled (with date), unscheduled
  // Sorted by scheduledAt
}
```

#### 2. Routes

Admin:
```
POST /api/applications/:id/call/schedule   — { scheduledAt }
POST /api/applications/:id/call/complete   — { notes }
POST /api/applications/:id/call/reschedule — { scheduledAt, reason }
GET  /api/applications/call-queue          — list applications needing calls
```

### Frontend (Admin Web)

#### 1. Call queue view

Add a "Calls" sub-view or filter preset in the pipeline:

**Call queue table:**
| Applicant | Phone | City | Scheduled | Status | Actions |
|-----------|-------|------|-----------|--------|---------|
| John Smith | +44... | London | Apr 10, 2pm | Scheduled | [Complete] [Reschedule] |
| Jane Doe | +353... | Dublin | — | Unscheduled | [Schedule] |

**Actions:**
- **Schedule**: Date/time picker dialog → saves scheduled time + sends notification
- **Complete**: Opens dialog with notes textarea → marks call complete → transitions to questionnaire
- **Reschedule**: New date picker + reason field
- **No Show**: Mark as missed, option to reschedule or reject

#### 2. Call management in ApplicationDetailPanel

When application is in `onboarding_call`:
- Show call status: "Scheduled for Apr 10 at 2:00 PM" or "Not yet scheduled"
- Quick actions: Schedule / Complete / Reschedule
- Phone number prominently displayed (click-to-call on mobile)
- Call notes field (for during/after the call)

### Frontend (Driver Web)

#### 1. Dashboard state for `onboarding_call`

Action panel shows:
- If call scheduled: "Your onboarding call is scheduled for **{date} at {time}**. Our team will call you at **{phone}**."
- If not scheduled: "An onboarding call will be scheduled. We'll notify you with the date and time."
- Contact info: "If you need to reschedule, contact us at support@laundryheap.com"

## Acceptance Criteria

- [ ] Admin can schedule calls with date/time
- [ ] Driver notified of scheduled call (email + SMS)
- [ ] Admin can complete calls with notes
- [ ] Call completion transitions to questionnaire
- [ ] Reschedule updates time and notifies driver
- [ ] Call queue shows all pending calls
- [ ] Call queue sorts by scheduled time
- [ ] Driver dashboard shows call information
- [ ] Phone number click-to-call on mobile
- [ ] Call notes stored and visible in application detail

## What's Next (Day 4)

Tomorrow we build the **questionnaire/MOQ system** — admin can create questionnaires with multiple-choice questions, and drivers take the assessment after their onboarding call.
