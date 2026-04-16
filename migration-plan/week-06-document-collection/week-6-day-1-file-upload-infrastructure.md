# Week 6 — Day 1: File Upload Infrastructure

## Context

Weeks 1-5 built the platform, pipeline, screening, communications, and contracts. When a driver signs their contract, they move to `documents_pending` where they must upload required documents. Today we build the storage layer.

**Previous day (Week 5, Day 5)**: Communication delivery tracking — Resend/Twilio webhooks, delivery status, communication analytics.

**What we're building today**: S3-compatible file storage setup, signed URL generation for direct client uploads, and the document upload API.

## Today's Focus

1. S3/R2 storage setup
2. Signed URL generation for uploads
3. Document submission API
4. File metadata storage
5. Secure file access (signed download URLs)

## Detailed Changes

### Backend

#### 1. Storage setup

Use AWS S3 or Cloudflare R2 (S3-compatible, cheaper). Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.

Environment variables:
```
S3_BUCKET=lh-driver-documents
S3_REGION=auto
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com  # for R2
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

#### 2. `apps/backend/src/modules/documents/storage.service.js`

```javascript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ ... });

export async function generateUploadUrl(key, contentType, maxSizeBytes) {
  // Generate a presigned PUT URL (expires in 15 minutes)
  // Key format: applications/{applicationId}/{requirementCode}/{timestamp}_{filename}
  // Returns: { uploadUrl, key, expiresAt }
}

export async function generateDownloadUrl(key) {
  // Generate a presigned GET URL (expires in 1 hour)
  // Returns: { downloadUrl, expiresAt }
}

export async function deleteFile(key) {
  // Delete a file from storage
}
```

#### 3. `apps/backend/src/modules/documents/document.service.js`

Functions:

```javascript
export async function requestUploadUrl(applicationId, requirementCode, fileName, fileType, fileSizeBytes) {
  // 1. Validate application exists and is in documents_pending stage
  // 2. Validate requirementCode matches a DocumentRequirement for the application's city
  // 3. Validate fileType is allowed for this requirement
  // 4. Validate fileSizeBytes doesn't exceed maxSizeMb
  // 5. Generate S3 key
  // 6. Generate presigned upload URL
  // 7. Create DocumentSubmission record with status='uploading'
  // 8. Return { uploadUrl, documentId, key }
}

export async function confirmUpload(documentId, applicationId) {
  // Called after client confirms successful upload
  // 1. Update DocumentSubmission status → 'pending'
  // 2. Return updated submission
}

export async function getDocumentsByApplication(applicationId) {
  // Return all document submissions grouped by requirement code
  // Include: requirement details (name, isRequired), submission status
}

export async function getDocumentDownloadUrl(documentId, requestorEmail) {
  // 1. Validate access (driver owns the application, or admin)
  // 2. Generate presigned download URL
  // 3. Return { downloadUrl }
}

export async function deleteDocument(documentId, applicationId) {
  // 1. Delete from S3
  // 2. Delete DocumentSubmission record
  // 3. Return success
}

export async function checkDocumentCompleteness(applicationId) {
  // Compare submitted + approved docs against required docs for the city
  // Return: { complete, totalRequired, submitted, approved, missing: [...] }
}
```

#### 4. `apps/backend/src/modules/documents/document.routes.js`

Driver routes (authenticated):
```
POST   /api/driver/documents/upload-url    — { requirementCode, fileName, fileType, fileSizeBytes }
POST   /api/driver/documents/confirm       — { documentId }
GET    /api/driver/documents               — list own documents
DELETE /api/driver/documents/:id           — delete own upload (only if not yet reviewed)
GET    /api/driver/documents/:id/download  — get download URL
```

Admin routes:
```
GET    /api/applications/:id/documents          — list documents for application
GET    /api/applications/:id/documents/:docId/download — get download URL
```

#### 5. Mount routes

```javascript
import documentRoutes from './modules/documents/document.routes.js';
app.use('/api/driver/documents', authenticateToken, documentRoutes.driverRoutes);
app.use('/api/applications', authenticateToken, authorizeAdmin, documentRoutes.adminRoutes);
```

### Frontend — None today

Storage is pure backend infrastructure. The upload UI comes tomorrow.

## Acceptance Criteria

- [ ] S3/R2 client connects and authenticates
- [ ] Presigned upload URLs generated with correct content type + expiry
- [ ] Presigned download URLs generated with expiry
- [ ] DocumentSubmission records created with correct metadata
- [ ] Upload confirm updates status from 'uploading' to 'pending'
- [ ] File type validation against DocumentRequirement
- [ ] File size validation against maxSizeMb
- [ ] Stage validation (only documents_pending allows uploads)
- [ ] Delete removes both S3 object and DB record
- [ ] Completeness check correctly identifies missing documents

## What's Next (Day 2)

Tomorrow we build the **document upload UI** — the driver-facing pages where they upload selfie, driving license, vehicle photo, ID, and other required documents.
