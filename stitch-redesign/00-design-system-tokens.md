# Stitch Prompt 00 — Design System & Tokens

> Paste this prompt FIRST. Every subsequent screen prompt will reference this system.

---

## Prompt

Design a complete design system and component library for **Laundryheap Driver Onboarding** — a two-app product (a mobile-first Driver Web App and a desktop Admin Panel) used to onboard delivery drivers for Laundryheap, an on-demand laundry and dry-cleaning service.

---

### Brand Identity

- **Product name:** HeapHire by Laundryheap
- **Tone:** Trustworthy, professional, clean, friendly. Like a modern fintech onboarding (think Revolut or Monzo) crossed with a SaaS ops tool.
- **Font:** Inter (Google Fonts). 700 for display headings, 600 for section headings, 500 for labels, 400 for body copy.
- **Border radius:** 12px cards, 8px inputs and buttons, 999px pills and badges.
- **Grid:** 8px base spacing unit. Use multiples of 8 (8, 16, 24, 32, 48, 64).
- **Shadows:** Subtle only — `0 1px 3px rgba(0,0,0,0.08)` for cards, `0 4px 12px rgba(0,0,0,0.12)` for modals.

---

### Color Tokens

| Token Name        | Hex       | Usage                                          |
|-------------------|-----------|------------------------------------------------|
| `primary`         | `#0890F1` | CTA buttons, links, active states, progress    |
| `primary-dark`    | `#202B93` | Headings, admin sidebar background             |
| `teal`            | `#2FCCC0` | Success, confirmed, focus ring, completion     |
| `teal-light`      | `#93ECE5` | Secondary bg, gradient end, hover fills        |
| `blue-light`      | `#BAEBFF` | Driver app page background, info fills         |
| `yellow`          | `#FFD06D` | Warnings, highlights, attention badges         |
| `pink`            | `#EF8EA2` | Errors, destructive actions, rejected states   |
| `white`           | `#FFFFFF` | Cards, modals, inputs                          |
| `surface`         | `#F8FAFC` | Page background on admin, table zebra rows     |
| `border`          | `#E2E8F0` | Input borders, dividers, card outlines         |
| `text-primary`    | `#1A1A2E` | Primary body text                              |
| `text-secondary`  | `#64748B` | Captions, metadata, helper text                |
| `text-disabled`   | `#A0AEC0` | Disabled inputs and labels                     |

**Gradient (Driver app backgrounds):** `linear-gradient(135deg, #BAEBFF 0%, #93ECE5 100%)`
**Gradient (Admin login/hero):** `linear-gradient(135deg, #202B93 0%, #2FCCC0 100%)`

---

### Typography Scale

| Style          | Size  | Weight | Line Height | Usage                          |
|----------------|-------|--------|-------------|--------------------------------|
| Display        | 32px  | 700    | 1.2         | Page heroes, splash headings   |
| H1             | 28px  | 700    | 1.25        | Page titles                    |
| H2             | 22px  | 600    | 1.3         | Section headings               |
| H3             | 18px  | 600    | 1.4         | Card headings, dialog titles   |
| H4             | 16px  | 600    | 1.4         | Sub-section labels             |
| Body Large     | 16px  | 400    | 1.6         | Primary body text              |
| Body           | 14px  | 400    | 1.6         | Secondary body, table rows     |
| Label          | 13px  | 500    | 1.4         | Form labels, nav items         |
| Caption        | 12px  | 400    | 1.5         | Metadata, timestamps, hints    |
| Overline       | 11px  | 600    | 1.4         | All-caps section labels        |

---

### Component Library

Generate all of the following components in a single design system page. Show each component with all its states.

#### Buttons
- **Primary** (filled `#0890F1`, white text) — default, hover (darken 10%), active (darken 15%), disabled (50% opacity, no cursor)
- **Secondary** (filled `#202B93`, white text) — same states
- **Outline** (transparent bg, `#0890F1` border and text) — default, hover (light blue fill), disabled
- **Destructive** (filled `#EF8EA2`, white text) — default, hover, disabled
- **Ghost** (no bg, no border, `#0890F1` text) — default, hover (light blue tint bg)
- Sizes: Large (48px height), Medium (40px height), Small (32px height)
- Left icon variant, right icon variant, icon-only (square) variant

