# Week 4 — Day 4: Final Screening Pages & Completion Flow

## Context

We've refactored most screening pages over the past two days. Today we finish the last pages and build the critical screening-to-pipeline completion handoff.

**Previous day**: Refactored FacilityLocations, BlocksClassification, FeeStructure, PaymentCycleSchedule, HowRouteWorks, CancellationPolicy.

**What we're building today**: SmokingFitnessCheck, Liabilities, AcknowledgementsSummary, and the screening completion endpoint that transitions the application forward in the pipeline.

## Today's Focus

1. Refactor SmokingFitnessCheck and Liabilities
2. Rebuild AcknowledgementsSummary as screening completion page
3. Screening completion → pipeline transition
4. Post-screening driver dashboard state

## Detailed Changes

### Backend

#### 1. Screening completion endpoint

Enhance `POST /api/driver/application/screening/complete`:

```javascript
async function completeScreening(applicationId, email, prisma) {
  // 1. Load application + driver
  // 2. Check all required onboarding steps are confirmed
  const required = [
    'confirm_details', 'introduction', 'about', 'role',
    'availability', 'facility_locations', 'blocks_classification',
    'fee_structure', 'payment_cycle_schedule', 'routes_policy',
    'cancellation_policy', 'smoking_fitness_check', 'liabilities',
  ];
  
  // 3. Check each step via DriverOnboardingStep table
  // 4. If all complete: transition application screening → acknowledgements → contract_sent
  //    (or just screening → acknowledgements for now, contract_sent happens via admin action)
  // 5. If missing: return { complete: false, missingSteps: [...] }
}
```

The transition `screening → acknowledgements` is automatic when the driver completes all steps. The `acknowledgements → contract_sent` transition is an admin action (they review the screening and then send the contract).

#### 2. Screening status in application detail

Add to the application detail response a `screeningProgress` object:
```javascript
{
  totalSteps: 13,
  completedSteps: 10,
  percentage: 77,
  steps: [
    { name: 'confirm_details', label: 'Personal Details', completed: true, completedAt: '...' },
    { name: 'introduction', label: 'Introduction', completed: true, completedAt: '...' },
    // ...
  ]
}
```

This is useful for both the driver's summary page and the admin's detail view.

### Frontend (Driver Web)

#### 1. Refactor `SmokingFitnessCheck.jsx`

**Current behavior**: Smoking choice, fitness checkboxes, withdraw if cannot climb stairs.

**New behavior**:
- Same UI (smoking status select, fitness checkboxes)
- Withdrawal: uses new `POST /api/driver/application/withdraw` instead of setting status
- On complete: mark `smoking_fitness_check` confirmed
- Navigate to `/screening/liabilities`
- Use ApplicationContext

#### 2. Refactor `Liabilities.jsx`

**Current behavior**: Policy text, min read time, acknowledge liabilities.

**New behavior**:
- Same content + minimum read time (30s)
- On acknowledge: `POST /drivers/acknowledge/liabilities` + mark step confirmed
- Navigate to `/screening/summary`

#### 3. Rebuild `AcknowledgementsSummary.jsx` → `ScreeningSummary.jsx`

This is now the **screening completion page**. Complete overhaul:

**Layout:**
```
┌─────────────────────────────────────────┐
│ Screening Summary                        │
├─────────────────────────────────────────┤
│ ✅ Personal Details Confirmed            │
│ ✅ Introduction Reviewed                 │
│ ✅ Company Overview Reviewed             │
│ ✅ Role Understanding Confirmed          │
│ ✅ Availability Set                      │
│ ✅ Facility Locations Selected           │
│ ✅ Blocks Classification Reviewed        │
│ ✅ Fee Structure Acknowledged            │
│ ✅ Payment Cycle Reviewed                │
│ ✅ Route Policy Reviewed                 │
│ ✅ Cancellation Policy Acknowledged      │
│ ✅ Health & Fitness Check Complete        │
│ ✅ Liabilities Acknowledged              │
├─────────────────────────────────────────┤
│ All steps completed!                     │
│                                          │
│ [Complete Screening]                     │
│                                          │
│ or click any step above to review it     │
└─────────────────────────────────────────┘
```

Features:
- Each step is clickable — navigates to that screening page for review
- Incomplete steps show ❌ with "Complete" link
- "Complete Screening" button only enabled when ALL steps are ✅
- On click: calls `POST /api/driver/application/screening/complete`
- On success: redirect to `/dashboard` with success toast "Screening completed! Your application is being reviewed."
- On failure (missing steps): scroll to first incomplete step

#### 4. Post-screening dashboard state

When application is in `acknowledgements` stage (screening complete, awaiting admin review):
- Dashboard shows: "Screening Complete — Under Review"
- Action panel: "Your screening has been submitted. Our team is reviewing your responses. You'll be notified about next steps."
- No action buttons (waiting for admin)

When admin transitions to `contract_sent`:
- Dashboard shows: "Contract Sent"
- Action panel: "A contract has been sent to your email. Please check your inbox and sign it to proceed."

## Acceptance Criteria

- [ ] SmokingFitnessCheck works within screening flow
- [ ] Withdrawal from SmokingFitnessCheck uses new withdraw endpoint
- [ ] Liabilities acknowledges and navigates to summary
- [ ] Screening summary shows all steps with completion status
- [ ] Incomplete steps are clickable and link to the correct page
- [ ] "Complete Screening" only enabled when all steps done
- [ ] Completion transitions application to `acknowledgements` stage
- [ ] Dashboard shows correct state after screening completion
- [ ] Missing steps prevent completion and show which ones
- [ ] Admin can see screening progress in application detail

## What's Next (Day 5)

Tomorrow we **clean up the old onboarding flow** — remove Fountain dependencies, delete dead code, clean up the old routing, and ensure the new screening flow is the sole path.
