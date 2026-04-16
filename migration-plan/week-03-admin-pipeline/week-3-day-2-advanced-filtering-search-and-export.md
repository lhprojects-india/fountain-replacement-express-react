# Week 3 — Day 2: Advanced Filtering, Search & Export

## Context

Yesterday we built the Kanban board view with drag-and-drop stage transitions. The admin pipeline now has two views (table + board). Today we enhance data access with powerful filtering and export.

**Previous day**: Kanban board — columns per stage, drag-drop transitions, view toggle, compact cards.

**What we're building today**: Advanced search/filter capabilities and CSV/report export for the pipeline.

## Today's Focus

1. Full-text search across applications
2. Advanced filter combinations
3. Saved filter presets
4. CSV export
5. Column visibility customization (table view)

## Detailed Changes

### Backend

#### 1. Enhanced search

Update `getAllApplications` and `getApplicationsByStage` to support:
- `search`: searches across firstName, lastName, email, phone, city (case-insensitive, partial match)
- `stages`: array of stage strings (multi-select filter)
- `cityIds`: array of city IDs
- `jobIds`: array of job IDs
- `vehicleTypes`: array of vehicle type strings
- `dateFrom` / `dateTo`: application creation date range
- `stageEnteredFrom` / `stageEnteredTo`: when they entered current stage (SLA tracking)
- `hasDocuments`: boolean — filter by whether documents have been submitted
- `contractStatus`: filter by contract status

Use Prisma `where` composition with `AND` / `OR` for combining filters.

#### 2. Export endpoint

Add to `apps/backend/src/modules/applications/application.routes.js`:
```
GET /api/applications/export?format=csv&...filters
```

This returns the same filtered data as the list but formatted as:
- CSV: Content-Type `text/csv`, attachment disposition
- Columns: ID, First Name, Last Name, Email, Phone, City (applicant), Vehicle Type, Job Title, Job city, Current Stage, Applied Date, Time in Current Stage, Contract Status, Documents Status

Limit: max 5000 rows per export.

### Frontend (Admin Web)

#### 1. Enhanced Filter Bar in `ApplicationPipeline.jsx`

Replace the basic filter bar with a more capable version:

**Quick filters row (always visible):**
- Search input with debounce (300ms)
- Stage pills (clickable badges, multi-select)
- City dropdown

**Advanced filters (collapsible panel, "More Filters" button):**
- Job dropdown
- Vehicle type multi-select
- Date range (applied date)
- Contract status
- Has documents toggle
- Time in stage filter (e.g., "> 3 days", "> 7 days")

**Active filter chips:**
When any filter is active, show chips below the filter bar:
```
[Stage: Pending Review ×] [City: UK ×] [Vehicle: Van ×] [Clear All]
```

#### 2. Saved Filter Presets

Add a "Save Filter" button that stores the current filter combination:
- Dialog: name the preset
- Store in localStorage (for now — could move to DB later)
- Show saved presets as a dropdown: "My Filters: [Pending UK Vans] [This Week's Apps] ..."
- Load/delete presets

Presets to include by default:
- "Needs Attention" — pending_review for > 48 hours
- "Ready for Screening" — pending_review stage
- "Documents Due" — documents_pending stage
- "Ready for Decision" — decision_pending stage

#### 3. Column Customization (Table View)

Add a "Columns" button next to the view toggle that opens a checkbox list:
- Toggle visibility of each column
- Drag to reorder columns (if feasible, otherwise fixed order)
- Persist in localStorage

Available columns:
- Name (always shown)
- Email
- Phone
- City (applicant)
- Vehicle Type
- Job
- Job city
- Stage
- Time in Stage
- Applied Date
- Last Updated
- Contract Status
- Documents Status
- Admin Notes (truncated)

#### 4. Export Button

Add "Export" button in the filter bar:
- Exports currently filtered data (respects all active filters)
- "Export CSV" → triggers download
- Show count: "Export {n} applications"
- Loading state during export generation

#### 5. Update `admin-services.js`

Add:
```javascript
exportApplications(filters, format='csv') — GET /api/applications/export (returns blob)
```

## Acceptance Criteria

- [ ] Search works across name, email, phone, city
- [ ] Multi-stage filter works
- [ ] Date range filter works
- [ ] All filters combine correctly (AND logic)
- [ ] Active filter chips display and can be removed
- [ ] Saved filter presets can be created/loaded/deleted
- [ ] Default presets available
- [ ] Column visibility toggle works
- [ ] Column preferences persist
- [ ] CSV export downloads correctly
- [ ] Export respects current filters
- [ ] Export limited to 5000 rows

## What's Next (Day 3)

Tomorrow we build **application analytics and reporting** — charts showing pipeline conversion rates, average time per stage, applications over time, and city breakdowns.
