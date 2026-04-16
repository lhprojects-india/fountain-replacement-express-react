# Week 1 — Day 2: Stage Transition Engine

## Context

We are building a full hiring lifecycle platform. Yesterday (Day 1) we designed and applied the complete new database schema — cities, jobs, applications, documents, questionnaires, communications, and all supporting tables. The module directory structure was created.

**Previous day**: Schema redesign — all new Prisma models added, migration applied, module folders created.

**What we're building today**: The workflow engine that controls ALL application stage transitions. This is the single most important module — every stage change in the system flows through this engine.

## Today's Focus

Build `apps/backend/src/modules/workflow/` with:
1. **Transition matrix** — defines valid `from → to` stage pairs
2. **Guards** — validation functions that must pass before a transition is allowed
3. **Actions** — side-effect functions triggered after a successful transition
4. **Stage engine service** — the single `transitionApplication()` function

## Detailed Changes

### Backend

#### 1. `apps/backend/src/modules/workflow/transition-matrix.js`

Define the canonical stages and valid transitions:

```javascript
export const STAGES = {
  APPLIED: 'applied',
  PENDING_REVIEW: 'pending_review',
  SCREENING: 'screening',
  ACKNOWLEDGEMENTS: 'acknowledgements',
  CONTRACT_SENT: 'contract_sent',
  CONTRACT_SIGNED: 'contract_signed',
  DOCUMENTS_PENDING: 'documents_pending',
  DOCUMENTS_UNDER_REVIEW: 'documents_under_review',
  PAYMENT_DETAILS_PENDING: 'payment_details_pending',
  ONBOARDING_CALL: 'onboarding_call',
  QUESTIONNAIRE: 'questionnaire',
  DECISION_PENDING: 'decision_pending',
  APPROVED: 'approved',
  FIRST_BLOCK_ASSIGNED: 'first_block_assigned',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  FIRST_BLOCK_FAILED: 'first_block_failed',
};
```

Define the transition matrix — a map of `fromStage → [toStages]`:
- `applied → [pending_review]`
- `pending_review → [screening, rejected]`
- `screening → [acknowledgements, rejected, withdrawn]`
- `acknowledgements → [contract_sent, rejected, withdrawn]`
- `contract_sent → [contract_signed, rejected, withdrawn]`
- `contract_signed → [documents_pending]`
- `documents_pending → [documents_under_review, withdrawn]`
- `documents_under_review → [payment_details_pending, documents_pending, rejected]`
- `payment_details_pending → [onboarding_call, withdrawn]`
- `onboarding_call → [questionnaire, rejected, withdrawn]`
- `questionnaire → [decision_pending]`
- `decision_pending → [approved, rejected]`
- `approved → [first_block_assigned]`
- `first_block_assigned → [active, first_block_failed]`
- `first_block_failed → [rejected]`

Export a `isValidTransition(from, to)` function.

Also export `TERMINAL_STAGES = ['active', 'rejected', 'withdrawn']`.

Also export `REJECTION_ALLOWED_FROM = ['pending_review', 'documents_under_review', 'onboarding_call', 'decision_pending', 'first_block_failed']`.

#### 2. `apps/backend/src/modules/workflow/guards.js`

Guard functions return `{ allowed: boolean, reason?: string }`.

Implement guards for key transitions:
- `screening → acknowledgements`: driver record must exist and be linked
- `acknowledgements → contract_sent`: all required onboarding steps completed
- `contract_sent → contract_signed`: contract must have a Dropbox Sign request ID
- `documents_pending → documents_under_review`: all required documents uploaded
- `documents_under_review → payment_details_pending`: all documents approved
- `questionnaire → decision_pending`: questionnaire response must exist with a score
- `decision_pending → approved`: MOQ score must meet passing threshold
- `first_block_assigned → active`: first block result must be "passed"

Each guard is a function: `async (application, prisma) => { allowed, reason }`

Export a `getGuard(fromStage, toStage)` function that returns the appropriate guard or a permissive default.

#### 3. `apps/backend/src/modules/workflow/actions.js`

Actions are async functions triggered AFTER a successful transition.

For now, create the action registry with placeholder implementations:
- `applied → pending_review`: queue "application received" confirmation email
- `pending_review → screening`: queue "application accepted, begin screening" email
- `acknowledgements → contract_sent`: trigger Dropbox Sign contract send
- `contract_signed → documents_pending`: queue "upload documents" email
- `documents_under_review → payment_details_pending`: queue "documents approved" email
- `payment_details_pending → onboarding_call`: queue "onboarding call" notification
- `decision_pending → approved`: queue "congratulations" email
- `decision_pending → rejected`: queue "rejection" email
- `*→ rejected`: queue rejection email (generic)

Each action: `async (application, transition, prisma) => void`

Export a `getActions(fromStage, toStage)` function.

For now, actions just `console.log` — actual email/SMS sending comes in Week 5.

#### 4. `apps/backend/src/modules/workflow/stage-engine.js`

The main service with ONE public function:

```javascript
export async function transitionApplication(applicationId, toStage, { actorEmail, actorType, reason, metadata }, prisma) {
  // 1. Load application
  // 2. Validate transition is allowed (transition matrix)
  // 3. Run guard for this transition
  // 4. In a transaction:
  //    a. Update application.currentStage and currentStageEnteredAt
  //    b. Insert ApplicationStageHistory row
  //    c. Run post-transition actions
  // 5. Return updated application
}
```

Also export:
- `getApplicationStageHistory(applicationId, prisma)` — returns full audit trail
- `getAvailableTransitions(applicationId, prisma)` — returns valid next stages for current state

#### 5. Wire into Express

Create `apps/backend/src/modules/workflow/workflow.routes.js`:

```
POST /api/workflow/applications/:id/transition
  Body: { toStage, reason?, metadata? }
  Auth: admin JWT required
  Response: { application, transition }

GET /api/workflow/applications/:id/history
  Auth: admin JWT required
  Response: { history: [] }

GET /api/workflow/applications/:id/available-transitions
  Auth: admin JWT required
  Response: { transitions: [] }
```

Mount in `apps/backend/src/index.js` alongside existing routes.

### No Frontend Changes Today

This is pure backend infrastructure.

## Acceptance Criteria

- [ ] `STAGES` enum and transition matrix defined
- [ ] `isValidTransition()` correctly validates all allowed/disallowed transitions
- [ ] Guards implemented for key transitions (can be async)
- [ ] Actions registry created (placeholder console.log for now)
- [ ] `transitionApplication()` works end-to-end in a transaction
- [ ] `ApplicationStageHistory` row created on every transition
- [ ] Invalid transitions return clear error messages
- [ ] Three API endpoints mounted and responding
- [ ] Manual test: create an application (raw SQL/Prisma studio), call transition API, verify history

## What's Next (Day 3)

Tomorrow we build the **City and Contract Template management** — admin APIs and UI for setting up cities with their currency, timezone, payment requirements, and contract templates.
