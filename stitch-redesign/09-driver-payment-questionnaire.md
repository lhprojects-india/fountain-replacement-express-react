# Stitch Prompt 09 — Driver App: Payment Details & Questionnaire

> Reference: Design System from Prompt 00.
> Context: Two late-stage onboarding screens. Payment = bank/payment account details form. Questionnaire = dynamic one-question-at-a-time flow (like Typeform).

---

## Prompt

Design two screens for the Laundryheap Driver Onboarding mobile app:
1. **Payment Details** — a form to collect bank or payment account information.
2. **Questionnaire** — a dynamic question-by-question form for the driver onboarding questionnaire.

---

## Screen 1 — Payment Details

### Layout

- **Background:** white.
- **Sticky top nav:** back chevron + "Payment Details" title (H4 center).
- **Content:** 16px horizontal padding, scrollable.

### Info Banner

Full-width info box at the top of content (blue tint, blue left border):
- Lock icon (primary blue, 20px).
- **Heading:** "Your payment info is secure"
- **Body:** "This information is used to process your earnings. It is encrypted and never shared with third parties."

### Form Section

- Section label: "Bank Account Details" (H3, 24px margin-top).

Fields (stacked, 16px gap, each with above-field label):
1. **Account Holder Name** — text input, placeholder "Full name as on account"
2. **Sort Code** — text input with mask hint "XX-XX-XX", numeric keyboard
3. **Account Number** — text input, 8-digit numeric, placeholder "12345678"
4. **Bank Name** — text input or select, placeholder "e.g. Barclays, Lloyds"

Below the bank fields, show a subtle divider and a second optional section:

- Section label: "Alternative Payment Method" (H3).
- Toggle switch row: "Use PayPal instead" — left label, right toggle. If ON, show a PayPal email field below.

### Verify Button

- **"Save Payment Details →"** — full width, Primary Blue, Large (48px), 32px margin-top.
- Grey caption below: "You can update your payment details at any time from your profile."

### States

Show two frames:
1. **Empty** form (default with placeholders).
2. **Filled** form (all fields completed, button active, no errors).

---

## Screen 2 — Questionnaire (Typeform-style)

### Layout

- **Background:** gradient `linear-gradient(135deg, #BAEBFF 0%, #93ECE5 100%)`.
- **Sticky top nav (white):**
  - Left: back chevron (or close ×).
  - Center: "Questionnaire" (H4).
  - Right: question counter "3 of 8" (grey caption).
- **Content:** centered card, 16px horizontal padding.

### Progress Bar

Full-width thin bar (6px) directly below nav, teal fill, grey track. E.g. 37.5% complete (3 of 8 questions).

### Question Card

White card, 12px radius, 24px padding, full-width, shadow:
- **Question number:** overline style "Question 3" (teal, 11px, 600 weight, caps).
- **Question text (H2, dark):** "Have you ever been involved in a road traffic accident in the last 3 years?"
- **Body subtext (grey, 14px):** optional — "Include all incidents, even minor ones."

### Answer Options (Multiple Choice)

Show 4 answer option cards below the question card, 8px gap:
- Each option: white card, 12px radius, 12px padding, `#E2E8F0` border.
- Left: letter label "A", "B", "C", "D" in grey circle (24px, outline).
- Right: option text in H4.
- **Unselected:** white bg, grey border, grey letter circle.
- **Selected:** light blue bg `#E0F4FF`, primary blue border, blue filled letter circle (white letter), blue checkmark icon on far right.
- **Hover:** light grey bg tint.

Show option "B — No" as selected.

### Text Input Answer Variant

Show a second question variant (thumbnail frame):
- Question: "Briefly describe your previous delivery experience, if any."
- Answer: tall textarea input (120px min height), placeholder "Type your answer here..."
- Character count below: "142 / 500 characters" (grey caption, right-aligned).

### Navigation Footer (sticky)

Fixed white footer, 80px:
- Left: "← Back" ghost button (grey).
- Center: dot indicators (8 dots, current dot is primary blue and slightly larger, completed = teal, pending = grey).
- Right: "Next →" Primary Blue button (medium). On last question: "Submit" button.

### Completion Screen (separate frame)

After submitting:
- Full gradient background.
- Centered white card:
  - Teal checkmark icon in teal circle (72px).
  - H1: "Questionnaire Complete!"
  - Body grey: "Thank you for completing the questionnaire. Our team will review your responses."
  - "Back to Dashboard →" (Primary Blue, full width, Large).

---

### Design Notes

- The questionnaire should feel engaging and lightweight — one question at a time, full focus.
- Option cards should have generous padding so they feel easy to tap.
- Navigation is via the footer, not a swipe gesture (keep it accessible).
- Payment form fields must show a lock icon somewhere subtle to reinforce security.
- Show both screens at 390px mobile width.
