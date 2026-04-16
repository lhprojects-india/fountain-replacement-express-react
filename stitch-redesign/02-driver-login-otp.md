# Stitch Prompt 02 — Driver App: Login (OTP Flow)

> Reference: Design System from Prompt 00.
> Context: Returning drivers log in via a magic-link / OTP flow. Step 1: enter email. Step 2: enter 6-digit code sent to their phone/email.

---

## Prompt

Design the **Driver Login** screens for the Laundryheap Driver Onboarding mobile app. This is a two-step passwordless login: the driver enters their email, receives a 6-digit one-time code, and enters it to authenticate.

---

### Layout & Container

- **Background:** same gradient as the application page — `linear-gradient(135deg, #BAEBFF 0%, #93ECE5 100%)`.
- **Card:** centered white card, max-width 390px, 32px padding, 12px radius, subtle shadow. On mobile it fills the screen (full viewport height) with rounded corners only at the top.
- **Top of card:** Laundryheap logo placeholder centered.

---

### Screen 1 — Enter Email

- **Heading (H1):** "Welcome back"
- **Subheading (body, grey):** "Enter your email to receive a login code."
- **Email input:** full-width, envelope icon on left, placeholder "your@email.com", above-field label "Email address"
- **"Send Code"** button — full width, Primary Blue, Large (48px), 16px margin-top.
- **Caption below button:** "Don't have an account? [Apply here →]" — "Apply here" is a primary blue link.

Show two states side by side:
1. **Empty / default** state
2. **Email entered, valid** state (button becomes fully active/opaque)

---

### Screen 2 — Enter OTP Code

- **Back arrow** at top-left (ghost, chevron-left icon).
- **Heading (H1):** "Check your messages"
- **Subheading (body, grey):** "We sent a 6-digit code to [driver@email.com]. Enter it below." — email in bold.
- **OTP Input:** 6 individual digit input boxes in a row.
  - Each box: 52×64px, 10px border radius, 1px border `#E2E8F0`, 24px font, 600 weight, centered text.
  - Inactive state: grey border, light grey background tint.
  - Active/focused state: primary blue border, white background, primary blue text.
  - Filled state: primary blue border, white background, dark text.
  - Error state: all 6 boxes get pink border, shake animation implied.
- 16px gap between boxes (they fill the card width evenly).
- **"Verify Code"** button — full width, Primary Blue, Large, 24px margin-top. Disabled until all 6 digits entered.
- **Resend link** below button: "Didn't receive it? [Resend code]" — link in primary blue. Show a countdown variant: "Resend in 0:42" (grey, not clickable).

Show three states:
1. **Empty** (no digits entered, button disabled)
2. **Partially filled** (3 of 6 digits, 4th box is active/focused)
3. **Error** (invalid code entered — all boxes pink border, error message "Invalid code. Please try again." in pink below the OTP boxes)

---

### Loading State (overlay)

- On "Send Code" click: button shows a spinner (white, 20px) replacing the text, button is disabled, slight opacity on the whole card.
- On "Verify Code" click: same spinner in button.

---

### Design Notes

- The OTP boxes should auto-advance focus to the next box as each digit is typed.
- On mobile, the numeric keyboard should open automatically (hint this in the design with the keyboard shown in one frame).
- Show one frame with the iOS numeric keyboard visible at the bottom of the screen while the OTP boxes are being filled.
- Keep the card feeling light and friendly — no heavy borders or dark backgrounds inside the card.
