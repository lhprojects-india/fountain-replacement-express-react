# Stitch Prompt 14 — Admin Panel: Kanban Board & Call Queue

> Reference: Design System from Prompt 00. Use the App Shell from Prompt 10.
> Context: Two additional views. Kanban = a drag-and-drop board alternative to the pipeline table. Call Queue = list of scheduled hiring calls.

---

## Prompt

Design two pages for the Laundryheap Driver Onboarding Admin Panel:
1. **Kanban Board** — drag-and-drop stage board for visualising the pipeline.
2. **Call Queue** — list of scheduled and outstanding calls to driver candidates.

Use the App Shell from Prompt 10 as the outer frame for both.

### ATS Direction Guardrails (Important)

- Treat this as a **recruitment pipeline board + interview/candidate call management**.
- Replace any dispatch-like interpretation with hiring language: **screening calls, interview calls, follow-up calls**.
- Avoid logistics artifacts: dispatch lanes, delivery route cues, shipment statuses, map clusters.
- Board cards should read like ATS candidate cards (stage, reviewer notes, compliance status), not delivery tasks.

---

## Screen 1 — Kanban Board

### Page Header

- H1: "Pipeline Board"
- Right: view toggle — two segmented buttons: **"Table"** (outline) and **"Board"** (active, Primary Blue) to switch between pipeline views.
- "Filter" button (outline, funnel icon) to the left of the view toggle.

### Board Layout

Horizontally scrollable column board. Show 5–6 columns visible at 1280px:

**Column anatomy:**
- Width: 240px per column, 12px gap between columns.
- Column header (top):
  - Stage name (H4, dark).
  - Application count badge (small, grey bg: e.g. "12 applications").
  - Optional: column color indicator (thin 4px top bar matching stage badge color).
- Cards inside column: vertically stacked, 8px gap, scrollable within column.
- Column has a light grey `#F1F5F9` background, 12px radius, 12px padding.
- **"+ Add"** button at the bottom of each column (ghost, full-width).

**Columns to show:**
1. Applied (grey top bar) — 5 cards visible
2. Screening (blue top bar) — 4 cards
3. Documents (yellow top bar) — 3 cards
4. Decision (navy top bar) — 2 cards
5. First Block (teal top bar) — 3 cards

**Kanban card anatomy (per card):**
- White card, 10px radius, 12px padding, 1px border, hover shadow.
- **Top row:** driver name (H4, 14px, 600 weight) + vehicle icon (16px grey, far right).
- **Stage badge** (small, current stage pill).
- **City** (caption, location pin icon, 12px grey).
- **Applied date** (caption, grey): "Applied Apr 3".
- **Days in stage** (caption): "8 days" — red text if overdue (>7 days), grey if normal.
- **Bottom row:** document status icons (3 small file icons, teal = uploaded, grey = missing) + admin avatar (24px, who last touched it).
- **Drag handle:** subtle ⠿ grip icon on left edge, visible on hover.

**Dragging state:**
- Show one card mid-drag: card becomes slightly transparent/elevated with shadow, placeholder dashed outline stays in original position.

**Column header with count badge variants:**
- Normal: grey badge.
- Needs attention: yellow badge with ⚠ icon.

---

## Screen 2 — Call Queue

### Page Header

- H1: "Call Queue"
- Grey caption: "5 calls scheduled for today."
- Right: **"+ Schedule Call"** (Primary Blue, medium, phone-plus icon) + **Date picker** (outline button, calendar icon, "Apr 10, 2026").

### Filter Tabs

- **Today** (active) | **This Week** | **Upcoming** | **Missed** (badge "3", pink).

### Call List

White card, 12px radius. Table or list inside.

**List row anatomy (each row = one call):**
- **Time:** "10:30 AM" in H4 dark (leftmost, 80px column). If missed: red strikethrough.
- **Driver:** avatar (32px initials) + name (H4, 14px) + city (caption grey).
- **Stage:** stage badge pill.
- **Phone:** phone number in body grey (with copy icon on hover).
- **Type:** badge — "Intro Call" (blue), "Document Review" (yellow), "Decision Call" (navy).
- **Status badge:** Scheduled (blue), Completed (teal), Missed (pink), No Answer (yellow).
- **Actions:** 
  - If Scheduled: **"Start Call"** (Primary Blue button, small, phone icon) + **"Reschedule"** (Outline, small).
  - If Missed: **"Reschedule"** (yellow outline, small, warning icon) + **"Mark No Show"** (Ghost, small).
  - If Completed: **"View Notes"** (Ghost, small, document icon).

**Show 6 rows with varied statuses:**
1. 09:00 AM — James O. | Screening | Missed (pink badge) → Reschedule button.
2. 10:30 AM — Priya S. | Applied | Scheduled (blue badge) → Start Call button.
3. 11:00 AM — Marcus W. | Documents | Scheduled → Start Call.
4. 02:00 PM — Tom B. | Decision | Scheduled → Start Call.
5. 03:30 PM — Amara K. | Documents | No Answer (yellow) → Reschedule.
6. 04:00 PM — David L. | Questionnaire | Scheduled → Start Call.

**Row hover:** light blue row tint.

### Call Notes Modal (show as overlay)

When "Start Call" is clicked:
- White modal, 520px wide.
- H2: "Call — Priya S."
- Phone number in H3 with a "Copy" icon.
- Large **"📞 Dial"** button (Primary Blue, large, full width, phone icon).
- Divider.
- **Call Notes** textarea (large, 120px, placeholder: "Record call notes here...").
- **Outcome** row: label "Call Result:" + 3 radio-style button chips: "Reached" (teal), "No Answer" (yellow), "Left Voicemail" (grey).
- **Footer:** "Save & Close" (Primary Blue, full width) + "Discard" (Ghost).

---

### Design Notes

- The Kanban board is horizontal-scroll — show a scroll hint (fade-out on right edge of content area).
- Card sizes in Kanban must be compact enough to show 5+ columns but readable — 14px minimum font.
- The Call Queue is time-sensitive — the time column and status badge are the most important visual anchors.
- Show both screens at 1280×800px in the App Shell.
