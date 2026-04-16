# Week 7 — Day 5: Decision Engine

## Context

The questionnaire is complete and the application is in `decision_pending`. Now the admin makes the final decision — approve or reject — based on the MOQ score, document review, and overall assessment.

**Previous day**: Questionnaire/MOQ system — builder, driver assessment page, auto-scoring, results display.

**What we're building today**: The decision workflow — decision summary panel, approve/reject actions, final notification emails, and the decision recording system.

## Today's Focus

1. Decision summary view (admin)
2. Approve/reject with comprehensive context
3. Auto-approval based on MOQ score (optional)
4. Final decision emails
5. Decision audit trail

## Detailed Changes

### Backend

#### 1. Decision service

`apps/backend/src/modules/applications/decision.service.js`:

```javascript
export async function getDecisionSummary(applicationId, prisma) {
  // Returns a comprehensive summary for the decision maker:
  return {
    application: { /* core fields */ },
    screeningProgress: { /* all steps completed */ },
    documentsStatus: { /* all approved? any issues? */ },
    contractStatus: { /* signed? */ },
    paymentDetails: { /* submitted? verified? */ },
    callNotes: { /* from onboarding call */ },
    questionnaireResult: { score, passed, details: [...] },
    stageTimeline: [...],
    adminNotes: [...],
    recommendation: 'approve' | 'review' | 'reject', // based on automated checks
  };
}

export async function approveApplication(applicationId, adminEmail, notes, prisma) {
  // 1. Validate application is in decision_pending
  // 2. Update: approvedAt = now, rejectionReason = null
  // 3. Transition to approved via stage engine
  // 4. Dispatch 'stage.approved' notification (congrats email)
  // 5. Return updated application
}

export async function rejectApplication(applicationId, adminEmail, reason, notes, prisma) {
  // 1. Validate application is in decision_pending
  // 2. Update: rejectedAt = now, rejectionReason = reason
  // 3. Transition to rejected via stage engine
  // 4. Dispatch 'stage.rejected' notification (rejection email)
  // 5. Return updated application
}
```

The `recommendation` field is auto-calculated:
- `approve`: MOQ passed, all docs approved, payment verified
- `review`: MOQ passed but with borderline score, or some notes flagged
- `reject`: MOQ failed

#### 2. Auto-approval guard (optional)

In `guards.js`, the guard for `decision_pending → approved` can optionally auto-approve:
```javascript
// If auto-approval is enabled for the city:
if (city.autoApproveOnMOQPass && application.moqScore >= questionnaire.passingScore) {
  // Auto-transition without admin intervention
}
```

This is configurable per city. For now, default to manual approval.

#### 3. Routes

```
GET  /api/applications/:id/decision-summary  — full decision context
POST /api/applications/:id/approve           — { notes? }
POST /api/applications/:id/reject            — { reason, notes? }
```

### Frontend (Admin Web)

#### 1. Decision view in ApplicationDetailPanel

When application is in `decision_pending`, the detail panel shows a **Decision** tab:

```
┌─────────────────────────────────────────┐
│ Decision Summary — John Smith            │
├─────────────────────────────────────────┤
│ Recommendation: ✅ APPROVE               │
│                                          │
│ ┌─ Screening ────────────── Complete ──┐│
│ │ 13/13 steps completed                 ││
│ └───────────────────────────────────────┘│
│ ┌─ Documents ────────────── Approved ──┐│
│ │ 5/5 documents approved                ││
│ └───────────────────────────────────────┘│
│ ┌─ Contract ──────────────── Signed ──┐ │
│ │ Signed on Apr 5, 2026               │ │
│ └───────────────────────────────────────┘│
│ ┌─ Payment ───────────── Submitted ───┐ │
│ │ Bank: Barclays, Acc: ****4567       │ │
│ └───────────────────────────────────────┘│
│ ┌─ Call Notes ────────────────────────┐  │
│ │ "Good communicator, understands     │  │
│ │  the role well. Recommended."       │  │
│ └───────────────────────────────────────┘│
│ ┌─ Assessment ──── 80% (Passed) ────┐   │
│ │ 8/10 correct                      │   │
│ └───────────────────────────────────────┘│
├─────────────────────────────────────────┤
│ Decision Notes: ____________________     │
│                                          │
│ [✅ Approve] [❌ Reject]                │
└─────────────────────────────────────────┘
```

The rejection button opens a dialog requiring a reason (from the predefined list) and optional additional notes.

#### 2. Decision in pipeline view

For applications in `decision_pending`:
- Show the auto-recommendation as a colored indicator
- Quick actions: "Approve" / "Reject" directly from the row menu

### Frontend (Driver Web)

#### 1. Dashboard states for decision outcomes

**Approved:**
- Celebration UI: confetti or success animation
- "Congratulations! You've been approved to join the Laundryheap driver team!"
- "Next step: Your first block will be assigned soon."
- Relevant contact information

**Rejected:**
- Empathetic messaging: "Thank you for your interest. Unfortunately, we're unable to proceed with your application at this time."
- Reason (human-readable, mapped from rejection reason code)
- "If you have questions, contact us at..."
- No action buttons

## Acceptance Criteria

- [ ] Decision summary API returns comprehensive application overview
- [ ] Auto-recommendation calculated correctly
- [ ] Approve endpoint transitions to `approved` stage
- [ ] Reject endpoint transitions to `rejected` stage with reason
- [ ] Approval triggers congratulations email
- [ ] Rejection triggers rejection email
- [ ] Decision view shows all sections with clear status
- [ ] Quick approve/reject from pipeline works
- [ ] Driver dashboard shows appropriate outcome messaging
- [ ] Decision recorded in stage history with admin name
- [ ] Rejection reason stored and displayed

## What's Next (Week 8, Day 1)

Week 8 focuses on the **approved → active** journey — first block assignment and the final steps to making a driver active.
