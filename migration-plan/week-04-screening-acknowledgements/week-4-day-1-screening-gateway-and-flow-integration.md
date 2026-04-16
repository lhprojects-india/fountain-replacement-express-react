# Week 4 — Day 1: Screening Gateway & Flow Integration

## Context

Weeks 1-3 built the foundation, portal, and admin pipeline. The driver can apply, authenticate, and see their dashboard. Admins can manage the pipeline. Now we need to connect the existing onboarding/screening flow to the new pipeline.

The current system has a 16-page linear flow (Welcome → Verify → ConfirmDetails → ... → ThankYou) that was designed as a standalone onboarding experience. We need to refactor this into a "screening" stage that drivers access from their dashboard when their application reaches the `screening` stage.

**Previous day (Week 3, Day 5)**: Pipeline polish — withdrawal, re-open, SLA warnings, notes thread, loading states, responsive design.

**What we're building today**: The gateway that connects the driver dashboard to the screening flow. When an admin moves an application to `screening`, the driver sees "Begin Screening" on their dashboard. Clicking it enters the existing onboarding pages, refactored to work within the new pipeline context.

## Today's Focus

1. Link Application to Driver record
2. Screening flow entry/exit points
3. Refactor routing in driver-web
4. ApplicationContext for screening pages

## Detailed Changes

### Backend

#### 1. Link Application to Driver when entering screening

In `apps/backend/src/modules/workflow/actions.js`, add an action for `pending_review → screening`:

```javascript
async function onEnterScreening(application, transition, prisma) {
  // Create or find Driver record linked to this application
  const driver = await prisma.driver.upsert({
    where: { email: application.email },
    update: { 
      name: `${application.firstName} ${application.lastName}`,
      phone: application.phone,
      city: application.city,
      updatedAt: new Date(),
    },
    create: {
      email: application.email,
      name: `${application.firstName} ${application.lastName}`,
      phone: application.phone,
      city: application.city,
      onboardingStatus: 'started',
    },
  });

  // Link driver to application
  await prisma.application.update({
    where: { id: application.id },
    data: { driverId: driver.id },
  });
}
```

This ensures the existing Driver model + DriverOnboardingStep infrastructure works for the screening pages.

#### 2. Screening progress endpoint

Add to `apps/backend/src/modules/applications/driver-application.service.js`:
- `getScreeningProgress(applicationId)`:
  Returns the driver's onboarding step completion status, availability, facilities, verification data — everything the screening pages need.

Add route:
```
GET /api/driver/application/screening — returns screening progress + driver data
```

#### 3. Screening completion detection

Add a function `isScreeningComplete(driverId, prisma)` that checks:
- All required onboarding steps confirmed (confirm_details, role, availability, facility_locations, fee_structure, liabilities, cancellation_policy, etc.)
- Returns `{ complete: boolean, missingSteps: string[] }`

Add route:
```
POST /api/driver/application/screening/complete — attempts to mark screening done
```

This endpoint:
1. Checks all required steps are done
2. If complete: transitions application from `screening` → `acknowledgements` via stage engine
3. If not: returns `{ complete: false, missingSteps: [...] }`

### Frontend (Driver Web)

#### 1. Restructure routing in `App.jsx`

New route structure:
```jsx
{/* Public routes */}
<Route path="/apply/:slug" element={<JobApplication />} />
<Route path="/login" element={<DriverLogin />} />

{/* Protected routes */}
<Route path="/dashboard" element={<ProtectedRoute><DriverDashboard /></ProtectedRoute>} />

{/* Screening flow (protected, only accessible when in screening stage) */}
<Route path="/screening" element={<ProtectedRoute><ScreeningGuard /></ProtectedRoute>}>
  <Route index element={<ScreeningLanding />} />
  <Route path="confirm-details" element={<ConfirmDetails />} />
  <Route path="introduction" element={<Introduction />} />
  <Route path="about" element={<About />} />
  <Route path="role" element={<Role />} />
  <Route path="availability" element={<Availability />} />
  <Route path="facility-locations" element={<FacilityLocations />} />
  <Route path="blocks-classification" element={<BlocksClassification />} />
  <Route path="fee-structure" element={<FeeStructure />} />
  <Route path="payment-cycle-schedule" element={<PaymentCycleSchedule />} />
  <Route path="how-route-works" element={<HowRouteWorks />} />
  <Route path="cancellation-policy" element={<CancellationPolicy />} />
  <Route path="smoking-fitness-check" element={<SmokingFitnessCheck />} />
  <Route path="liabilities" element={<Liabilities />} />
  <Route path="summary" element={<AcknowledgementsSummary />} />
</Route>

{/* Keep old routes temporarily for backwards compatibility */}
```

#### 2. `apps/driver-web/src/components/ScreeningGuard.jsx`

A layout wrapper that:
- Checks application is in `screening` or `acknowledgements` stage
- If not: redirects to `/dashboard`
- If yes: renders `<Outlet />` (child routes)
- Provides screening context to child pages

#### 3. `apps/driver-web/src/pages/ScreeningLanding.jsx`

Landing page for the screening flow:
- Shows progress through screening steps
- Checklist of what needs to be completed
- "Continue" button that goes to the next incomplete step
- "Back to Dashboard" link

#### 4. `apps/driver-web/src/context/ApplicationContext.jsx`

New context that wraps the screening flow:
```javascript
const ApplicationContext = createContext(null);

export function ApplicationProvider({ children }) {
  const { application } = useAuth(); // from auth context
  const [screeningData, setScreeningData] = useState(null);
  
  // Load screening progress on mount
  // Provide: application, screeningProgress, refreshProgress
  
  return (
    <ApplicationContext.Provider value={...}>
      {children}
    </ApplicationContext.Provider>
  );
}
```

#### 5. Refactor existing pages to use new context

The existing screening pages (ConfirmDetails, About, Role, etc.) currently use `useAuth()` for `currentUser` and `updateUserData`. They need minimal changes:
- Import from ApplicationContext instead of (or in addition to) AuthContext
- Navigation changes: instead of navigating to `/about`, navigate to `/screening/about`
- The "complete onboarding" at the end now transitions to next pipeline stage instead

**Strategy: modify pages incrementally, not all at once.** Today, just set up the routing and context. Individual page refactors happen over the next 3 days.

## Acceptance Criteria

- [ ] Application → Driver linkage created when entering screening
- [ ] Screening progress endpoint returns step completion
- [ ] Screening completion check validates all required steps
- [ ] New routing structure with `/screening/*` nested routes
- [ ] ScreeningGuard prevents access if not in screening stage
- [ ] ScreeningLanding shows progress checklist
- [ ] ApplicationContext loads and provides screening data
- [ ] "Begin Screening" on dashboard navigates to `/screening`
- [ ] "Back to Dashboard" from screening works
- [ ] Old routes still accessible (backwards compatibility)

## What's Next (Day 2)

Tomorrow we refactor the **first half of screening pages** — ConfirmDetails, Introduction, About, Role, and Availability — to work within the new nested routing and ApplicationContext.
