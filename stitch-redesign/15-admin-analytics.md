# Stitch Prompt 15 — Admin Panel: Analytics Dashboard

> Reference: Design System from Prompt 00. Use the App Shell from Prompt 10.
> Context: A metrics and charts page for tracking hiring pipeline health, conversion rates, and regional trends.

---

## Prompt

Design the **Analytics Dashboard** page for the Laundryheap Driver Onboarding Admin Panel. This page gives the hiring team visibility into pipeline performance through charts and KPI metrics.

Use the App Shell from Prompt 10 as the outer frame.

### ATS Direction Guardrails (Important)

- This is **hiring analytics**, not logistics analytics.
- Emphasize recruiting KPIs: applicant funnel conversion, time-in-stage, pass/fail rates, doc verification cycle time, interviewer workload.
- Avoid logistics chart topics: delivery SLA, route efficiency, fleet utilization, shipment volume.
- Visual language should match ATS reporting products.

---

### Page Header

- H1: "Analytics"
- Grey caption: "Hiring pipeline performance overview."
- Right: **Date range picker** — a button showing "Mar 10 – Apr 10, 2026" with a calendar icon, clicking opens a date range picker popover.
- Beside date picker: **"Export Report"** (Outline, medium, download icon).

---

### KPI Summary Row

4 stat cards in a row (same pattern as the Home Dashboard, Prompt 11). Show these metrics:

1. **Total Applications** — "142" + trend "+18% vs last month" (teal, arrow up).
2. **Conversion Rate** — "23%" (Applied → Approved) + trend "+4% vs last month" (teal, arrow up). Show a small donut chart inline (24px, teal fill).
3. **Avg. Time to Hire** — "18 days" + trend "−2 days" (teal, arrow down = improved).
4. **Rejection Rate** — "12%" + trend "+2% vs last month" (pink, arrow up = worse).

---

### Main Charts Section — 2-Column Grid

#### Chart 1 — Applications Over Time (left, 60%)

Line chart:
- Title: "Applications Over Time" (H3).
- Caption: "New applications received per week over the selected period."
- X-axis: dates (weekly labels).
- Y-axis: number of applications.
- **Line:** Primary Blue `#0890F1`, smooth curve, dot markers at data points.
- Area fill under the line: light blue tint `rgba(8, 144, 241, 0.12)`.
- Grid lines: light grey `#E2E8F0`, horizontal only.
- Hover tooltip: white card with date + "14 applications" label.
- Show 5–6 data points with a peak around the middle.

#### Chart 2 — Stage Conversion Funnel (right, 40%)

Horizontal funnel/bar chart:
- Title: "Stage Conversion Funnel" (H3).
- Each stage as a horizontal bar, left-aligned, proportional length.
- Stages: Applied (100%), Screening (78%), Documents (58%), Questionnaire (41%), Decision (30%), Approved (23%).
- Bars: gradient from primary blue to teal. Shorter bars further down the funnel.
- Labels: stage name (left) + percentage (right of bar) + absolute count (grey caption).
- Highlight the biggest drop (Screening → Documents) with a small red indicator or annotation.

---

### Second Row Charts

#### Chart 3 — Applications by Region (left, 50%)

Horizontal bar chart:
- Title: "Applications by City" (H3).
- Cities: London (72), Manchester (28), Birmingham (19), Edinburgh (14), Leeds (9).
- Bars: Primary Blue, horizontal, sorted descending.
- City labels on left, count on right of bar.
- Bar width is proportional.

#### Chart 4 — Document Completion Rate (right, 50%)

Donut chart (Recharts style):
- Title: "Document Status" (H3).
- Segments:
  - Approved: teal `#2FCCC0` (45%)
  - Pending Review: Primary Blue (30%)
  - Rejected: Pink `#EF8EA2` (12%)
  - Not Uploaded: Grey (13%)
- Center of donut: "142 Docs" label in H3 bold.
- Legend below chart: colored square + label + percentage, in a 2×2 grid.

---

### Bottom Section — Data Table

**Section heading:** "Top Performing Regions" (H3).

Compact table (white card, 12px radius):
- Columns: City | Applications | Completion Rate | Avg. Hire Time | Active Jobs.
- 5 rows (one per city).
- Completion Rate column: small progress bar (80px) + percentage label.
- Highlight London row subtly (light blue tint) as the top performer.

---

### Date Range Picker Popover (show as overlay state)

When the date range button is clicked:
- White popover card, 320px wide.
- Two month calendars side by side (March and April 2026).
- Selected range highlighted: light blue tint on selected days, darker blue on start and end days.
- Preset quick links on left: "Last 7 Days", "Last 30 Days", "Last Quarter", "This Year" — ghost links, active one highlighted.
- "Apply" (Primary Blue, small) + "Cancel" (Ghost, small) at the bottom.

---

### Design Notes

- Charts should use the brand color palette — no default chart library blues/greens.
- Keep charts clean: minimal axis labels, no unnecessary grid lines, generous whitespace around chart areas.
- The funnel chart is the most important insight — make it visually clear where drop-off happens.
- Show the full 1280×800px frame in the App Shell with "Analytics" active in the sidebar.
