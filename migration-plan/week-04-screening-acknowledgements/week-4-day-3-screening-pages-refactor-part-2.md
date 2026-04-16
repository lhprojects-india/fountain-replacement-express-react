# Week 4 — Day 3: Screening Pages Refactor (Part 2)

## Context

Yesterday we refactored the first batch of screening pages (ConfirmDetails through Availability). Today we do the second batch — the policy and training acknowledgement pages.

**Previous day**: Refactored ConfirmDetails, Introduction, About, Role, Availability to use ApplicationContext and `/screening/*` routing.

**What we're building today**: Refactoring FacilityLocations, BlocksClassification, FeeStructure, PaymentCycleSchedule, HowRouteWorks, and CancellationPolicy.

## Today's Focus

1. Refactor facility selection page
2. Refactor all policy/acknowledgement pages
3. City-aware fee structure display
4. City-aware payment cycle content

## Detailed Changes

### Backend

#### 1. City-aware fee structure endpoint

The fee structure display should show rates for the applicant's city. Add:
```
GET /api/driver/application/fee-structure — returns fee structure for driver's city
```

This uses the Application's city (from the linked job's city) to look up the matching `FeeStructure` rows. Falls back to a default if no exact match.

#### 2. City-aware payment content

Add a field to the City model or a new config:
```
GET /api/driver/application/city-config — returns city-specific content
```

Returns: currency symbol, payment cycle info, cancellation fee amounts, and any city-specific content needed by the acknowledgement pages.

### Frontend (Driver Web)

#### 1. Refactor `FacilityLocations.jsx`

**Current behavior**: Fetches facilities by city, multi-select, saves via updateUserData.

**New behavior**:
- Get city from ApplicationContext (applicant city or job city)
- Same `GET /drivers/facilities?city=` endpoint
- Same multi-select UI
- On save: update facilities + mark `facility_locations` step confirmed
- Navigate to `/screening/blocks-classification`
- Remove `useSaveProgress` hook

#### 2. Refactor `BlocksClassification.jsx`

**Current behavior**: Policy text + checkbox acknowledgement.

**New behavior**:
- Same content (blocks/density explanation)
- On acknowledge: mark `blocks_classification` step confirmed
- Navigate to `/screening/fee-structure`
- Use ApplicationContext

#### 3. Refactor `FeeStructure.jsx`

**Current behavior**: Fetches fee data (with broken stub), shows city-specific fees, minimum read time.

**New behavior**:
- Fetch from new `/api/driver/application/fee-structure` endpoint
- Currency symbol from city config (not hardcoded £)
- Still enforce minimum read time (45s) via `useMinimumReadTime`
- On acknowledge: `POST /drivers/acknowledge/feeStructure`
- Navigate to `/screening/payment-cycle-schedule`

#### 4. Refactor `PaymentCycleSchedule.jsx`

**Current behavior**: City-specific content, acknowledges payment cycle.

**New behavior**:
- Content driven by city config (endpoint)
- Currency from city config, not hardcoded
- On acknowledge: `POST /drivers/acknowledge/paymentCycleSchedule`
- Navigate to `/screening/how-route-works`

#### 5. Refactor `HowRouteWorks.jsx`

**Current behavior**: Routes policy + checkbox, minimum read time.

**New behavior**:
- Same content structure
- On acknowledge: mark `routes_policy` step confirmed
- Navigate to `/screening/cancellation-policy`
- Use ApplicationContext

#### 6. Refactor `CancellationPolicy.jsx`

**Current behavior**: Cancellation policy with city-specific fee amounts.

**New behavior**:
- Fee amounts from city config (currency + amounts)
- On acknowledge: `POST /drivers/acknowledge/cancellationPolicy`
- Navigate to `/screening/smoking-fitness-check`

#### 7. Common refactoring pattern for all pages

Each page follows the same pattern:
```jsx
function PolicyPage() {
  const { application, markStepComplete } = useApplicationContext();
  const navigate = useNavigate();

  const handleAcknowledge = async () => {
    await markStepComplete('step_name');
    // Optional: call acknowledge API
    navigate('/screening/next-step');
  };

  return (
    <PageLayout title="..." basePath="/screening">
      {/* Content */}
      <Button onClick={handleAcknowledge}>I Acknowledge</Button>
    </PageLayout>
  );
}
```

#### 8. Remove Fountain-specific logic

In each refactored page, remove:
- Any `currentUser.fountainData` references
- Any `getVehicleTypeFromMOT` calls that use Fountain MOT data
- Replace with Application data from context

## Acceptance Criteria

- [ ] FacilityLocations fetches by application city
- [ ] Facility selection saves correctly
- [ ] BlocksClassification acknowledges and navigates
- [ ] FeeStructure displays city-correct currency
- [ ] FeeStructure enforces minimum read time
- [ ] PaymentCycleSchedule shows city-specific content
- [ ] HowRouteWorks acknowledges and navigates
- [ ] CancellationPolicy shows correct fee amounts per city
- [ ] All pages use ApplicationContext (no Fountain references)
- [ ] Navigation between all pages works correctly
- [ ] Progress bar updates correctly

## What's Next (Day 4)

Tomorrow we refactor the **final screening pages** — SmokingFitnessCheck, Liabilities, and the AcknowledgementsSummary — plus build the screening completion flow that transitions the application to the next pipeline stage.
