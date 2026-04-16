# Stitch Prompt 11 — Admin Panel: Home Dashboard

> Reference: Design System from Prompt 00. Use the App Shell from Prompt 10.
> Context: The admin home page shown after login. Provides a high-level overview of the hiring pipeline health — KPI stats, recent activity, and items requiring attention.

---

## Prompt

Design the **Admin Home Dashboard** page for the Laundryheap Driver Onboarding Admin Panel. This is the first page seen after login — a command center overview of the hiring pipeline.

Use the App Shell (sidebar + header) from Prompt 10 as the outer frame. Design only the main content area here.

### ATS Direction Guardrails (Important)

- Render this as a **recruiting operations home**, not delivery/logistics operations.
- Prioritize ATS metrics: application volume, stage conversion, time-to-hire, interview completion, document verification status.
- Avoid logistics motifs: route maps, dispatch queues, vehicle movement, package tracking.
- Visual tone should feel like **enterprise hiring SaaS**.

---

### Page Header (inside main content)

- H1: "Good morning, Sarah 👋" (first-name greeting, emoji only here).
- Grey body: "Here's what needs your attention today — Friday, 10 April 2026."
- Right-aligned: a "Refresh" icon button (grey, outline style).

---

### KPI Stat Cards Row

4 cards in a row (equal width, ~280px each at 1280px viewport), 16px gap.

**Card anatomy:** white bg, 12px radius, 16px padding, subtle shadow, left-side colored accent bar (4px).

1. **Total Applications**
   - Accent bar: primary blue.
   - Icon: users icon (primary blue, 24px) in light blue circle.
   - Number: "142" in Display (32px, 700).
   - Label: "Total Applications" (grey caption).
   - Trend chip: "+12 this week" (teal pill).

2. **Pending Review**
   - Accent bar: yellow.
   - Icon: clipboard icon (yellow, 24px) in light yellow circle.
   - Number: "18"
   - Label: "Awaiting Review"
   - Trend chip: "3 overdue" (pink pill).

3. **Docs Awaiting**
   - Accent bar: teal.
   - Icon: file icon (teal) in light teal circle.
   - Number: "34"
   - Label: "Documents to Review"
   - Trend chip: "New today: 7" (blue pill).

4. **Calls Scheduled**
   - Accent bar: navy `#202B93`.
   - Icon: phone icon (navy) in light navy circle.
   - Number: "5"
   - Label: "Calls Today"
   - Trend chip: "Next in 2h" (grey pill).

---

### Middle Row — Two Columns (60% / 40% split)

#### Left Column (60%) — Attention Required

Section heading: "Needs Attention" (H3).

Show 3 alert/action cards, stacked, 8px gap:

**Card type — Overdue Review:**
- Left: red/pink dot indicator.
- Text: "**James O.** has been in Screening for 8 days without progress." (H4 name + body).
- Right: "Review →" (primary blue link).
- Bottom border (thin) separating cards if inside one container card.

**Card type — Document Rejection:**
- Left: yellow dot indicator.
- Text: "**Amara K.** re-uploaded their driving licence. Ready to review."
- Right: "View Docs →" link.

**Card type — Missed Call:**
- Left: pink dot indicator.
- Text: "**Tom B.** missed their scheduled call. Reschedule needed."
- Right: "Reschedule →" link.

Below the cards, a "View All Alerts" ghost link (right-aligned).

#### Right Column (40%) — Recent Activity Feed

Section heading: "Recent Activity" (H3).

Vertical timeline feed (white card, 12px radius, 16px padding):

Each activity item:
- Left: small avatar circle (32px, initials, navy bg) or admin icon.
- Content: action description in body text + timestamp in grey caption.
- Thin divider between items.

Show 5–6 items:
1. **Sarah A.** advanced James O. to Documents stage — *2 min ago*
2. **Auto** — Amara K. submitted questionnaire — *15 min ago*
3. **Michael R.** approved Tom B.'s driving licence — *1 hour ago*
4. **Auto** — New application received: Priya S. (London) — *3 hours ago*
5. **Sarah A.** added note to David L.'s application — *Yesterday*
6. **Auto** — Marcus W. completed screening — *Yesterday*

"View Full Log →" ghost link at bottom.

---

### Bottom Row — Quick Stats Table

Section heading: "Pipeline Overview" (H3, 24px margin-top).

A compact table (white card, 12px radius, no external border):
- Columns: Stage | Applications | Avg. Days | Action Required.
- Rows for each stage: Applied, Screening, Documents, Questionnaire, Decision, First Block.
- Stage column: stage badge pill (from design system).
- Applications column: number in H4 bold.
- Avg. Days column: number + progress bar (thin, 80px wide) showing relative duration.
- Action Required column: count of items needing action + "View →" link.
- Alternating row tints (white / `#F8FAFC`).

---

### Design Notes

- The KPI cards are the first thing the eye lands on — make the numbers the largest, most prominent element.
- The Attention Required section should feel urgent but not alarming — dot indicators convey priority without overwhelming color.
- The Activity Feed should feel like a Slack/Teams activity stream — lightweight, scannable.
- Show this within the App Shell at 1280×800px.
