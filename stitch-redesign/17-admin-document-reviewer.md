# Stitch Prompt 17 — Admin Panel: Document Reviewer & Transition Dialog

> Reference: Design System from Prompt 00. Use the App Shell from Prompt 10.
> Context: Two focused modal/overlay components. Document Reviewer = a full-screen modal for reviewing uploaded driver documents. Transition Dialog = the stage advancement confirmation modal.

---

## Prompt

Design two modal/overlay components for the Laundryheap Driver Onboarding Admin Panel:
1. **Document Reviewer** — a large modal for reviewing and approving/rejecting driver documents.
2. **Stage Transition Dialog** — the confirmation modal used when advancing or moving a driver to a different stage.

Show both as overlays on top of a dimmed app background (the pipeline or detail page behind).

### ATS Direction Guardrails (Important)

- These modals are part of a **candidate compliance/recruitment workflow**, not operations dispatch.
- Document Reviewer should feel like an HR/compliance review tool (clear evidence review, reasoned decisions, audit-safe notes).
- Stage Transition should feel like ATS progression governance (requirements checklist, optional rationale, safe confirmation).
- Avoid logistics visuals, map hints, transport telemetry, or delivery language.

---

## Component 1 — Document Reviewer Modal

### Trigger Context

Opened when an admin clicks "Review" on a document in the Application Detail panel (Documents tab).

### Modal Frame

- Full-screen overlay: dark semi-transparent background `rgba(0,0,0,0.5)`.
- Modal card: white, very wide (1100px), tall (80vh), 16px radius, elevated shadow.
- **Header bar (64px):**
  - Left: H3 "Review Document" + driver name in grey caption: "Driving Licence — James Okonkwo"
  - Right: close × button (grey icon, ghost).

### Two-column layout inside modal

**Left panel (65% width) — Document Preview:**
- White/light grey `#F8FAFC` background.
- Centered placeholder for document image/PDF (show as a grey rectangle with a document icon in the center, labeled "Document Preview").
- Toolbar above the preview (right-aligned): zoom-in icon, zoom-out icon, rotate icon, download icon — all grey icon buttons (32px each).
- If multi-page: page navigator at bottom center — "Page 1 of 2" with left/right arrows.
- On hover of preview: a subtle "🔍 View Full Screen" overlay button appears.

**Right panel (35% width) — Review Actions:**
- Background: white, 24px padding, left border `#E2E8F0` (1px).
- Scrollable panel.

Top section — Document info:
- H3: "Driving Licence"
- Metadata rows (label + value):
  - Driver: James Okonkwo (link → opens detail panel).
  - Uploaded: Apr 8, 2026 at 14:32.
  - File size: 2.4 MB.
  - File type: JPEG.
- Current status badge: "Pending Review" (blue pill).

Middle section — Review Decision:
- Label (H4): "Your Decision"
- Three large decision cards (full-width, stacked, 8px gap):
  - **Approve** card: teal left border, teal checkmark icon, "Approve" label + caption "Document meets requirements." Selectable (click to select, teal outline + teal bg tint when selected).
  - **Reject** card: pink left border, pink × icon, "Reject" label + caption "Document does not meet requirements." Selectable (pink outline + pink bg tint when selected).
  - **Request Re-upload** card: yellow left border, yellow refresh icon, "Request Re-upload" + caption "Ask driver to upload a clearer version." Selectable (yellow outline + yellow bg tint when selected).

**Rejection Reason** (shown when Reject or Request Re-upload is selected):
- Animated expand from below.
- Label: "Reason (required)"
- Textarea (80px tall, placeholder: "Describe why the document was rejected, e.g. 'Image is blurry'...")
- Pre-written reason chips below textarea: "Image too blurry", "Incorrect document", "Expired document", "Poor lighting" — clicking a chip inserts text into textarea.

Bottom section — Actions:
- **"Submit Decision"** button (full-width, Primary Blue, Large) — disabled until a decision is selected (and reason filled if required).
- "Cancel" ghost link below button.
- Grey caption: "Driver will be notified automatically."

---

## Component 2 — Stage Transition Dialog

### Trigger Context

Opened when admin clicks "Advance Stage" button on the application detail page or pipeline action.

### Modal Frame

- Dark semi-transparent overlay.
- Modal card: white, 520px wide, 24px padding, 12px radius.
- **Header:** H2 "Move Application" + driver name in H3 grey below: "James Okonkwo — currently in Screening".
- Close × in top-right corner.

### Current → New Stage Visual

- Large horizontal arrow visual in the center:
  - Left bubble: current stage badge "Screening" (blue pill, larger 32px height).
  - Arrow →
  - Right bubble: new stage badge "Documents" (yellow pill, larger 32px height).

### Stage Selector

Below the visual, label "Move to stage:" + a row of stage badge pills to choose from (all stages except current, in order). Selected one gets a dark outline. Use pill chips that are clickable.

**Warning states (show all 3):**
1. **Standard advance** (no warning): clean, no extra UI.
2. **Skip warning** (moving forward more than 1 stage): yellow info box — "⚠ You're skipping stages. Some data may be incomplete."
3. **Backward move warning:** pink/red info box — "⚠ Moving backward will reset the Documents and Questionnaire stages for this driver. This cannot be undone."

### Requirements Checklist

White card with light border, 12px radius:
- H4: "Checklist before advancing"
- 3 checklist items:
  - ✅ "Screening steps completed (9/9)" — teal ✓.
  - ✅ "At least 1 facility selected" — teal ✓.
  - ❌ "Driving licence approved" — pink ×. (required but not complete)
- If any item is ❌, show a yellow warning below: "Some requirements are not met. You can still advance, but this may require follow-up."

### Note Field

Textarea (80px, full-width): "Add a note about this transition (optional)" placeholder.

### Footer Buttons

- **"Confirm Move to Documents"** (Primary Blue, full-width, Large) — label updates to reflect selected stage.
- **"Cancel"** (Ghost, full-width below).

---

### Design Notes

- The Document Reviewer is the most complex modal — left panel is purely display, right panel is purely action. Keep the visual boundary clear.
- The pre-written rejection reason chips are a UX helper — show them clearly below the textarea.
- The Stage Transition dialog must feel decisive but safe — the checklist reassures the admin they've covered their bases.
- Show both modals on a blurred/dimmed version of the Application Pipeline behind them.
