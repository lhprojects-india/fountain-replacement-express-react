# Stitch Prompt 03 — Driver App: Driver Dashboard

> Reference: Design System from Prompt 00.
> Context: The main home screen after login. Shows the driver's application stage, next action, document progress, and any notifications.

---

## Prompt

Design the **Driver Dashboard** screen for the Laundryheap Driver Onboarding mobile app. This is the central hub a driver sees after logging in — it communicates where they are in the hiring pipeline and what they need to do next.

---

### Layout

- **Background:** gradient `linear-gradient(135deg, #BAEBFF 0%, #93ECE5 100%)`.
- **Top header bar (sticky):** white, 64px tall.
  - Left: Laundryheap logo/wordmark.
  - Right: notification bell icon (with optional red badge count) + user avatar circle (initials, 36px, navy background).
- **Scrollable content** below header, with 16px horizontal padding.

---

### Hero / Greeting Section

- Full-width white card (12px radius, 24px padding, subtle shadow).
- Left: driver's name in H2 ("Hi, James 👋" — use emoji only in this one instance), subtitle in grey body: "Your application is in progress."
- Right: current **stage badge pill** — e.g. "Screening" in Primary Blue background, white text, 999px radius.
- Below the text: a thin horizontal progress bar showing overall pipeline progress (e.g. 40% complete). Teal fill on grey track. Caption below: "Step 2 of 5 — Screening".

---

### Stage Timeline

- Heading: "Your Progress" (H4, left-aligned).
- Vertical timeline list (full-width, white card, 12px radius):
  - Each stage is a row: left circle icon → connector line → stage name + status.
  - **Completed stage:** teal filled circle with white checkmark, stage name in dark text (normal weight), "Completed" label in teal caption.
  - **Active stage:** primary blue filled circle with white arrow/chevron, stage name in H4 bold dark, "In Progress" label in blue. Row has a light blue left accent border.
  - **Pending stage:** grey outline circle with grey number, stage name in grey text, no status label.
  - Stages (in order): Applied → Screening → Documents → Questionnaire → Decision.
  - Connector lines between circles (grey dashed for pending, solid teal for completed).
- Show the "Screening" stage as active (stage 2).

---

### Next Action Panel

- Prominent full-width card below the timeline.
- Blue gradient background: `linear-gradient(135deg, #0890F1, #202B93)`.
- White text throughout.
- Large icon placeholder (48px, white, e.g. clipboard icon).
- H3 heading: "Continue Screening"
- Body text: "You're 60% through the screening steps. Complete them to move forward."
- Full-width white button with primary blue text: "Continue Screening →"

---

### Document Progress Card

- White card, 12px radius.
- Header row: "Documents" label (H4) + "View All →" link in primary blue (right-aligned).
- Circular progress indicator (donut, 72px): teal fill showing e.g. 2/5 documents.
- Next to donut: "2 of 5 required documents uploaded" in body text + "3 remaining" in yellow badge.
- List of 2–3 document items (compact rows):
  - Document name + status chip (Uploaded = teal, Pending = yellow, Rejected = pink).

---

### Notifications / Admin Messages (conditional)

- Only shown if there are messages. Amber/yellow info box:
- Left: bell icon in yellow.
- Text: "Your driving licence was rejected. Please re-upload a clearer image."
- Right: "View" link in primary blue.

---

### Withdraw Application Link

- At the very bottom of scroll content, centered grey caption text: "No longer interested? [Withdraw Application]" — link opens a confirmation dialog.

---

### Withdrawal Confirmation Dialog

Show this dialog on top of the dashboard (dimmed overlay):
- White card dialog, centered.
- Warning icon (pink, 48px) at top.
- H3: "Withdraw Application?"
- Body: "This will permanently remove your application. This action cannot be undone."
- Two buttons stacked: "Yes, Withdraw" (Destructive/pink, full width) + "Keep My Application" (Outline, full width).

---

### Design Notes

- Show two versions of the dashboard:
  1. **Early stage** (Screening active, 0 documents uploaded, no notifications).
  2. **Later stage** (Documents active, 2/5 docs uploaded, 1 rejection notification).
- The sticky header must remain visible while scrolling.
- Keep vertical rhythm tight — no more than 16px gap between major sections.
