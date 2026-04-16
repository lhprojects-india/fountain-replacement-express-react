# Stitch Prompt 06 — Driver App: Availability & Facility Locations

> Reference: Design System from Prompt 00.
> Context: Two interactive selection screens. Availability = 7×3 time slot grid. Facility Locations = list of laundry facilities grouped by city.

---

## Prompt

Design two interactive selection screens for the Laundryheap Driver Onboarding mobile app:
1. **Availability** — a weekly time slot grid the driver fills in.
2. **Facility Locations** — a list of Laundryheap facilities the driver can work from.

---

## Screen 1 — Availability

### Layout

- Background: white (keeps the interactive grid clear).
- Sticky top nav: back chevron + "Availability" title (H4 center) + "Step 4 of 9" badge.
- Content: 16px horizontal padding.

### Page Header

- H1: "When are you available?"
- Body grey: "Select the time slots when you're typically free to work. You can update this later."
- Small info box (blue tint): "You can select multiple slots. Morning = 6am–12pm, Afternoon = 12pm–6pm, Evening = 6pm–midnight."

### Availability Grid

7 columns (Mon, Tue, Wed, Thu, Fri, Sat, Sun) × 3 rows (Morning, Afternoon, Evening).

**Column headers (day labels):**
- Abbreviated day names (Mon, Tue...) centered above each column.
- 14px, 600 weight, grey.
- "Today" column (e.g. Wednesday) has a teal dot beneath the label.

**Row headers (time slot labels):**
- Left column (outside the grid): "Morning", "Afternoon", "Evening" in 12px caption grey, vertically centered in their row.

**Grid cells:**
- Square cells, filling available width equally. ~44px minimum.
- **Unselected:** white background, `#E2E8F0` border, 8px radius.
- **Selected:** teal `#2FCCC0` background, teal border, white icon (sun/moon/star icon for each time slot) centered, no text.
- **Hover:** light teal tint background (before clicking).
- Gap between cells: 6px.

**Show this example selection:** Mon/Tue/Wed Morning + Mon/Tue Afternoon = 5 cells selected (teal).

**Select All / Clear All row:**
- Below the grid, right-aligned small text buttons: "Select All" (blue) | "Clear" (grey).

### Sticky Footer

Same as policy pages: checkbox ("I confirm this is my typical availability") + "Save & Continue →" button (Primary Blue, disabled until at least 1 slot selected and checkbox checked).

---

## Screen 2 — Facility Locations

### Layout

- Background: white.
- Sticky top nav: back chevron + "Facility Locations" title + "Step 5 of 9" badge.
- Content: 16px horizontal padding.

### Page Header

- H1: "Choose your facilities"
- Body grey: "Select the Laundryheap facilities you'd like to work from. You must choose at least one."

### Search / Filter Bar

- Full-width search input with magnifying glass icon on left, placeholder "Search by city or facility name..."
- Below: horizontal scrollable chip/tab row for city filters: "All" (active, primary blue), "London", "Manchester", "Birmingham", "Edinburgh" — pill chips, 999px radius.

### Facility List

Grouped by city (show 2 cities: London with 3 facilities, Manchester with 2 facilities).

**City group header:**
- Grey overline label "LONDON" (11px, 600 weight, all caps, letter-spacing 0.08em).
- 8px bottom margin.

**Facility card (per facility):**
- White card, 12px radius, 12px padding, `#E2E8F0` border.
- Left: facility name in H4 dark + address in grey caption below.
- Right: toggle/checkbox card. When selected: teal checkmark circle (24px, teal bg, white checkmark).
- Card full-row is tappable.
- **Unselected state:** white bg, grey border, empty circle on right.
- **Selected state:** light teal bg tint `#E6FAF8`, teal border, teal checkmark on right.
- 8px gap between facility cards.
- 24px gap between city groups.

**Show example:** 2 London facilities selected (teal), 1 unselected. Manchester 0 selected.

### Sticky Footer

- Caption: "2 facilities selected" (left).
- "Save & Continue →" button (Primary Blue, disabled if 0 selected).

---

### Design Notes

- The availability grid cells must be large enough for easy tapping on a phone — test at 390px width.
- The facility list should feel like a multi-select checklist, not a radio button list (multiple selections allowed).
- City filter chips should scroll horizontally without a scrollbar visible.
- Both screens are part of the same sequential screening flow — maintain consistent nav bar style.
