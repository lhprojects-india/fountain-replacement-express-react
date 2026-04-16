# Week 6 — Day 5: Document Security & Optimization

## Context

The document collection and review pipeline is functional. Today we add security, optimization, and polish.

**Previous day**: Document submission + admin review — submit flow, approve/reject per document, re-upload, auto-transition.

**What we're building today**: Client-side image compression, document access security, and document management polish.

## Today's Focus

1. Client-side image compression before upload
2. Secure document access (short-lived URLs, access logging)
3. Document retention configuration
4. Admin document dashboard improvements
5. End-to-end document flow testing prep

## Detailed Changes

### Backend

#### 1. Access logging for documents

Add to `document.service.js`:
Every time a download URL is generated, log it:
```javascript
export async function logDocumentAccess(documentId, accessorEmail, action) {
  // Store in a simple audit table or append to CommunicationLog
  // action: 'viewed', 'downloaded'
}
```

This provides an audit trail of who viewed what documents.

#### 2. Document access scoping

Ensure presigned download URLs are scoped correctly:
- **Driver**: can only access their own application's documents
- **Admin**: can access any application's documents (with logging)
- **URLs expire**: set to 15 minutes for admin viewing, 5 minutes for driver

#### 3. Document count endpoint for pipeline

Add a lightweight endpoint for the pipeline view:
```
GET /api/applications/:id/documents/summary
```

Returns:
```javascript
{
  totalRequired: 5,
  uploaded: 4,
  pending: 2,
  approved: 2,
  rejected: 0,
  missing: ['vehicle_video']
}
```

Used by pipeline table/kanban to show document progress without loading full details.

#### 4. Cleanup orphaned uploads

Add a utility function (can be run as a scheduled task):
```javascript
export async function cleanupOrphanedUploads(prisma) {
  // Find DocumentSubmission records with status='uploading' older than 24 hours
  // Delete the S3 objects
  // Delete the DB records
}
```

### Frontend (Driver Web)

#### 1. Client-side image compression

Before uploading images, compress them to reduce upload time and storage:

Create `apps/driver-web/src/lib/image-utils.js`:
```javascript
export async function compressImage(file, { maxWidth = 2048, maxHeight = 2048, quality = 0.85 }) {
  // 1. Create an Image element from the file
  // 2. Draw onto a canvas with max dimensions
  // 3. Export as JPEG with quality setting
  // 4. Return new Blob
  // Preserve EXIF orientation
}
```

Integrate into `DocumentUploadCard`:
- Before requesting upload URL, compress the image
- Show original size → compressed size ("5.2MB → 1.1MB")
- Skip compression for PDFs and videos

#### 2. HEIC/HEIF conversion

iPhones capture in HEIC format. Add conversion:
```javascript
// Use heic2any library or canvas-based conversion
import heic2any from 'heic2any';

export async function convertHeicToJpeg(file) {
  if (file.type === 'image/heic' || file.name.endsWith('.heic')) {
    const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
    return new File([blob], file.name.replace('.heic', '.jpg'), { type: 'image/jpeg' });
  }
  return file;
}
```

Install `heic2any` in driver-web deps.

#### 3. Upload retry on failure

If the S3 upload fails:
- Show error: "Upload failed. Check your connection."
- "Retry" button that re-attempts the upload (same presigned URL if not expired, new URL if expired)
- Max 3 retries

#### 4. Offline-resilient uploads

Show a connection indicator. If offline during upload:
- Pause and show "Waiting for connection..."
- Resume when back online (if presigned URL hasn't expired)

### Frontend (Admin Web)

#### 1. Document progress in pipeline table

Add a "Docs" column to the application table:
- Shows: "3/5 ✅" or "2 pending" or "1 rejected"
- Color-coded: green if all approved, yellow if pending review, red if any rejected
- Only visible when application is in documents_pending/documents_under_review/later stages

#### 2. Document review queue view

Add a quick filter preset: "Needs Document Review":
- Filters to `documents_under_review` stage
- Sorts by oldest first (FIFO review)
- Shows document summary in the table

#### 3. Admin document notes

When reviewing documents, notes are required for rejection but optional for approval. Ensure the UI makes this clear:
- Rejection: note textarea is required (red border if empty)
- Approval: note textarea is optional (collapsed by default)

## Acceptance Criteria

- [ ] Image compression reduces file size before upload
- [ ] HEIC images converted to JPEG
- [ ] Compressed size shown to user
- [ ] Upload retry works on failure
- [ ] Document access logged with accessor email
- [ ] Presigned URLs expire appropriately (15min admin, 5min driver)
- [ ] Document summary endpoint returns correct counts
- [ ] Pipeline table shows document progress column
- [ ] Orphaned upload cleanup function works
- [ ] Admin document review queue filter works
- [ ] Connection-aware upload behavior

## What's Next (Week 7, Day 1)

Week 7 starts with **document verification polish and payment details collection**. Day 1 focuses on the admin verification workflow improvements and auto-transition when all documents pass.
