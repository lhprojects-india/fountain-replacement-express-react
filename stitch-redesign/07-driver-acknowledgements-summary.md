# Stitch Prompt 07 — Driver App: Acknowledgements Summary

> Reference: Design System from Prompt 00.
> Context: The final step of the Screening stage. Shows a summary of all completed acknowledgements and lets the driver officially complete screening.

---

## Prompt

Design the **Acknowledgements Summary** screen for the Laundryheap Driver Onboarding mobile app. This is the final screen of the Screening stage, showing a complete list of all the steps the driver has acknowledged, and a prominent CTA to officially complete their screening.

---

### Layout

- **Background:** gradient `linear-gradient(135deg, #BAEBFF 0%, #93ECE5 100%)`.
- **Sticky top nav (white):** back chevron + "Review & Complete" title (H4 center).
- **Content:** 16px horizontal padding, scrollable.

---

### Hero / Celebration Section

Full-width white card, 24px padding, 12px radius, centered text:
- Large teal icon in a teal-tinted circle (72px outer, 48px icon): e.g. a shield-check or clipboardcheck icon.
- H1: "Almost there!"
- Body grey: "Review your acknowledgements below and submit to complete your screening."
- Teal linear progress bar at 100% with caption: "All 9 steps completed".

---

### Acknowledgements Checklist

Heading: "Your Acknowledgements" (H3, left-aligned, 24px margin-top).

Show all 9 steps as a list inside a white card (12px radius):

Each row:
- Left: teal circle checkmark (20px, solid teal bg, white check icon).
- Middle: step name in H4 dark + completion timestamp in grey caption (e.g. "Completed 2 mins ago" or "Apr 10, 2026").
- Right: "View" link in primary blue (allows driver to re-read any step).
- Thin `#E2E8F0` divider between rows (no divider on last row).
- 16px vertical padding per row.

Steps:
1. Introduction ✓
2. About Laundryheap ✓
3. Your Role ✓
4. Availability ✓
5. Facility Locations ✓
6. Fee Structure ✓
7. How Routes Work ✓
8. Cancellation Policy ✓
9. Smoking & Fitness Check ✓

---

### Declaration Box

Below the checklist, a highlighted info card:
- Light blue `#E0F4FF` background, primary blue left border (4px), 12px radius.
- **Icon:** info circle (primary blue, 20px).
- **Heading (H4):** "By submitting, you confirm:"
- **Bulleted list (body, 14px):**
  - "You have read and understood all policies above."
  - "The information provided is accurate to the best of your knowledge."
  - "You meet the physical and vehicle requirements stated."

---

### Submit Section

Full-width white card below the declaration:
- Checkbox (large, 20px) + label: "I confirm all of the above is correct and I agree to proceed." (14px dark text).
- 16px margin below checkbox.
- **"Complete Screening →"** button — full width, Primary Blue, Large (48px), disabled until checkbox is checked.
- Grey caption below button: "You'll be notified once your application advances to the next stage."

---

### Post-Submit Success State (show as a separate frame)

Replace the page content with a full-screen success moment:
- Center of screen (vertically centered in viewport).
- Large teal animated checkmark (72px, teal circle bg).
- H1: "Screening Complete!"
- Body grey: "Fantastic! Your application has moved to the Documents stage. Upload your documents to keep things moving."
- Two buttons stacked (full-width):
  - **"Upload Documents Now →"** (Primary Blue, Large) — primary action.
  - **"Go to Dashboard"** (Outline, Large) — secondary.

---

### Design Notes

- The "View" links on each acknowledgement row should feel lightweight — they're there for reference, not the primary action.
- The completion moment should feel rewarding and encouraging — use the teal success color prominently.
- The submit button must be clearly the final action on the screen — no ambiguity.
- Show the screen at 390px mobile width with content that requires scrolling (so both the top and the sticky footer states are visible).
