# Week 4 — Day 2: Screening Pages Refactor (Part 1)

## Context

Yesterday we set up the screening gateway — nested routing under `/screening/*`, ScreeningGuard, ScreeningLanding, and ApplicationContext. Today we refactor the first batch of screening pages.

**Previous day**: Screening gateway — routing restructure, ScreeningGuard, ScreeningLanding, ApplicationContext, Application→Driver linkage.

**What we're building today**: Refactoring ConfirmDetails, Introduction, About, Role, and Availability to work within the new pipeline-aware screening flow.

## Today's Focus

1. Refactor ConfirmDetails to use application data (not Fountain data)
2. Refactor Introduction, About, Role pages
3. Refactor Availability page
4. Update navigation between screening pages
5. Track step completion via the new context

## Detailed Changes

### Backend

No backend changes today — the existing driver endpoints (`PUT /drivers/personal-details`, `POST /drivers/availability`, `POST /drivers/progress`) still work and are reused.

### Frontend (Driver Web)

#### 1. Refactor `ConfirmDetails.jsx`

**Current behavior**: Reads Fountain data (name, email, phone, city, vehicle type) and lets driver confirm or report issues.

**New behavior**:
- Read data from `ApplicationContext` (which comes from the Application record, not Fountain)
- Pre-fill: firstName, lastName, email, phone, city, vehicleType, address — all from Application
- Driver can EDIT their details (not just confirm)
- On save: update both the Application record AND the linked Driver record
- Mark `confirm_details` step as confirmed
- Navigate to `/screening/introduction`

Add endpoint (or reuse personal-details):
```
PUT /api/driver/application/profile — updates application profile fields
```

This updates Application fields (firstName, lastName, phone, vehicleType, address fields, city) AND the linked Driver record.

**Remove**: Any reference to `fountainData` — this page no longer depends on Fountain at all.

#### 2. Refactor `Introduction.jsx`

**Current behavior**: Shows a greeting with the applicant's name and outlines the onboarding modules.

**New behavior**:
- Read name from ApplicationContext
- Update content to reference the full hiring pipeline (not just onboarding)
- Navigation: `/screening/about`
- Mark `introduction` step as viewed/confirmed
- Remove `useSaveProgress` hook usage (replaced by step tracking in ApplicationContext)

#### 3. Refactor `About.jsx`

**Current behavior**: Static company info page.

**New behavior**:
- Content stays the same
- Navigation: `/screening/role`
- Mark `about` step confirmed via ApplicationContext
- Remove any Fountain-specific references

#### 4. Refactor `Role.jsx`

**Current behavior**: Checkbox "I understand my role", saves via updateUserData.

**New behavior**:
- Same UI and checkbox
- On acknowledge: mark `role` step confirmed
- Navigate to `/screening/availability`
- Use ApplicationContext for data/state

#### 5. Refactor `Availability.jsx`

**Current behavior**: 7x3 grid, saves via `saveAvailability`.

**New behavior**:
- Same `AvailabilityGrid` component (no change needed)
- Pre-load existing availability from screening data
- On save: same `POST /drivers/availability` endpoint
- Mark `availability` step confirmed
- Navigate to `/screening/facility-locations`

#### 6. Update shared `PageLayout.jsx`

The `PageLayout` component in `packages/shared` currently has hardcoded progress routes and step counting. Update it to:
- Accept a `routes` prop for custom progress bar configuration
- Accept a `basePath` prop (default `/`, new: `/screening`)
- The screening flow has its own progress steps
- Keep backwards compatibility with old route list

Screening progress steps for the bar:
```javascript
const SCREENING_STEPS = [
  '/screening/confirm-details',
  '/screening/introduction',
  '/screening/about',
  '/screening/role',
  '/screening/availability',
  '/screening/facility-locations',
  '/screening/blocks-classification',
  '/screening/fee-structure',
  '/screening/payment-cycle-schedule',
  '/screening/how-route-works',
  '/screening/cancellation-policy',
  '/screening/smoking-fitness-check',
  '/screening/liabilities',
  '/screening/summary',
];
```

#### 7. Navigation helper

Create `apps/driver-web/src/lib/screening-navigation.js`:
```javascript
export const SCREENING_ROUTES = [
  'confirm-details',
  'introduction',
  'about',
  'role',
  'availability',
  'facility-locations',
  'blocks-classification',
  'fee-structure',
  'payment-cycle-schedule',
  'how-route-works',
  'cancellation-policy',
  'smoking-fitness-check',
  'liabilities',
  'summary',
];

export function getNextScreeningStep(currentStep) { ... }
export function getPrevScreeningStep(currentStep) { ... }
export function getScreeningProgress(completedSteps) { ... }
```

## Acceptance Criteria

- [ ] ConfirmDetails reads from Application (not Fountain)
- [ ] ConfirmDetails allows editing profile fields
- [ ] Profile edits update both Application and Driver records
- [ ] Introduction shows correct name from application
- [ ] About and Role pages work within screening flow
- [ ] Availability saves correctly and marks step
- [ ] All pages navigate within `/screening/*` paths
- [ ] Progress bar shows correct position in screening flow
- [ ] Back buttons navigate correctly within screening
- [ ] Step completion tracked in ApplicationContext
- [ ] No references to Fountain data in refactored pages

## What's Next (Day 3)

Tomorrow we refactor the **second half of screening pages** — FacilityLocations, BlocksClassification, FeeStructure, PaymentCycleSchedule, HowRouteWorks, CancellationPolicy.
