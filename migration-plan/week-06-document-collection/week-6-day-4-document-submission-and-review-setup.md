# Week 6 — Day 4: Document Submission & Review Setup

## Context

We have image/PDF upload and in-app video recording working. Today we build the submission completion flow and prepare the admin review infrastructure.

**Previous day**: In-app video recording — MediaRecorder, camera toggle, duration limits, preview, iOS fallback.

**What we're building today**: The "submit all documents" flow that transitions the application to review, and the admin-side document review interface.

## Today's Focus

1. Document submission completion (driver side)
2. Admin document review interface
3. Individual document approve/reject
4. Document status tracking

## Detailed Changes

### Backend

#### 1. Submit documents endpoint

Add to `apps/backend/src/modules/documents/document.service.js`:
```javascript
export async function submitDocumentsForReview(applicationId, email, prisma) {
  // 1. Validate application is in documents_pending
  // 2. Check all required documents are uploaded (status != 'uploading')
  // 3. If complete: transition to documents_under_review via stage engine
  // 4. If incomplete: return { submitted: false, missing: [...] }
}
```

Add route:
```
POST /api/driver/documents/submit — submit all documents for review
```

#### 2. Document review endpoints (admin)

Add to document routes:
```
PUT  /api/applications/:id/documents/:docId/review
Body: { status: 'approved' | 'rejected', notes?: string }

POST /api/applications/:id/documents/review-all
Body: { decisions: [{ documentId, status, notes }] }
```

Service function:
```javascript
export async function reviewDocument(documentId, reviewerEmail, status, notes, prisma) {
  // 1. Update DocumentSubmission: status, reviewerEmail, reviewerNotes, reviewedAt
  // 2. Log the review action
  // 3. Check if all documents are now reviewed
  // 4. If all approved → auto-transition to payment_details_pending
  // 5. If any rejected → notify driver to re-upload (stay in documents_under_review)
}
```

#### 3. Rejected document re-upload flow

When a document is rejected:
- The driver is notified (email) with the rejection reason
- Driver can see rejection notes on their document page
- Driver can re-upload the rejected document
- Application stays in `documents_under_review`
- When driver re-uploads, the document goes back to `pending` status
- Admin sees the re-uploaded document in their review queue

Add endpoint:
```
POST /api/driver/documents/:id/reupload — { fileName, fileType, fileSizeBytes }
```

Returns a new upload URL. The old document is kept as history.

### Frontend (Admin Web)

#### 1. `apps/admin-web/src/components/admin/DocumentReviewer.jsx`

Accessed from the ApplicationDetailPanel's "Documents" tab:

**Layout:**
```
┌─────────────────────────────────────────┐
│ Document Review — John Smith             │
│ 5 documents submitted                    │
├─────────────────────────────────────────┤
│ ┌───────────────┐ ┌───────────────────┐ │
│ │               │ │ Selfie Photo      │ │
│ │   [Image]     │ │ Status: Pending   │ │
│ │               │ │ Uploaded: 2d ago  │ │
│ │               │ │                   │ │
│ │               │ │ [Approve] [Reject]│ │
│ └───────────────┘ └───────────────────┘ │
│                                          │
│ ┌───────────────┐ ┌───────────────────┐ │
│ │               │ │ Driving License   │ │
│ │   [Image]     │ │ Status: Approved ✅│ │
│ │               │ │ Reviewed by: admin│ │
│ └───────────────┘ └───────────────────┘ │
│                                          │
│ ... (more documents)                     │
│                                          │
│ ┌───────────────┐ ┌───────────────────┐ │
│ │               │ │ Vehicle Video     │ │
│ │  [▶ Play]     │ │ Duration: 1:45    │ │
│ │               │ │ Status: Pending   │ │
│ │               │ │ [Approve] [Reject]│ │
│ └───────────────┘ └───────────────────┘ │
├─────────────────────────────────────────┤
│ [Approve All Remaining] [Back]           │
└─────────────────────────────────────────┘
```

**Features:**
- Image documents: show full-size image in a lightbox on click
- Video documents: play in a modal player
- PDF documents: show in an iframe or download link
- Reject dialog: requires a note explaining the reason
- "Approve All Remaining" — batch approve all pending documents
- Approved documents are locked (can't change back)
- Rejected documents show the rejection note prominently

#### 2. Document review queue

In the pipeline table, when filtering `documents_under_review`:
- Show how many documents need review per application
- Quick action: "Review Documents" → opens DocumentReviewer directly

#### 3. Image lightbox component

`apps/admin-web/src/components/admin/ImageLightbox.jsx`:
- Full-screen image view
- Zoom in/out
- Navigate between documents (prev/next)
- Download button

### Frontend (Driver Web)

#### 1. Update DocumentUpload page for rejected documents

When any document has `status: 'rejected'`:
- Show rejection notes prominently (red border, reviewer message)
- "Re-upload" button for rejected documents
- Overall status message: "Some documents need to be re-uploaded"
- Re-upload follows the same flow (request URL, upload, confirm)

#### 2. Submit button behavior

"Submit Documents" button at the bottom:
- Disabled until all required documents uploaded
- On click: calls `POST /api/driver/documents/submit`
- On success: redirect to dashboard with toast "Documents submitted for review!"
- On failure (missing docs): highlight which ones are missing

#### 3. Post-submission state

When application is in `documents_under_review`:
- Document page shows all uploads as read-only (no delete/replace unless rejected)
- Status: "Your documents are being reviewed"
- If a document gets rejected: page updates to show rejection + re-upload option

## Acceptance Criteria

- [ ] Driver can submit documents for review (validates all required present)
- [ ] Submission transitions application to `documents_under_review`
- [ ] Admin sees documents with previews (image, video, PDF)
- [ ] Admin can approve individual documents
- [ ] Admin can reject with required notes
- [ ] Rejected documents notify the driver
- [ ] Driver can re-upload rejected documents
- [ ] All documents approved → auto-transition to `payment_details_pending`
- [ ] Image lightbox works for zooming/viewing
- [ ] Video playback works in admin review
- [ ] "Approve All" batch action works
- [ ] Document status changes reflected immediately in UI

## What's Next (Day 5)

Tomorrow we add **document security and optimization** — watermarking, image compression, virus scanning considerations, and document retention policies.