#### Form Inputs
- **Text input** — default, focus (primary ring), error (pink border + error message below), disabled, with left icon, with right icon
- **Textarea** — default, focus, error, disabled
- **Select dropdown** — default, open, selected, disabled
- **Phone input** — country flag + dial code + number field
- **OTP input** — 6 individual digit boxes, inactive / active / filled / error states
- **Checkbox** — unchecked, checked (primary blue fill), indeterminate, disabled
- **Toggle switch** — off (grey), on (teal), disabled
- **Date picker trigger** — input with calendar icon

#### Badges & Status Chips
Show all variants as horizontal pill shapes (8px vertical padding, 12px horizontal padding, 999px radius):
- **Stage badges:** Applied (grey), Screening (blue), Documents (yellow), Interview (purple), Decision (navy), First Block (teal), Approved (teal filled), Rejected (pink), Withdrawn (grey outline)
- **Status chips:** Pending (yellow), Uploaded (blue), Approved (teal), Rejected (pink), Requires Reupload (orange)
- **Role badges:** Super Admin (navy), Admin (blue), Viewer (grey)
- **Generic:** Info (blue), Success (teal), Warning (yellow), Error (pink)

#### Cards
- Default card (white bg, border, 12px radius, 16–24px padding, subtle shadow)
- Hover card (slightly elevated shadow, border becomes primary color)
- Selected/active card (primary border, light blue tint background)
- Danger card (pink border, pink tint background)

#### Alerts & Info Boxes
- **Info** (light blue bg `#E0F4FF`, primary left border, info icon, title + body text)
- **Success** (light teal bg, teal left border, check icon)
- **Warning** (light yellow bg, yellow left border, warning icon)
- **Error** (light pink bg, pink left border, error icon)

#### Progress & Loading
- Linear progress bar (primary blue fill, grey track, animated)
- Thin "minimum read time" bar (teal, very thin 4px, animates left-to-right over N seconds)
- Circular progress (donut) — used in document completion
- Skeleton loader — show card skeleton, text skeleton, list skeleton
- Spinner (primary blue, 24px and 40px sizes)

#### Navigation Components
- **Sidebar nav item:** icon + label — default, hover, active (left accent bar + white text on navy bg)
- **Tab bar (horizontal):** default, active, with count badge
- **Step progress indicator:** horizontal dots/numbers — completed (teal), active (primary pulsing), pending (grey)
- **Vertical stage timeline:** step circles + connector lines — completed, active, pending states

#### Overlays
- **Modal/Dialog frame:** centered overlay, white card, header with title + close icon, body scroll area, sticky footer with action buttons
- **Drawer/Side sheet:** slides from right, same header/footer pattern
- **Toast/Snackbar:** bottom-right stack — success (teal), error (pink), info (blue), warning (yellow); each with icon + message + optional dismiss

#### Miscellaneous
- **Empty state:** centered illustration placeholder (icon + colored circle bg) + heading + subtext + optional CTA button
- **Avatar:** circular, initials fallback (navy bg, white text), sizes 32px / 40px / 48px
- **Divider:** horizontal line with optional label in center
- **File drop zone:** dashed border rectangle, upload cloud icon, "Drag & drop or click to upload" text, hover state (dashed border becomes primary)
- **Image lightbox thumbnail:** document preview card with overlay "View" button on hover

---

### Spacing & Layout Reference

Show a spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80px — as labeled rectangles.

Show two layout frames:
1. **Mobile shell** (390×844px): status bar 44px, content area, bottom safe area
2. **Desktop shell** (1280×800px): fixed sidebar 256px, fixed header 64px, scrollable main content area

---

### Design Constraints

- All text must meet WCAG AA contrast (4.5:1 minimum for body, 3:1 for large text).
- Touch targets minimum 44×44px on mobile.
- Focus states must be clearly visible (3px ring using `#2FCCC0`).
- No imagery — use icon + color block placeholders only.
