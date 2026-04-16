# Stitch Prompt 12 — Admin Panel: Application Pipeline

> Reference: Design System from Prompt 00. Use the App Shell from Prompt 10.
> Context: The core workhorse page — a filterable, sortable list of all driver applications in the hiring pipeline. Admins spend most of their time here.

---

## Prompt

Design the **Application Pipeline** page for the Laundryheap Driver Onboarding Admin Panel. This is the primary page for managing driver applications — a filterable table/list view with quick actions.

Use the App Shell from Prompt 10. Design only the main content area.

### ATS Direction Guardrails (Important)

- This screen is an **ATS candidate pipeline**, not a logistics board.
- The primary object is a **candidate application record** (name, contact, stage, compliance state, interview state).
- Avoid logistics components: maps, route status, package/order IDs, vehicle telemetry tiles, dispatch KPIs.
- Use recruiting language in microcopy: **Review Application, Schedule Interview, Add Internal Note, Move to Next Stage**.

---

### Page Header

- H1: "Application Pipeline"
- Grey caption: "142 total applications across all stages."
- Right: two buttons: **"Export CSV"** (Outline, medium, download icon) and **"+ Invite Driver"** (Primary Blue, medium, plus icon).

---

### Filter & Search Bar

Full-width white card, 12px radius, 12px padding:

Row 1 — Search + Sort:
- **Search input** (left, 320px): magnifying glass icon + placeholder "Search by name, email, or city..."
- **Sort dropdown** (right, 180px): label "Sort by:" + selected "Applied Date (Newest)" + chevron.

Row 2 — Stage Filter Tabs:
- Horizontal tab bar with stage filter pills (scrollable if needed).
- Tabs: **All** (count: 142) | **Applied** (28) | **Screening** (34) | **Documents** (22) | **Questionnaire** (11) | **Decision** (15) | **First Block** (18) | **Approved** (9) | **Rejected** (5).
- Each tab: pill shape, label + count badge.
- Active tab: Primary Blue fill, white text + count.
- Inactive: grey fill/white bg, dark text, grey count.

Row 3 — Additional Filters (below tab bar, shown collapsed/expandable):
- A "Filters" button that expands to show: City select, Vehicle Type select, Days in Stage range, Flag filter.
- Show the expanded filter row as a secondary frame.

---

### Application Table

White card, 12px radius. Table inside.

**Table header (sticky):**
- Columns: ☐ (checkbox) | Driver | Stage | City | Vehicle | Applied | Days in Stage | Actions.
- Header bg: `#F8FAFC`, 12px padding, grey caption text, 500 weight.
- Sortable columns have up/down sort arrows (grey, appears on hover of column header).

**Table rows (show 8 rows):**

Row anatomy:
- **☐ Checkbox:** unchecked, or select-all in header.
- **Driver column:** avatar (32px initials circle, navy bg) + name (H4 body, dark, 14px) + email (grey caption, 12px) stacked.
- **Stage column:** stage badge pill.
- **City column:** city name in body text.
- **Vehicle column:** icon (car/van icon, 16px grey) + label.
- **Applied column:** date "Apr 3, 2026" in body.
- **Days in Stage column:** number + a small thin bar (40px wide) showing time relative to expected — green if on track, yellow if slow, red if very overdue.
- **Actions column:** 3 icon buttons in a row — "View" (eye icon), "Note" (chat icon), "Call" (phone icon). All grey on default, primary color on hover. 32px tap targets.

**Show 8 rows with varied data:**
1. James O. | Screening (blue) | London | Van | Apr 3 | 8 days | 🔴 overdue
2. Amara K. | Documents (yellow) | London | Car | Apr 5 | 5 days | 🟢 on track
3. Tom B. | Decision (navy) | Manchester | Van | Mar 28 | 12 days | 🟡 slow
4. Priya S. | Applied (grey) | Birmingham | Car | Apr 10 | 0 days | 🟢
5. Marcus W. | First Block (teal) | London | Car | Mar 15 | 26 days | 🟢
6. David L. | Questionnaire (purple) | Edinburgh | Motorcycle | Apr 1 | 9 days | 🟡
7. Fatima N. | Approved (teal filled) | London | Van | Feb 20 | — | —
8. Alex T. | Rejected (pink) | Manchester | Car | Mar 10 | — | —

**Row hover state:** light blue tint `#F0F7FF` row bg, actions become slightly more visible.
**Row selected state** (via checkbox): light blue row tint + checkbox filled.

**Bulk action bar** (appears when rows are checked):
- Replaces or overlays the filter bar at top.
- "3 applications selected" label + "Advance Stage" dropdown button + "Send Message" button + "× Clear" link.

---

### Pagination Footer

Below table:
- Left: "Showing 1–8 of 142 applications" (grey caption).
- Right: Previous / Next buttons + page number pills: 1 (active, primary blue), 2, 3, ... 18.

---

### Empty State (alternate frame)

When a filter returns no results:
- Empty state in center of table area:
  - Search icon (grey, 48px) in grey circle.
  - H3: "No applications found"
  - Body grey: "Try adjusting your filters or search term."
  - "Clear Filters" button (Outline, medium).

---

### Design Notes

- The table must be information-dense but readable — good use of whitespace in row padding (14px vertical).
- Stage badges are the primary visual scanner — make them colorful and clear.
- The "Days in Stage" mini bar is a quick health indicator — red/yellow/green coding is intentional.
- Show the full 1280px shell frame with sidebar and header from Prompt 10.
