# Week 2 — Day 2: Driver Application Dashboard

## Context

Yesterday we built the new driver authentication system — email-based OTP, JWT generation, login page, and a skeleton dashboard. Drivers can now authenticate via their application email and see a basic welcome screen.

**Previous day**: Driver auth rework — email OTP verification, new JWT payload with applicationId, login page, ProtectedRoute, skeleton dashboard.

**What we're building today**: The full driver dashboard that shows application progress and serves as the hub for all driver-facing stages. This replaces the old linear onboarding flow entry point.

## Today's Focus

1. Application detail API for drivers
2. Stage timeline component
3. Stage-specific action panels
4. Application status banner
5. Driver dashboard completion

## Detailed Changes

### Backend

#### 1. `apps/backend/src/modules/applications/driver-application.service.js`

Functions for driver-facing application data:
- `getDriverApplication(applicationId, email)`:
  Returns application with:
  - Core profile fields
  - Current stage + human-readable label
  - Stage history (timeline)
  - Linked job info (title, city)
  - Document submission status (counts by status)
  - Payment details submitted (boolean)
  - Questionnaire completed (boolean)
  - Contract status
  - Available actions for current stage

- `getStageConfig(stage)`:
  Returns metadata for each stage:
  ```javascript
  {
    label: "Screening",
    description: "Complete your personal details and training modules",
    driverActionRequired: true,
    driverActionLabel: "Begin Screening",
    driverActionRoute: "/screening", // where to go in driver-web
  }
  ```

#### 2. `apps/backend/src/modules/applications/driver-application.routes.js`

Driver-authenticated endpoints:
```
GET /api/driver/application         — get own application (uses JWT applicationId)
GET /api/driver/application/timeline — stage history for timeline display
GET /api/driver/application/stage-info — current stage metadata + available actions
```

Mount in `index.js`:
```javascript
import driverApplicationRoutes from './modules/applications/driver-application.routes.js';
app.use('/api/driver', authenticateToken, driverApplicationRoutes);
```

### Frontend (Driver Web)

#### 1. Complete `apps/driver-web/src/pages/DriverDashboard.jsx`

Layout:
```
┌─────────────────────────────────────────┐
│  Header: Logo + Welcome, {name}  [Logout]│
├─────────────────────────────────────────┤
│  Status Banner                           │
│  "Your application is in: {stage label}" │
│  Stage description                       │
├─────────────────────────────────────────┤
│  Stage Timeline (horizontal stepper)     │
│  ○──●──○──○──○──○──○──○──○──○           │
├─────────────────────────────────────────┤
│  Action Panel (stage-specific)           │
│  [Begin Screening] / [Upload Documents]  │
│  / "Waiting for review" / etc.           │
├─────────────────────────────────────────┤
│  Application Summary Card                │
│  Name, Email, Phone, Vehicle, etc.       │
└─────────────────────────────────────────┘
```

#### 2. `apps/driver-web/src/components/StageTimeline.jsx`

A horizontal stepper/timeline component:
- Shows all major stages as dots/circles on a line
- Current stage is highlighted (filled, accent color)
- Completed stages are checked (green)
- Future stages are grayed out
- Rejected/withdrawn shows a red terminal state

Stage labels for timeline display:
```javascript
const TIMELINE_STAGES = [
  { key: 'applied', label: 'Applied' },
  { key: 'pending_review', label: 'Under Review' },
  { key: 'screening', label: 'Screening' },
  { key: 'acknowledgements', label: 'Training' },
  { key: 'contract_sent', label: 'Contract' },
  { key: 'documents_pending', label: 'Documents' },
  { key: 'payment_details_pending', label: 'Payment' },
  { key: 'onboarding_call', label: 'Onboarding' },
  { key: 'questionnaire', label: 'Assessment' },
  { key: 'approved', label: 'Approved' },
  { key: 'active', label: 'Active' },
];
```

Some stages are grouped (contract_sent + contract_signed → "Contract"), and terminal stages (rejected, withdrawn) show differently.

#### 3. `apps/driver-web/src/components/StageActionPanel.jsx`

A dynamic panel that renders different content based on current stage:

- `pending_review`: "Your application is under review. We'll notify you when there's an update."
- `screening`: Button "Begin Screening" → navigates to screening flow
- `acknowledgements`: Button "Continue Training" → navigates to acknowledgement flow
- `contract_sent`: "A contract has been sent to your email. Please sign it to proceed." + link to check
- `contract_signed`: "Contract signed. Moving to next step..."
- `documents_pending`: Button "Upload Documents" → navigates to document upload flow
- `documents_under_review`: "Your documents are being reviewed."
- `payment_details_pending`: Button "Submit Payment Details" → navigates to payment form
- `onboarding_call`: "An onboarding call will be scheduled. Check your email for details."
- `questionnaire`: Button "Take Assessment" → navigates to questionnaire
- `decision_pending`: "Final review in progress."
- `approved`: "Congratulations! You've been approved." + first block info
- `rejected`: "Unfortunately, your application was not successful." + reason if available
- `withdrawn`: "You have withdrawn your application."

#### 4. Update `apps/driver-web/src/context/AuthContext.jsx`

Add `application` state alongside `currentUser`:
```javascript
const [application, setApplication] = useState(null);
```

On login/session restore, fetch application data and store it. Provide via context.

#### 5. Update driver-web routing

The dashboard is now the main authenticated landing page. Update routing:
- `/login` → DriverLogin
- `/apply/:slug` → JobApplication (public)
- `/dashboard` → DriverDashboard (protected)
- `/screening/*` → screening flow (Week 4)
- `/documents/*` → document upload (Week 6)
- `/payment` → payment details (Week 7)
- `/questionnaire` → questionnaire (Week 8)

For now, only `/login`, `/apply/:slug`, and `/dashboard` are active. Others are placeholders.

## Acceptance Criteria

- [ ] `GET /api/driver/application` returns full application data for authenticated driver
- [ ] Stage timeline shows all stages with current highlighted
- [ ] Action panel shows correct content for each stage
- [ ] Dashboard loads application data on mount
- [ ] Rejected/withdrawn states show appropriate messaging
- [ ] Application summary card displays personal info
- [ ] Logout works and redirects to login
- [ ] Responsive design (mobile-first)
- [ ] Session restore works (refresh doesn't lose state)

## What's Next (Day 3)

Tomorrow we build the **admin application inbox** — the first real view into the pipeline. Admin can see all applications in a table, filter by stage, and view application details.
