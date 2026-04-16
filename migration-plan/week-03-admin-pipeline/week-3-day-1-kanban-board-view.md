# Week 3 — Day 1: Kanban Board View

## Context

Weeks 1-2 built the foundation and portal. Admin can see applications in a table and transition them through stages. Now we enhance the pipeline experience.

**Previous day (Week 2, Day 5)**: Document requirements configuration, admin settings consolidation, payment field presets.

**What we're building today**: A Kanban board view as an alternative to the table — admins can visually see applications grouped by stage and drag-drop them between columns.

## Today's Focus

1. Kanban board component
2. Drag-and-drop stage transitions
3. View toggle (table ↔ kanban)
4. Column configuration

## Detailed Changes

### Backend

#### 1. Pipeline summary endpoint

Add to `apps/backend/src/modules/applications/application.service.js`:
- `getApplicationsByStage(filters?)`:
  Returns applications grouped by stage:
  ```javascript
  {
    pending_review: { count: 5, applications: [...] },
    screening: { count: 3, applications: [...] },
    // ... each stage with its applications
  }
  ```

  Each application in the group is a lightweight summary (id, name, email, city, vehicleType, timeInStage, createdAt) — NOT the full detail.

  Accepts same filters as getAllApplications (search, city, job, date range).

Add route:
```
GET /api/applications/by-stage?search=&cityId=&jobId=
```

#### 2. Optimistic transition response

Update `transitionApplication` in `stage-engine.js` to return the updated application summary so the frontend can immediately move the card without a full refetch.

### Frontend (Admin Web)

#### 1. `apps/admin-web/src/components/admin/KanbanBoard.jsx`

A horizontal scrollable board with columns for each visible stage.

**Layout:**
```
┌──────────┬──────────┬──────────┬──────────┬─────┐
│ Pending  │Screening │ Docs     │ Payment  │ ... │
│ Review   │          │ Pending  │ Details  │     │
│ (5)      │ (3)      │ (2)      │ (1)      │     │
├──────────┼──────────┼──────────┼──────────┤     │
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │          │     │
│ │Card 1│ │ │Card 3│ │ │Card 6│ │          │     │
│ └──────┘ │ └──────┘ │ └──────┘ │          │     │
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │          │     │
│ │Card 2│ │ │Card 4│ │ │Card 7│ │          │     │
│ └──────┘ │ └──────┘ │ └──────┘ │          │     │
│          │ ┌──────┐ │          │          │     │
│          │ │Card 5│ │          │          │     │
│          │ └──────┘ │          │          │     │
└──────────┴──────────┴──────────┴──────────┴─────┘
```

**Column ordering** (visible stages in pipeline order, terminal stages at the end or hidden):
```javascript
const KANBAN_COLUMNS = [
  'pending_review',
  'screening',
  'acknowledgements',
  'contract_sent',
  'contract_signed',
  'documents_pending',
  'documents_under_review',
  'payment_details_pending',
  'onboarding_call',
  'questionnaire',
  'decision_pending',
  'approved',
  'first_block_assigned',
];
```

Terminal stages (rejected, withdrawn, active, first_block_failed) shown as a collapsed section or sidebar count.

**Each column:**
- Header: Stage label + count badge
- Scrollable card list
- Drop zone for drag-and-drop

**Drag-and-drop:**
- Use `@dnd-kit/core` + `@dnd-kit/sortable` (or `react-beautiful-dnd`) — check which is already in deps or add the lightest option
- Only allow drops on columns that represent valid transitions from the card's current stage
- Invalid drop targets are visually grayed out
- On drop: call `transitionApplication()`, optimistically move card, rollback on error

#### 2. `apps/admin-web/src/components/admin/KanbanCard.jsx`

Compact card for each application:
```
┌──────────────────────┐
│ John Smith           │
│ john@example.com     │
│ London • Car         │
│ ───────────────────  │
│ Applied 3d ago       │
│ In stage: 2d 5h      │
└──────────────────────┘
```

- Click: opens ApplicationDetailPanel
- Drag handle: visible on hover
- Color accent: matches stage color
- Truncated info for compact display

#### 3. View Toggle in `ApplicationPipeline.jsx`

Add a toggle button group at the top of the pipeline:
```jsx
<div className="view-toggle">
  <Button variant={view === 'table' ? 'default' : 'outline'} onClick={() => setView('table')}>
    <ListIcon /> Table
  </Button>
  <Button variant={view === 'kanban' ? 'default' : 'outline'} onClick={() => setView('kanban')}>
    <ColumnsIcon /> Board
  </Button>
</div>
```

Both views share the same filter bar. The data source switches:
- Table: uses `getAllApplications` (paginated)
- Kanban: uses `getApplicationsByStage` (grouped)

Persist the view preference in localStorage.

#### 4. Install drag-and-drop dependency

Add `@dnd-kit/core` and `@dnd-kit/sortable` to `apps/admin-web/package.json`.

#### 5. Update `admin-services.js`

Add:
```javascript
getApplicationsByStage(filters?) — GET /api/applications/by-stage
```

### No Driver Web Changes Today

## Acceptance Criteria

- [ ] `GET /api/applications/by-stage` returns grouped data
- [ ] Kanban board renders with correct columns
- [ ] Cards show application summary info
- [ ] Drag-and-drop between valid stages works
- [ ] Invalid drops are prevented (grayed out columns)
- [ ] Successful drop triggers transition API
- [ ] Failed transition rolls back card to original column
- [ ] Click on card opens detail panel
- [ ] View toggle between table and kanban works
- [ ] View preference persists across sessions
- [ ] Horizontal scroll works on smaller screens

## What's Next (Day 2)

Tomorrow we build **advanced filtering and search** — saved filters, column customization, and the ability to export application data.
