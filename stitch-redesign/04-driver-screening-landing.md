# Stitch Prompt 04 — Driver App: Screening Landing

> Reference: Design System from Prompt 00.
> Context: The hub screen for the Screening stage. Shows all screening steps as a checklist. Driver resumes from where they left off.

---

## Prompt

Design the **Screening Landing** screen for the Laundryheap Driver Onboarding mobile app. This is the hub page for the Screening stage — it shows all required screening steps as a checklist and lets the driver resume or jump to any incomplete step.

---

### Layout

- **Background:** gradient `linear-gradient(135deg, #BAEBFF 0%, #93ECE5 100%)`.
- **Top navigation bar (sticky, white):**
  - Left: back chevron + "Dashboard" label.
  - Center: "Screening" page title (H4, dark).
  - Right: nothing, or a progress label "3 of 9 complete".
- **Scrollable content** below nav, 16px horizontal padding.

---

### Hero Section

- Full-width white card, 12px radius, 24px padding.
- H2 heading: "Complete Your Screening"
- Body text: "Work through each step below at your own pace. You can pause and resume at any time."
- Overall progress bar (teal fill, grey track, 8px height, 8px radius):
  - Shows e.g. 3 of 9 steps complete.
  - Caption below bar: "3 of 9 steps completed".

---

### Step Checklist

Each step is a card row. Show all 9 steps:

1. Introduction
2. About Laundryheap
3. Your Role
4. Availability
5. Facility Locations
6. Fee Structure
7. How Routes Work
8. Cancellation Policy
9. Smoking & Fitness Check

**Card row anatomy (per step):**
- White card, 12px radius, 12px horizontal padding, 16px vertical padding.
- Left: status icon circle (32px):
  - **Completed:** teal filled circle, white checkmark icon.
  - **Active/In Progress:** primary blue filled circle, white play/arrow icon.
  - **Pending:** grey outline circle, grey number (1, 2, 3...).
- Middle: step name (H4 dark text) + optional short descriptor in grey caption (e.g. "~5 min read").
- Right: for completed steps — grey "Done" label. For active — blue "Resume →" label. For pending — grey "Locked" or nothing (if sequential) or grey chevron-right (if accessible).
- 8px gap between cards.
- Cards stack in a single column.

**Show this distribution:**
- Steps 1–3: Completed (teal icons).
- Step 4 (Availability): Active/In Progress (blue icon, "Resume →" on right).
- Steps 5–9: Pending (grey numbered icons, grey chevrons).

---

### Locked Step Tooltip (optional frame)

Show a tooltip/popover on a pending step that says: "Complete previous steps first." — small white card with triangle pointer, grey text.

---

### Sticky Bottom Action Bar

Fixed to the bottom of the screen (white, 80px tall, top border):
- Left: grey caption "Next up: Availability"
- Right: full-width (or 50% right-aligned) Primary Blue button "Continue: Availability →"

---

### Completed State (show as a separate frame)

When all 9 steps are done:
- Hero section changes: large teal checkmark in a teal circle (64px) + H2 "Screening Complete!" + body "Great work. Move on to upload your documents."
- The progress bar shows 100% teal fill.
- All step cards show teal checkmarks.
- Bottom action bar button changes to "Proceed to Documents →" with a teal background.

---

### Design Notes

- Steps should feel like a to-do list with clear momentum — the visual weight should draw the eye to the active step.
- The gradient background should be visible between the card rows (gaps between cards).
- Avoid making locked/pending steps feel too disabled — they should be readable but clearly not actionable yet.
- Show the screen on a 390×844px mobile frame.
