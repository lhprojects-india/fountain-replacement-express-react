# Week 7 — Day 1: Verification Workflow Polish

## Context

Week 6 built the entire document collection pipeline — upload infrastructure, image/PDF upload UI, in-app video recording, document submission, admin review with approve/reject, and security/optimization. Today we polish the verification workflow and ensure smooth auto-transitions.

**Previous day (Week 6, Day 5)**: Document security — compression, HEIC conversion, access logging, pipeline progress indicators.

**What we're building today**: Admin verification workflow improvements — batch review, side-by-side comparison, verification checklists, and robust auto-transition when all docs pass.

## Today's Focus

1. Enhanced admin verification workflow
2. Verification checklists per document type
3. Side-by-side document comparison view
4. Auto-transition on complete verification
5. Verification history and audit

## Detailed Changes

### Backend

#### 1. Verification checklist model

Add to schema:
```prisma
model VerificationChecklist {
  id                Int     @id @default(autoincrement())
  requirementCode   String  @map("requirement_code")
  checkItem         String  @map("check_item")
  sortOrder         Int     @default(0) @map("sort_order")

  @@map("verification_checklists")
}
```

Seed default checklist items:
- `selfie`: "Face clearly visible", "Photo is recent", "No sunglasses/hat"
- `driving_license`: "License is valid/not expired", "Name matches application", "Correct license class"
- `vehicle_photo`: "Full vehicle visible", "License plate readable", "Vehicle matches declared type"
- `id_document`: "Document is valid", "Name matches application", "Not expired"
- `vehicle_video`: "Full vehicle walkthrough", "Interior visible", "Vehicle clean and appropriate"

#### 2. Enhanced review endpoint

Update `PUT /api/applications/:id/documents/:docId/review`:

Body now accepts:
```javascript
{
  status: 'approved' | 'rejected',
  notes: string,
  checklist: [
    { item: 'Face clearly visible', passed: true },
    { item: 'Photo is recent', passed: true },
  ]
}
```

Store checklist results in the `reviewerNotes` field as structured JSON (or add a `checklistResults` JSON field to DocumentSubmission).

#### 3. Document comparison data

When reviewing a document, include related application data for verification:
```
GET /api/applications/:id/documents/:docId/context
```

Returns:
```javascript
{
  document: { ... full submission data },
  applicantInfo: { firstName, lastName, address, vehicleType, city },
  requirement: { name, description, checklist: [...] },
  previousVersions: [...] // if re-uploaded
}
```

#### 4. Robust auto-transition

Ensure the auto-transition `documents_under_review → payment_details_pending` is robust:
- Triggered every time a document is approved
- Checks: ALL required documents have `status: 'approved'`
- Optional documents don't block transition
- If any required document is still pending/rejected, stay in current stage
- Log the auto-transition with `actorType: 'system'`

### Frontend (Admin Web)

#### 1. Enhanced `DocumentReviewer.jsx`

**Layout update — split view:**
```
┌──────────────────┬──────────────────────┐
│                  │ Document Details      │
│                  │                       │
│   [Document      │ Type: Driving License │
│    Preview]      │ Uploaded: 2 days ago  │
│                  │                       │
│   (full-size     │ Verification:         │
│    image or      │ ☑ License is valid    │
│    video player) │ ☑ Name matches        │
│                  │ ☐ Correct class       │
│                  │                       │
│                  │ Applicant Info:       │
│                  │ Name: John Smith      │
│                  │ City: London          │
│                  │ Vehicle: Van          │
│                  │                       │
│                  │ Notes: ______________ │
│                  │                       │
│                  │ [Approve] [Reject]    │
└──────────────────┴──────────────────────┘
│ [◀ Prev] Driving License (2/5) [Next ▶] │
└──────────────────────────────────────────┘
```

**Features:**
- Navigate between documents with prev/next
- Keyboard shortcuts: Left/Right arrows for navigation, A for approve, R to open reject dialog
- Checklist items are checkboxes — reviewer ticks each one
- All checklist items must be checked for approve to be enabled
- Applicant info sidebar for cross-referencing
- Previous upload versions visible (if re-uploaded)

#### 2. Batch review mode

"Review All" mode that goes through each pending document sequentially:
- Step 1: Show document 1 → Approve/Reject → auto-advance to document 2
- Continue until all reviewed
- Summary at end: "Reviewed 5 documents: 4 approved, 1 rejected"

#### 3. Verification status in pipeline

When all documents are approved, the card/row should update immediately (optimistic or refetch).

Show in application detail: "Documents: 5/5 approved ✅"

### Frontend (Driver Web)

No driver web changes today.

## Acceptance Criteria

- [ ] Verification checklists seeded per document type
- [ ] Checklist displayed in review UI
- [ ] Reviewer must check all items before approving
- [ ] Split view shows document + context side by side
- [ ] Prev/next navigation between documents works
- [ ] Keyboard shortcuts work
- [ ] Auto-transition fires when all required docs approved
- [ ] Batch review mode works end-to-end
- [ ] Previous versions visible for re-uploaded documents
- [ ] Pipeline reflects updated status immediately

## What's Next (Day 2)

Tomorrow we build the **payment details collection** — the driver-facing form for submitting bank/payment information, driven by the city's payment field schema.
