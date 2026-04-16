# Week 3 — Day 4: Activity Feed & Admin Improvements

## Context

The admin pipeline is feature-rich with table, kanban, analytics, filters, and export. Today we add operational awareness tools.

**Previous day**: Analytics dashboard — funnel, stage durations, volume charts, city breakdowns, job performance.

**What we're building today**: An activity feed showing recent pipeline activity, and miscellaneous admin improvements to polish the experience.

## Today's Focus

1. Activity feed API (recent transitions/events)
2. Activity feed sidebar component
3. Application count badges on navigation
4. Quick-jump search (command palette style)
5. Admin role-based access refinement

## Detailed Changes

### Backend

#### 1. Activity feed endpoint

Add to `apps/backend/src/modules/applications/application.service.js`:
- `getRecentActivity(limit, offset, filters?)`:
  Query `ApplicationStageHistory` joined with Application:
  ```javascript
  [
    {
      id: 1,
      applicationId: 45,
      applicantName: "John Smith",
      applicantEmail: "john@example.com",
      fromStage: "pending_review",
      toStage: "screening",
      actorEmail: "admin@laundryheap.com",
      actorType: "admin",
      reason: null,
      occurredAt: "2026-04-08T10:30:00Z"
    },
    // ...
  ]
  ```

Add route:
```
GET /api/applications/activity?limit=20&offset=0&cityId=&actorEmail=
```

#### 2. Application quick search

Add a lightweight search endpoint that returns minimal data (for typeahead):
```
GET /api/applications/search?q=john&limit=5
```

Returns: `[{ id, firstName, lastName, email, currentStage }]`

Fast: uses index on email, and partial match on name.

#### 3. Role-based access refinement

Update the auth middleware and service layer to check admin roles:

- `super_admin` / `app_admin`: full access to everything
- `admin_fleet`: can view and transition applications, manage facilities, cannot manage cities/jobs/admins
- `admin_view`: read-only access, can view pipeline and analytics, cannot transition or modify

Add a helper: `hasPermission(adminRole, action)` where actions are:
- `manage_cities`, `manage_jobs`, `manage_admins` → super_admin, app_admin only
- `transition_applications`, `manage_facilities` → super_admin, app_admin, admin_fleet
- `view_applications`, `view_analytics` → all roles
- `export_data` → super_admin, app_admin, admin_fleet

### Frontend (Admin Web)

#### 1. `apps/admin-web/src/components/admin/ActivityFeed.jsx`

A sidebar panel or collapsible section showing recent activity:

**Item format:**
```
🔵 John Smith moved from Pending Review → Screening
   by admin@lh.com · 2 hours ago

🟢 Jane Doe moved from Decision → Approved
   by system · 5 hours ago

🔴 Bob Wilson moved from Pending Review → Rejected
   by admin@lh.com · 1 day ago
   Reason: Does not meet requirements
```

Features:
- Live-ish: poll every 30 seconds (or manual refresh button)
- Color-coded dots: blue=forward, green=positive terminal, red=rejection
- Click on name → opens ApplicationDetailPanel
- "Load more" at bottom for pagination
- Filter by: all / my actions only

#### 2. Activity feed placement

Option A: A collapsible right sidebar on the Pipeline page
Option B: A bell icon in the header that opens a dropdown

Go with **Option A** — a right sidebar that can be toggled. When open, the pipeline table/kanban narrows slightly.

#### 3. Quick-jump search (Command Palette)

Add a keyboard shortcut `Cmd+K` (Mac) / `Ctrl+K` (Windows) that opens a search modal:

- Text input with typeahead
- Searches applications by name/email
- Results show: Name, Email, Stage badge
- Click/Enter → opens application detail
- Also searches: Jobs (by title), Cities (by name)
- Escape to close

Use the `/api/applications/search` endpoint for typeahead results.

#### 4. Navigation badge counts

In the admin sidebar tabs, add count badges:
- Pipeline: total active (non-terminal) applications count
- Jobs: count of published jobs

These counts come from the existing stats API.

#### 5. Role-based UI

Use the `adminRole` from context to conditionally render:
- Hide Cities/Jobs/Admin tabs for `admin_fleet` and `admin_view`
- Hide transition buttons for `admin_view`
- Hide delete/reject actions for `admin_view`
- Show a "View only" badge for `admin_view` role

Update the existing components to check `adminRole` before rendering action buttons.

#### 6. Update `admin-services.js`

Add:
```javascript
getRecentActivity(limit?, offset?, filters?)
quickSearch(query)
```

## Acceptance Criteria

- [ ] Activity feed API returns recent transitions
- [ ] Activity feed component renders with color-coded items
- [ ] Click on activity item opens application detail
- [ ] Activity feed polls/refreshes periodically
- [ ] Quick search (Cmd+K) opens and works
- [ ] Typeahead results show applications and jobs
- [ ] Navigation badges show correct counts
- [ ] Role-based UI hides appropriate actions for each role
- [ ] `admin_view` cannot perform transitions
- [ ] `admin_fleet` can transition but cannot manage cities/jobs

## What's Next (Day 5)

Tomorrow we do **pipeline polish and edge cases** — handling withdrawn applications, re-opening rejected applications, SLA warnings, and general UX improvements before moving to the screening refactor in Week 4.
