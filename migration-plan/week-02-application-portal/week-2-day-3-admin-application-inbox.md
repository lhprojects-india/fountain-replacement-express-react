# Week 2 — Day 3: Admin Application Inbox

## Context

We've built the foundation (Week 1) and driver-facing portal (Days 1-2 of Week 2). Drivers can apply, authenticate, and see their dashboard. Now admins need to see and manage incoming applications.

**Previous day**: Driver dashboard — application detail API, stage timeline, action panels, status banner, full dashboard page.

**What we're building today**: The admin application inbox — replacing the old Fountain-data-based dashboard with a proper pipeline view of all applications.

## Today's Focus

1. Enhanced application list API with filters/pagination
2. New admin applications page (replacing old dashboard approach)
3. Application detail modal/panel
4. Stage badges and status indicators

## Detailed Changes

### Backend

#### 1. Enhance `apps/backend/src/modules/applications/application.service.js`

Add/update `getAllApplications(filters)` with robust filtering:

```javascript
filters: {
  search: string,        // searches firstName, lastName, email
  stage: string | string[],
  cityId: number,
  jobId: number,
  dateFrom: Date,
  dateTo: Date,
  page: number,         // default 1
  pageSize: number,     // default 25, max 100
  sortBy: string,       // default 'createdAt'
  sortOrder: 'asc' | 'desc', // default 'desc'
}
```

Returns:
```javascript
{
  applications: [...],
  pagination: { page, pageSize, totalCount, totalPages },
  filters: { ...applied filters }
}
```

Each application in the list includes:
- Core fields (id, name, email, phone, city, vehicleType)
- Current stage + human-readable label
- Job title + city name
- createdAt, updatedAt, currentStageEnteredAt
- Time in current stage (computed: now - currentStageEnteredAt)
- Document count + approval status summary
- Has payment details (boolean)

Add `getApplicationDetail(id)` — deep load with:
- Full profile
- Complete stage history with actor names
- All documents with statuses
- Payment details
- Questionnaire responses
- Communication logs
- Related job + city info
- Driver record (if linked)

#### 2. Update `apps/backend/src/modules/applications/application.routes.js`

Ensure these work:
```
GET /api/applications?search=&stage=&cityId=&jobId=&page=&pageSize=&sortBy=&sortOrder=
GET /api/applications/:id
GET /api/applications/stats
```

### Frontend (Admin Web)

#### 1. Restructure the Admin Dashboard

The current `AdminDashboard.jsx` is a single large file with everything in tabs. We need to start transitioning to a cleaner structure.

**Add a new tab "Pipeline"** as the DEFAULT first tab. Keep existing tabs (they'll be refactored over time).

#### 2. `apps/admin-web/src/components/admin/ApplicationPipeline.jsx`

The main pipeline view — a table (not kanban yet) of all applications:

**Header area:**
- Stats cards row: Total Applications, Pending Review, In Screening, Documents Pending, Approved, Rejected
- Quick filters: stage pills (clickable, filter the table)

**Filter bar:**
- Search input (name, email)
- Stage dropdown (multi-select)
- City dropdown
- Job dropdown
- Date range picker (simple: from/to inputs)
- "Clear filters" button

**Table:**
| Name | Email | Phone | City | Job | Stage | Time in Stage | Applied | Actions |
|------|-------|-------|------|-----|-------|---------------|---------|---------|

- Stage column: colored badge (green=approved, yellow=screening, red=rejected, blue=pending, etc.)
- Time in Stage: "2d 5h" / "3 hours" — color-coded (red if >SLA)
- Actions: "View" button opens detail panel

**Pagination:** Page controls at bottom

#### 3. `apps/admin-web/src/components/admin/ApplicationDetailPanel.jsx`

A slide-out panel (or large dialog) showing full application details:

**Layout:**
```
┌──────────────────────────────────────────┐
│ Header: Name, Email, Stage Badge  [Close]│
├──────────────────────────────────────────┤
│ Tabs: Profile | Timeline | Documents |   │
│       Notes | Actions                    │
├──────────────────────────────────────────┤
│ Profile tab:                             │
│   Personal info, vehicle, address, job   │
│                                          │
│ Timeline tab:                            │
│   Vertical list of stage transitions     │
│   with timestamps, actors, reasons       │
│                                          │
│ Documents tab: (placeholder for Week 7)  │
│ Notes tab: Admin notes (editable)        │
│                                          │
│ Actions footer:                          │
│   [Move to Next Stage] [Reject] [Notes]  │
└──────────────────────────────────────────┘
```

The "Move to Next Stage" button calls `GET /api/workflow/applications/:id/available-transitions` to know what's valid, then shows a confirmation with optional reason input.

#### 4. `apps/admin-web/src/components/admin/StageBadge.jsx`

Reusable badge component with colors per stage:
- applied/pending_review: blue
- screening/acknowledgements: yellow/amber
- contract_sent/contract_signed: purple
- documents_pending/documents_under_review: orange
- payment_details_pending: indigo
- onboarding_call/questionnaire: teal
- decision_pending: gray
- approved/active: green
- rejected/withdrawn/first_block_failed: red

#### 5. Update `apps/admin-web/src/lib/admin-services.js`

Add/update:
```javascript
getApplications(filters) — GET /api/applications with query params
getApplicationDetail(id) — GET /api/applications/:id
getApplicationStats() — GET /api/applications/stats
transitionApplication(id, toStage, reason?) — POST /api/workflow/applications/:id/transition
getAvailableTransitions(id) — GET /api/workflow/applications/:id/available-transitions
getApplicationHistory(id) — GET /api/workflow/applications/:id/history
```

## Acceptance Criteria

- [ ] Application list API supports all filter parameters
- [ ] Pagination works correctly
- [ ] Admin Pipeline tab renders with stats cards + filter bar + table
- [ ] Search filters by name and email
- [ ] Stage filter works (multi-select)
- [ ] Application detail panel opens with profile + timeline tabs
- [ ] Stage badges use correct colors
- [ ] "Move to Next Stage" button shows valid transitions
- [ ] Transition from detail panel works and refreshes the list
- [ ] Time in stage displays correctly

## What's Next (Day 4)

Tomorrow we build **admin stage transition actions** — the full workflow for admins to move applications through stages, with confirmation dialogs, reason inputs, and real-time list updates.
