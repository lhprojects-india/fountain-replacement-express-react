# Stitch Prompt 05 — Driver App: Policy & Acknowledgement Pages (Reusable Layout)

> Reference: Design System from Prompt 00.
> Context: Multiple screening steps follow the same layout — show policy/informational content, enforce a minimum read time, then ask the driver to acknowledge before continuing. This prompt covers the shared layout used across: Role, Fee Structure, Cancellation Policy, Liabilities, How Routes Work, Blocks Classification, Payment Cycle, and Smoking & Fitness Check.

---

## Prompt

Design the **Policy & Acknowledgement page template** for the Laundryheap Driver Onboarding mobile app. This reusable layout is used for all policy and acknowledgement steps during screening. The driver must read the content (enforced by a minimum time timer) and then check a box to acknowledge before the Continue button activates.

---

### Layout

- **Background:** white (content-heavy pages avoid the gradient for readability).
- **Sticky top navigation bar (white, 64px):**
  - Left: back chevron.
  - Center: step title (H4), e.g. "Fee Structure".
  - Right: step counter badge: "Step 6 of 9" (grey pill).
- **Content area:** scrollable, 16px horizontal padding, 24px top padding, 80px bottom padding (to clear the sticky footer).

---

### Minimum Read Timer Bar

- Directly below the sticky nav bar, a very thin (4px height) animated progress bar spans the full screen width.
- Color: teal `#2FCCC0`.
- Animates from 0% to 100% over N seconds (e.g. 90 seconds).
- **Label** on right side of bar (small caption grey): "Please read — 1:23 remaining".
- When timer completes: bar turns fully teal and label changes to green "Ready to continue ✓".

---

### Page Header (inside content area)

- H1 page title: e.g. "Fee Structure"
- Grey body subtitle: "Please read the following carefully before acknowledging."
- Optional: small info box (blue tint) — "This section takes approximately 5 minutes to read."

---

### Content Area (rich text section)

Design the content area for the **Fee Structure** page as the primary example. Show 3–4 content block types:

**Block type 1 — Section Heading + paragraph:**
- H3 section heading: "How You Earn"
- Body paragraph (14px, 1.6 line height): "As a Laundryheap driver, you earn per block completed. Each block consists of a set of pickups and deliveries within your chosen region..."

**Block type 2 — Info card:**
- White card with left teal border (4px), light teal bg tint inside.
- Icon (info circle, teal) + bold label: "Minimum Block Rate"
- Body: "£X.XX per block, reviewed quarterly."

**Block type 3 — Table / rate grid:**
- Simple table: 2 columns (Service Type | Rate). Alternating row tints (white / `#F8FAFC`). Header row in light blue `#E0F4FF`. Rounded corners on table card.

**Block type 4 — Highlight box (important notice):**
- Yellow `#FFD06D` tint background, yellow left border, warning icon.
- Bold label "Important" + body text with a key policy point.

---

### Acknowledgement Footer (sticky, white, top border)

Fixed to the bottom, 80px tall:
- **Left side:** Checkbox (custom, 20px) + label text "I have read and understood the fee structure." — label in 14px dark text.
- Checkbox is unchecked by default (grey outline). Checked state: primary blue fill, white checkmark.
- **Right side:** "Continue →" button — Primary Blue, Medium size (40px). **Disabled** (50% opacity, cursor not-allowed) until: (a) timer completes AND (b) checkbox is checked.

Show two states of the footer side by side:
1. Timer still running, checkbox unchecked → button disabled.
2. Timer complete, checkbox checked → button fully active.

---

### Fee Structure Specific Content (use as example data)

Show at minimum:
- 3 fee tiers in a table (Standard, Express, Same-Day)
- 1 info card about payment timing
- 1 yellow warning box about deductions
- 2 body paragraphs of policy text

---

### Alternate Page Examples (show as smaller thumbnail frames)

Show 3 smaller frames to illustrate how the same template adapts:

**Cancellation Policy page:**
- Content has a numbered list of rules.
- Red/pink warning box for penalty info.

**Smoking & Fitness Check page:**
- Content includes 2 yes/no questions (radio button style).
- Acknowledgement requires both questions answered + checkbox.

**Availability page** (slightly different):
- Content is interactive (a 7×3 grid of toggle cells instead of text) — no timer, just grid + acknowledgement checkbox + continue button.

---

### Design Notes

- The timer bar must feel non-intrusive — it's there to enforce engagement, not annoy.
- Long content pages should feel like reading a clean document — high line spacing, generous white space between sections.
- The sticky footer must visually separate from the content (top shadow or border).
- On very short screens, the footer must not overlap the acknowledgement checkbox.
