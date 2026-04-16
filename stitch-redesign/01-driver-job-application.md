# Stitch Prompt 01 — Driver App: Job Application (Public)

> Reference: Design System from Prompt 00.
> Context: This is the very first screen a driver candidate sees — a public-facing, multi-step application form. URL: `/apply/:jobSlug`

---

## Prompt

Design the **Job Application** screen for the Laundryheap Driver Onboarding mobile app. This is a public page (no login required) where prospective drivers begin their application for a specific job posting.

---

### Layout & Container

- **Background:** gradient `linear-gradient(135deg, #BAEBFF 0%, #93ECE5 100%)` covering the full viewport.
- **Card:** centered white card, 390px max-width, 24px padding, 12px border radius, subtle shadow. Vertically centered with some top padding for breathing room.
- **Header area inside card:** Laundryheap logo (text "Laundryheap" in `#202B93` bold, or a placeholder logo block) + job title below it (e.g. "London — Driver Application") in H3 grey.

---

### Step Progress Indicator

- 3 dots or numbered steps at the top of the card content area: **Step 1: Contact**, **Step 2: Vehicle**, **Step 3: Address**.
- Completed step = filled teal circle with white checkmark. Active step = filled primary blue circle with white number. Pending step = grey outline circle with grey number.
- Thin connector lines between dots.

---

### Step 1 — Contact Details (show this step as the primary screen)

Fields (full-width, stacked vertically, 16px gap):
1. **First Name** — text input, placeholder "First name"
2. **Last Name** — text input, placeholder "Last name"
3. **Email Address** — email input with envelope icon on left, placeholder "your@email.com"
4. **Phone Number** — phone input with country flag + dial code selector, then number field

Below fields:
- Small grey caption text: "We'll send your login code to this phone number."
- **"Continue →"** button — full width, Primary Blue, Large size (48px height), rounded 8px.

---

### Step 2 — Vehicle Type (show as a secondary wireframe to the right or below)

- Section heading: "What vehicle do you drive?"
- 3–4 option cards in a 2-column grid:
  - Car (car icon)
  - Van (van icon)
  - Cargo Bike (bike icon)
  - Motorcycle (motorcycle icon)
- Each option card: icon centered, label below icon, 12px radius, border. Selected state: primary blue border, light blue tint background, blue checkmark top-right corner.
- **"Continue →"** button — full width, Primary Blue, Large.

---

### Step 3 — Address (show as a third wireframe)

Fields:
1. **Address Line 1** — text input
2. **Address Line 2** — text input, optional label
3. **City** — text input
4. **Postcode** — text input
5. **Country** — select dropdown (default "United Kingdom")

- **"Submit Application →"** button — full width, Primary Blue, Large.
- Below button: caption "By submitting, you agree to our Terms & Privacy Policy." with underlined links.

---

### Success State (show as 4th wireframe)

- Replace form content with:
  - Large teal checkmark icon in a teal circle (64px)
  - H2 heading: "Application Submitted!"
  - Body text: "We've sent a login link to your phone. Check your messages to continue."
  - "Open WhatsApp" secondary button (outline style)
  - "Back to Home" ghost link

---

### Design Notes

- On mobile, the card should fill the screen with the gradient peeking from behind the top and bottom.
- Show a "Back" chevron link at the top-left for Steps 2 and 3.
- Inputs must have floating or above-field labels (not placeholder-only).
- Validation errors: input border turns pink `#EF8EA2`, error message in pink appears below field, error icon inside input on right.
- Show one fully filled-in state (Step 1 with data entered and no errors) alongside the empty default state.
