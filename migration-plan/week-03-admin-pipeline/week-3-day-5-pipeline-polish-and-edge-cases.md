# Week 3 — Day 5: Pipeline Polish & Edge Cases

## Context

The admin pipeline is feature-complete with table, kanban, analytics, activity feed, search, and role-based access. Today we handle edge cases and polish before moving to the screening refactor next week.

**Previous day**: Activity feed, command palette search, navigation badges, role-based UI refinement.

**What we're building today**: Edge case handling, SLA warnings, withdrawal flow, application re-opening, and UX polish across the pipeline.

## Today's Focus

1. Driver withdrawal flow
2. Re-open rejected/withdrawn applications
3. SLA/time-in-stage warnings
4. Responsive design polish
5. Error states and loading skeletons

## Detailed Changes

### Backend

#### 1. Withdrawal handling

Add to transition matrix in `transition-matrix.js`:
- Allow `withdrawn` from any non-terminal stage
- When transitioning to `withdrawn`, the actor should be `driver` (from driver's side) or `admin` (admin-initiated)

Add to `driver-application.routes.js`:
```
POST /api/driver/application/withdraw — { reason? }
```

Service function `withdrawApplication(applicationId, email, reason?)`:
- Validates the application belongs to this email
- Validates current stage is not terminal
- Transitions to `withdrawn` via stage engine

#### 2. Re-open application

Add to stage engine:
- New transition: `rejected → pending_review` (only by super_admin/app_admin)
- New transition: `withdrawn → pending_review` (only by super_admin/app_admin)

These are special transitions — guard: requires admin with sufficient role.

Add route:
```
POST /api/workflow/applications/:id/reopen — { reason }
```

This calls `transitionApplication` with `toStage: 'pending_review'` and records the reason.

#### 3. SLA configuration

Add to `apps/backend/src/modules/workflow/transition-matrix.js`:
```javascript
export const STAGE_SLA_HOURS = {
  pending_review: 48,
  screening: 168,        // 7 days
  acknowledgements: 168,
  contract_sent: 72,
  documents_pending: 168,
  documents_under_review: 48,
  payment_details_pending: 168,
  onboarding_call: 120,  // 5 days
  questionnaire: 72,
  decision_pending: 48,
};
```

Add to application list response:
- `isOverdue: boolean` — true if time in current stage exceeds SLA
- `slaHoursRemaining: number` — negative if overdue

#### 4. Application notes history

Currently admin notes is a single text field. Enhance:

Add model:
```prisma
model ApplicationNote {
  id              Int      @id @default(autoincrement())
  applicationId   Int      @map("application_id")
  authorEmail     String   @map("author_email")
  content         String   @db.Text
  createdAt       DateTime @default(now()) @map("created_at")

  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  @@map("application_notes")
}
```

Run migration. Update Application model to include `notes ApplicationNote[]` relation.

Add routes:
```
GET  /api/applications/:id/notes — list notes
POST /api/applications/:id/notes — { content }
```

This replaces the single `adminNotes` field with a proper notes thread.

### Frontend (Driver Web)

#### 1. Withdrawal button on dashboard

In `DriverDashboard.jsx`, add a "Withdraw Application" link/button:
- Only visible when application is in a non-terminal stage
- Opens a confirmation dialog:
  "Are you sure you want to withdraw your application? This action can be reversed by our team."
- Optional: reason textarea
- Calls `POST /api/driver/application/withdraw`
- On success: update dashboard to show withdrawn state

### Frontend (Admin Web)

#### 1. SLA warnings in pipeline views

**Table view:**
- Add a visual indicator in the "Time in Stage" column:
  - Green: < 50% of SLA
  - Yellow: 50-100% of SLA
  - Red: > 100% of SLA (overdue)
- Overdue rows can have a subtle red left-border or background tint

**Kanban view:**
- Overdue cards have a red border or a small warning icon
- Column header shows overdue count: "Pending Review (5) ⚠️ 2 overdue"

**Filter addition:**
- Add "Overdue only" toggle to the filter bar

#### 2. Re-open action

In ApplicationDetailPanel, when viewing a rejected or withdrawn application:
- Show "Re-open Application" button (only for super_admin/app_admin)
- Opens confirmation dialog with required reason
- On success: application moves back to pending_review

#### 3. Notes thread in ApplicationDetailPanel

Replace the single notes textarea with a threaded view:
- List of notes with author, timestamp
- "Add Note" input at the bottom
- Notes are read-only (no edit/delete for audit trail)

#### 4. Loading skeletons

Add Skeleton components (from shared package) for:
- Application table rows (while loading)
- Kanban cards (while loading)
- Application detail panel (while loading)
- Analytics charts (while loading)

#### 5. Empty states

Add meaningful empty state messages for:
- No applications: "No applications yet. Create a job and share the link to start receiving applications."
- No results for filter: "No applications match your filters." + "Clear Filters" button
- Empty kanban column: subtle "No applications in this stage" text

#### 6. Error boundaries

Add error boundaries around:
- Pipeline view (table/kanban)
- Analytics dashboard
- Application detail panel

Each shows: "Something went wrong. Please refresh." + "Retry" button.

#### 7. Responsive polish

- Pipeline table: horizontal scroll on mobile, key columns stay visible
- Kanban: single-column vertical layout on mobile
- Detail panel: full-screen on mobile instead of slide-out
- Filter bar: collapsible on mobile

## Acceptance Criteria

- [ ] Driver can withdraw application from dashboard
- [ ] Withdrawn state shows correctly on dashboard
- [ ] Admin can re-open rejected/withdrawn applications (with role check)
- [ ] SLA warnings display in table (color-coded time)
- [ ] SLA warnings display on kanban cards
- [ ] "Overdue only" filter works
- [ ] Notes thread replaces single notes field
- [ ] Notes have author + timestamp
- [ ] Loading skeletons appear during data fetch
- [ ] Empty states show meaningful messages
- [ ] Error boundaries catch and display errors gracefully
- [ ] Mobile-responsive pipeline views

## What's Next (Week 4, Day 1)

Week 4 starts the **screening and acknowledgements refactor**. Day 1 focuses on connecting the existing onboarding flow to the new pipeline — when an application reaches the `screening` stage, the driver can access the screening flow through their dashboard.
