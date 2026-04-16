# Week 6 — Day 2: Document Upload UI

## Context

Yesterday we built the file storage infrastructure — S3 signed URLs, document submission API, metadata storage. Today we build the driver-facing upload experience.

**Previous day**: Upload infrastructure — S3/R2 setup, presigned URLs, document submission CRUD, file validation.

**What we're building today**: The driver document upload pages — a list of required documents with upload capabilities for images/PDFs.

## Today's Focus

1. Document upload page (driver-web)
2. Individual document upload component
3. Image preview + re-upload
4. Upload progress tracking
5. Document completeness indicator

## Detailed Changes

### Backend

No backend changes — using yesterday's APIs.

### Frontend (Driver Web)

#### 1. New route: `/documents`

Add to routing:
```jsx
<Route path="/documents" element={<ProtectedRoute><DocumentsGuard><DocumentUpload /></DocumentsGuard></ProtectedRoute>} />
```

#### 2. `apps/driver-web/src/components/DocumentsGuard.jsx`

Guard that:
- Checks application is in `documents_pending` stage
- If not: redirects to dashboard
- If yes: renders children

#### 3. `apps/driver-web/src/pages/DocumentUpload.jsx`

Main document upload page:

**Layout:**
```
┌─────────────────────────────────────────┐
│ Upload Your Documents                    │
│ Please upload the following documents    │
│ to proceed with your application.        │
├─────────────────────────────────────────┤
│ Overall Progress: 3/5 documents          │
│ ████████████░░░░░░░░  60%               │
├─────────────────────────────────────────┤
│                                          │
│ ┌─ Selfie Photo ─────── Required ──────┐│
│ │ [Upload] or drag & drop               ││
│ │ JPEG, PNG • Max 5MB                   ││
│ └───────────────────────────────────────┘│
│                                          │
│ ┌─ Driving License ──── Required ──────┐│
│ │ [📷 photo.jpg] ✅ Uploaded            ││
│ │ [Replace] [Delete]                    ││
│ └───────────────────────────────────────┘│
│                                          │
│ ┌─ Vehicle Photo ────── Required ──────┐│
│ │ [Upload] or drag & drop               ││
│ │ JPEG, PNG • Max 10MB                  ││
│ └───────────────────────────────────────┘│
│                                          │
│ ┌─ ID Document ──────── Required ──────┐│
│ │ [Upload] or drag & drop               ││
│ │ JPEG, PNG, PDF • Max 10MB             ││
│ └───────────────────────────────────────┘│
│                                          │
│ ┌─ Vehicle Video ────── Required ──────┐│
│ │ [Record Video] (in-app camera)        ││
│ │ Max 2 minutes                         ││
│ └───────────────────────────────────────┘│
│                                          │
├─────────────────────────────────────────┤
│ [Submit Documents]                       │
│ (enabled when all required docs uploaded)│
└─────────────────────────────────────────┘
```

**Data flow:**
1. On mount: `GET /api/driver/documents` — loads existing submissions
2. Also load document requirements from application's city
3. Cross-reference: which requirements are fulfilled

#### 4. `apps/driver-web/src/components/DocumentUploadCard.jsx`

Reusable card component per document requirement:

**Props:**
- `requirement` — { code, name, fileTypes, isRequired, maxSizeMb, maxDurationSec }
- `submission` — existing upload if any
- `onUploadComplete` — callback
- `onDelete` — callback

**States:**
- **Empty**: Shows drop zone + upload button + file type/size hints
- **Uploading**: Progress bar (0-100%), file name, cancel button
- **Uploaded**: Thumbnail preview (for images), file name, status badge, replace/delete buttons
- **Approved**: Green badge, preview, no delete (locked)
- **Rejected**: Red badge, reviewer notes, replace button

**Upload flow:**
1. User selects file (click or drag-drop) or takes photo (camera capture for mobile)
2. Client-side validation: file type, file size
3. Call `POST /api/driver/documents/upload-url` to get presigned URL
4. Upload directly to S3 using `PUT` on presigned URL
   - Track upload progress via XMLHttpRequest or fetch with ReadableStream
5. On success: call `POST /api/driver/documents/confirm`
6. Refresh submission status

**Image preview:**
- For images: show thumbnail (use `URL.createObjectURL` or presigned download URL)
- For PDFs: show PDF icon with filename
- For video: show video thumbnail or placeholder (video playback comes Day 3)

#### 5. `apps/driver-web/src/components/FileDropZone.jsx`

Reusable drag-and-drop zone:
- Drag overlay with "Drop file here" message
- Click to open file picker
- Accepts `accept` prop for file type filtering
- Mobile-friendly with camera capture option for images:
  ```html
  <input type="file" accept="image/*" capture="environment" />
  ```

#### 6. Upload progress handling

Use `XMLHttpRequest` for S3 presigned URL uploads (fetch doesn't support upload progress):
```javascript
function uploadToS3(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => onProgress(Math.round(e.loaded / e.total * 100));
    xhr.onload = () => resolve();
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}
```

#### 7. Add to driver dashboard action panel

When in `documents_pending`:
- "Upload Documents" button → navigates to `/documents`
- Show progress: "2 of 5 documents uploaded"

## Acceptance Criteria

- [ ] Document upload page loads with correct requirements for city
- [ ] File drag-and-drop works
- [ ] File click-to-select works
- [ ] Camera capture works on mobile
- [ ] Client-side file type validation
- [ ] Client-side file size validation
- [ ] Upload progress bar displays correctly
- [ ] Successful upload shows preview
- [ ] Image thumbnails display
- [ ] PDF shows file icon
- [ ] Replace and delete actions work
- [ ] Overall progress bar updates correctly
- [ ] Submit button only enabled when all required docs uploaded
- [ ] Dashboard shows document progress

## What's Next (Day 3)

Tomorrow we build the **in-app video recording** — a camera component for recording the vehicle video directly in the browser, with duration limits and preview.
