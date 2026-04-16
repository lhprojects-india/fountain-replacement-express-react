# Week 8 — Day 3: Admin Dashboard Refinement

## Context

The full pipeline is functionally complete. Email templates are professional. Now we refine the admin experience to be cohesive and production-ready.

**Previous day**: Email templates — HTML base layout, professional content for all stages, responsive design, preview.

**What we're building today**: Admin dashboard UX improvements — navigation restructure, dashboard home page, quick actions, and cohesive design.

## Today's Focus

1. Admin navigation restructure
2. Dashboard home with KPIs
3. Quick actions panel
4. Consistent component design
5. Admin profile and preferences

## Detailed Changes

### Frontend (Admin Web)

#### 1. Navigation restructure

Replace the current tab-based layout with a proper sidebar navigation:

```
┌─────────┬───────────────────────────────────┐
│ Sidebar │ Content Area                       │
│         │                                    │
│ 🏠 Home │                                    │
│ 📋 Pipe │                                    │
│ 💼 Jobs │                                    │
│ 📞 Calls│                                    │
│ 📊 Stats│                                    │
│ ⚙️ Setup│                                    │
│   ├─ Cities                                 │
│   ├─ Templates                               │
│   ├─ Questionnaires                          │
│   ├─ Fee Structures                          │
│   ├─ Facilities                              │
│   └─ Team                                    │
│         │                                    │
│ ──────  │                                    │
│ 👤 Admin│                                    │
│ 🚪 Out  │                                    │
└─────────┴───────────────────────────────────┘
```

Convert to React Router routes instead of tabs:
```
/admin/               → Dashboard Home
/admin/pipeline       → Application Pipeline (table/kanban)
/admin/jobs           → Job Management
/admin/calls          → Call Queue
/admin/analytics      → Analytics Dashboard
/admin/settings/cities       → City management
/admin/settings/templates     → Email/SMS Templates
/admin/settings/questionnaires → Questionnaire Builder
/admin/settings/fees          → Fee Structures
/admin/settings/facilities    → Facility Management
/admin/settings/team          → Admin Management
```

#### 2. Dashboard Home (`/admin/`)

Overview page with KPIs and quick access:

```
┌─────────────────────────────────────────────────┐
│ Good morning, {name}                 Apr 8, 2026 │
├─────────────────────────────────────────────────┤
│ KPI Cards                                        │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│ │New  │ │Revw │ │Scrn │ │Docs │ │Aprv │       │
│ │ 12  │ │  8  │ │ 15  │ │  5  │ │  3  │       │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘       │
├─────────────────────────────────────────────────┤
│ ┌─ Needs Attention ──────────────────────┐       │
│ │ 3 applications overdue for review      │       │
│ │ 2 documents waiting > 48h              │       │
│ │ 1 call past scheduled time             │       │
│ │ [View All →]                           │       │
│ └────────────────────────────────────────┘       │
├─────────────────────────────────────────────────┤
│ ┌─ Recent Activity ──────── Quick Actions ─────┐│
│ │ Activity feed (last 10) │ [Create Job]       ││
│ │ ...                     │ [Review Docs]      ││
│ │                         │ [View Pipeline]    ││
│ └─────────────────────────┴────────────────────┘│
├─────────────────────────────────────────────────┤
│ ┌─ This Week ────────────────────────────────┐  │
│ │ Applications chart (7-day bar)             │  │
│ │ Hire rate: 22%                             │  │
│ └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

#### 3. Sidebar component

`apps/admin-web/src/components/admin/AdminSidebar.jsx`:
- Collapsible on mobile (hamburger menu)
- Active route highlighted
- Badge counts on relevant items (Pipeline: active count, Calls: pending count)
- Admin name + role at bottom
- Consistent with Laundryheap brand colors

#### 4. Admin layout wrapper

`apps/admin-web/src/components/admin/AdminLayout.jsx`:
```jsx
function AdminLayout({ children }) {
  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-gray-50 p-6">
        {children}
      </main>
    </div>
  );
}
```

All admin pages wrapped in this layout.

#### 5. Design consistency pass

Ensure all admin components use consistent:
- Card styling (same border radius, shadow, padding)
- Button sizes and colors
- Table styling
- Dialog/modal styling
- Color palette (use CSS variables or Tailwind theme)
- Typography (headings, body, captions)
- Spacing (consistent padding/margins)

#### 6. Admin preferences

Simple preferences stored in localStorage:
- Default pipeline view (table/kanban)
- Default date range for analytics
- Sidebar collapsed state
- Theme (light only for now, but structure for dark mode later)

### Backend

No backend changes today — purely frontend refinement.

## Acceptance Criteria

- [ ] Sidebar navigation works with all routes
- [ ] Dashboard home shows correct KPIs
- [ ] "Needs Attention" section highlights overdue items
- [ ] Activity feed shows recent transitions
- [ ] Quick actions navigate correctly
- [ ] Sidebar collapses on mobile
- [ ] Active route highlighted in sidebar
- [ ] Badge counts update correctly
- [ ] Design is consistent across all admin pages
- [ ] Admin layout responsive on tablet/mobile
- [ ] Preferences persist in localStorage

## What's Next (Day 4)

Tomorrow we focus on the **driver web refinement** — polishing the driver experience, improving the dashboard, and ensuring smooth transitions between all stages.
