# Stitch Prompt 13 — Admin Panel: Application Detail Panel

> Reference: Design System from Prompt 00. Use the App Shell from Prompt 10.
> Context: The detailed view of a single driver application. Opened from the pipeline. Contains tabs for Overview, Documents, Notes, Communications, and History.

---

## Prompt

Design the **Application Detail** panel for the Laundryheap Driver Onboarding Admin Panel. This is opened when an admin clicks a driver's name in the pipeline. It can be displayed as a full page or a wide right-side drawer (show as full page here).

Use the App Shell from Prompt 10 as the outer frame.

### ATS Direction Guardrails (Important)

- This is a **candidate profile in an ATS**, not an operations profile.
- Emphasize hiring context: application summary, interview readiness, verification checklist, reviewer notes, stage history, approval decisioning.
- Avoid logistics-style modules (live location, route path, dispatch ETA, order timelines).
- Keep interactions oriented to recruiting actions: **Review Docs, Add Note, Schedule Interview, Advance/Reject**.

---

### Page-level Header

- Back arrow + "← Pipeline" breadcrumb link (grey).
- H1: "James O." — driver's full name.
- Stage badge inline next to name: "Screening" (Primary Blue pill).
- Right-aligned action buttons:
  - **"Advance Stage"** (Primary Blue, medium) — main CTA.
  - **"Add Note"** (Outline, medium, chat icon).
  - **"Schedule Call"** (Outline, medium, phone icon).
  - **"⋮" More** (Ghost, icon-only, dropdown).

---

### Driver Profile Card (top, full-width)

White card, 16px padding, 12px radius. Horizontal layout:

- **Left — Avatar + basics:**
  - Large avatar circle (64px, navy bg, white initials "JO").
  - Name (H2): "James Okonkwo"
  - Email (body, grey, envelope icon): james.okonkwo@email.com
  - Phone (body, grey, phone icon): +44 7700 900 123
  - City (body, grey, location pin icon): London

- **Right — Key metadata (2×2 mini grid):**
  - Applied: Apr 3, 2026
  - Days in Pipeline: 7 days
  - Vehicle: Van
  - Source: Job Board

- **Far right — Stage flow mini timeline (horizontal):**
  - Compact 5-stage horizontal strip: Applied ✓ → Screening (active, pulsing) → Documents → Decision → First Block.
  - Completed = teal; active = blue; pending = grey.

---

### Tab Bar

Below the profile card, full-width tab bar (white card, tab underline style):
- Tabs: **Overview** | **Documents** (badge "5") | **Notes** (badge "3") | **Communications** | **History**.
- Active tab: dark text + teal underline (3px).
- Inactive: grey text.

---

### Tab 1 — Overview (show this as primary)

Two-column layout (60% / 40%):

**Left column:**

*Personal Details card* (white, 12px radius, 16px padding):
- Section heading H3: "Personal Details"
- 2-column label/value list:
  - Full Name: James Okonkwo
  - Email: james.okonkwo@email.com
  - Phone: +44 7700 900 123
  - Date of Birth: 15 Mar 1990
  - Address: 42 Baker Street, London, W1U 6TY
  - Nationality: British

*Availability card* (same structure):
- Section heading H3: "Availability"
- 7-column mini grid: Mon/Tue/Wed/Thu/Fri/Sat/Sun with Morning/Afternoon/Evening cells.
  - Selected cells: teal-tinted.
  - Not selected: grey-tinted.
  - (Same grid design as driver app but smaller, read-only.)

*Facility Selections card:*
- Section heading H3: "Selected Facilities"
- List of facility names with city labels (e.g. "London Central – Hammersmith", "London East – Stratford").

**Right column:**

*Screening Progress card* (white, 12px radius, 16px padding):
- Section heading H3: "Screening"
- Linear progress bar: 4/9 steps (teal fill).
- Mini checklist of 9 steps with teal ✓ for completed, grey dot for pending.

*Verification Checklist card:*
- Section heading H3: "Admin Verification"
- List of admin-side checks with toggle switches or checkboxes:
  - Identity Verified ✓ (teal)
  - Right to Work Confirmed (unchecked, yellow)
  - Vehicle Check Pending (yellow)
  - Reference Check (unchecked)

---

### Tab 2 — Documents (show as a second frame)

Full-width document list (same card layout as driver app's document upload but from admin perspective):

Each document row:
- Document name (H4) + upload date (caption).
- Status dropdown (instead of badge): **Approved**, Pending, Rejected, Requires Re-upload — selectable inline.
- Thumbnail placeholder (40×48px, grey rect with doc icon).
- **"Review"** button → opens ImageLightbox modal.
- Rejection reason text field (inline, appears when Rejected is selected).

---

### Tab 3 — Notes (show as a third frame)

Threaded internal notes (no driver visibility):

- Add Note area at top: textarea ("Add an internal note...") + "Post Note" button (Primary Blue, small).
- Notes thread below (oldest at bottom, newest at top):
  - Each note: admin avatar (32px) + name (H4, bold) + timestamp (caption grey) + note body (14px). 
  - Actions on hover: Edit (pencil icon) + Delete (trash icon) — grey, appear on right.
  - Show 3 notes in the thread.

---

### Stage Transition Dialog (modal overlay)

Show as an overlay on the detail page:
- White modal card, 480px wide, centered.
- H2: "Advance James to Documents?"
- Current stage → new stage arrows: "Screening → Documents".
- Optional: checklist of requirements before advancing (e.g. "Screening must be 100% complete ✓", "At least 1 document uploaded ✗").
- Notes textarea: "Add a note about this transition (optional)"
- Two buttons: "Confirm Advance" (Primary Blue, full width) + "Cancel" (Ghost, full width).
- Warning variant: if moving backward, show a yellow warning box "Moving backward will reset downstream data."

---

### Design Notes

- The profile card at the top is the anchor — it's always visible across all tabs.
- The tab content should scroll independently below the sticky profile + tab bar.
- Show the full 1280px frame with sidebar active on "Pipeline".
