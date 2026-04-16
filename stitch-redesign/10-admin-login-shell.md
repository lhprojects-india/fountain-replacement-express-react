# Stitch Prompt 10 — Admin Panel: Login & App Shell

> Reference: Design System from Prompt 00.
> Context: The Admin Panel is a desktop-first tool (1280px) for the Laundryheap hiring team. This prompt covers the login screen and the persistent app shell (sidebar + header).

---

## Prompt

Design the **Admin Login** screen and the **App Shell** layout for the Laundryheap Driver Onboarding Admin Panel. This is a desktop SaaS-style tool used by the hiring team to manage driver applications.

### ATS Direction Guardrails (Important)

- This product is a **full-stack managed ATS**, not a logistics operations dashboard.
- Focus on hiring workflow language: **candidates, applications, stages, interviews, assessments, documents, approvals**.
- Avoid logistics visuals/patterns: **maps, route lines, shipment cards, fleet telemetry, dispatch boards, delivery tracking widgets, warehouse/inventory UI**.
- Do not use transport control-center aesthetics (dark map canvas, geolocation pins, route timelines).
- Keep the interface looking like a **modern recruiting operations platform** (Greenhouse/Lever/Ashby style), not a transport management system.

---

## Screen 1 — Admin Login

### Layout

- **Full-viewport background:** deep gradient `linear-gradient(135deg, #202B93 0%, #0890F1 60%, #2FCCC0 100%)`.
- Optional: subtle abstract blob/wave shapes in the background at low opacity (10–15%) to add depth. Use the brand teal and blue colors for the blobs.
- **Centered login card:** white, 400px wide, 48px padding, 16px border radius, elevated shadow `0 20px 60px rgba(0,0,0,0.2)`.

### Card Contents

- **Laundryheap logo** centered at top (text "Laundryheap" in `#202B93` bold 24px, or a placeholder logo block 120×40px).
- **Heading (H2):** "Admin Portal" — dark, centered.
- **Subheading (body grey, centered):** "Sign in to manage driver applications."
- 32px spacer.
- **"Sign in with Google"** button — full width, white background, 1px grey border, 8px radius, 48px height.
  - Left: Google "G" colored logo icon (use a simple colored circle placeholder or the actual 4-color G).
  - Center: "Continue with Google" (body text, 500 weight, dark).
  - Hover: very light grey bg tint.
- 24px spacer.
- Thin `#E2E8F0` divider with centered "or" label (grey caption).
- 24px spacer.
- **Dev/email sign-in section** (collapsible or below divider, de-emphasized):
  - Email input field + Password input field.
  - **"Sign In"** button (Primary Blue, full width, 40px).
  - These fields should be visually secondary — smaller font, lighter weight, less visual emphasis than the Google button.
- Footer caption (grey, centered, 12px): "Laundryheap internal use only."

---

## Screen 2 — App Shell (1280×800px)

This is the persistent layout frame that wraps every admin page.

### Fixed Sidebar (256px wide, full height, navy `#202B93`)

**Top section:**
- Laundryheap logo (white text/icon, 24px) with 24px padding.
- Subtle 1px divider below logo.

**Navigation items (vertical list, 48px tall each):**
- Each item: 20px left padding, icon (20px, white/grey) + label (14px, 500 weight).
- Items: **Pipeline** (git-branch or kanban icon), **Jobs** (briefcase icon), **Calls** (phone icon), **Analytics** (bar-chart icon), **Settings** (settings/gear icon).
- Preferred labels for ATS clarity: **Pipeline**, **Open Roles**, **Interviews**, **Analytics**, **Settings**.
- **Default state:** icon + text in grey `#8892C8` (muted navy-tinted grey).
- **Hover state:** light navy tint bg `rgba(255,255,255,0.08)`, icon + text in white.
- **Active state:** white text + icon, left accent bar (3px, teal `#2FCCC0`), very subtle `rgba(255,255,255,0.12)` bg.
- Count badges on nav items: small pill (18px height, primary blue bg, white text) shown on Pipeline (e.g. "24") and Calls (e.g. "5").

**Bottom section:**
- Thin divider.
- User avatar row: circle avatar (initials, 36px, white bg, navy text) + name "Sarah A." (white, 14px) + email (grey caption, 12px).
- Logout icon (door/exit icon, grey, 16px) on far right.

### Fixed Header (64px tall, white, full width minus sidebar)

- Left: **breadcrumb / page title** — e.g. "Pipeline" in H3 dark.
- Center: empty or global search bar (input with magnifying glass icon, 320px wide, `#F8FAFC` bg, border, placeholder "Search drivers...").
- Right:
  - Notification bell icon (grey, 20px) with red badge count "3".
  - Vertical divider.
  - User avatar (same initials circle, 36px) + "Sarah A." label + chevron-down for dropdown.

### Main Content Area

- Background: `#F8FAFC`.
- Padding: 24px all sides.
- Show a placeholder content area (grey rectangle) labeled "Page Content Area" to indicate the scrollable region.

---

### States to Show

1. **Login page** (full screen, no shell).
2. **Shell with Pipeline as active nav item** (show full 1280px frame).
3. **Shell with Settings as active nav item** (same frame, different active state).
4. **Sidebar collapsed variant** (64px wide, icon-only mode for smaller screens) — show as a 4th frame.

---

### Design Notes

- The sidebar must feel premium but not heavy — the navy color is strong, so keep text muted unless active.
- The header search bar is important — hiring teams frequently search by driver name.
- The shell should have a subtle transition between sidebar and main content (no harsh line — just the background color contrast).
- Show at 1280×800px desktop viewport.
