# API Documentation

Base URL: `/api` (example local: `http://localhost:5001/api`)

All responses are JSON. Authenticated endpoints require `Authorization: Bearer <jwt>`.

## Response Shape

Typical success response:

```json
{ "success": true, "data": {} }
```

Typical error response:

```json
{ "success": false, "message": "Error message", "code": "ERROR_CODE", "errors": [] }
```

## Public Endpoints

### Jobs

- `GET /public/jobs/:slug`
  - Auth: none
  - Purpose: fetch publicly visible job by slug

### Applications

- `POST /public/applications`
  - Auth: none
  - Purpose: submit driver application
  - Body: application payload (validated server-side)

## Driver Auth Endpoints

- `POST /auth/driver/request-code`
  - Auth: none
  - Body: `{ "email": "driver@example.com" }`
  - Errors: `400`, `404`, `429`

- `POST /auth/driver/verify-code`
  - Auth: none
  - Body: `{ "email": "driver@example.com", "code": "123456" }`
  - Returns: JWT + application summary
  - Errors: `400`, `404`

- `GET /auth/driver/session`
  - Auth: driver JWT
  - Returns: current driver application session

## Driver Endpoints

### Driver Profile/Progress (`/drivers`)

- `GET /drivers/me`
- `PUT /drivers/personal-details`
- `POST /drivers/availability`
- `POST /drivers/verification`
- `POST /drivers/progress`
- `POST /drivers/acknowledge/:policy`
- `POST /drivers/complete-onboarding`
- `GET /drivers/facilities`

### Driver Application (`/driver`)

- `GET /driver/application`
- `GET /driver/application/timeline`
- `GET /driver/application/stage-info`
- `GET /driver/application/screening`
- `POST /driver/application/screening/complete`
- `PUT /driver/application/profile`
- `POST /driver/application/withdraw`
- `GET /driver/application/fee-structure`
- `GET /driver/application/region-config`
- `POST /driver/application/contract/resend`

### Driver Documents (`/driver/documents`)

- `POST /driver/documents/upload-url`
- `POST /driver/documents/confirm`
- `POST /driver/documents/submit`
- `GET /driver/documents`
- `DELETE /driver/documents/:id`
- `POST /driver/documents/:id/reupload`
- `GET /driver/documents/:id/download`

### Driver Payments (`/driver/payment`)

- `GET /driver/payment/schema`
- `GET /driver/payment`
- `POST /driver/payment`

### Driver Questionnaire (`/driver/questionnaire`)

- `GET /driver/questionnaire`
- `POST /driver/questionnaire/submit`
- `GET /driver/questionnaire/result`

## Admin Endpoints

### Admin Core (`/admin`)

- `GET /admin/me`
- `GET /admin/dashboard`
- `PUT /admin/update-status`
- `DELETE /admin/application/:email`
- `GET /admin/admins`
- `POST /admin/set-admin`
- `GET /admin/fee-structures`
- `PUT /admin/fee-structures`
- `DELETE /admin/fee-structures/:city`
- `GET /admin/facilities`
- `POST /admin/contract/poll-status`

### Pipeline and Lifecycle (`/applications`, `/workflow`)

- `GET /applications`
- `GET /applications/by-stage`
- `GET /applications/stats`
- `GET /applications/activity`
- `GET /applications/search`
- `GET /applications/export`
- `GET /applications/:id`
- `GET /applications/:id/notes`
- `POST /applications/:id/notes`
- `PUT /applications/:id/notes`
- `POST /applications/:id/approve`
- `POST /applications/:id/reject`
- `GET /applications/:id/decision-summary`
- `POST /applications/:id/call/schedule`
- `POST /applications/:id/call/complete`
- `POST /applications/:id/call/reschedule`
- `POST /applications/:id/call/no-show`
- `GET /applications/call-queue`
- `POST /applications/:id/first-block/assign`
- `POST /applications/:id/first-block/result`
- `POST /applications/:id/first-block/reschedule`
- `GET /applications/block-queue`
- `POST /applications/:id/contract/send`
- `POST /applications/:id/contract/cancel`
- `POST /applications/:id/contract/resend`
- `POST /applications/:id/contract/mark-signed`
- `GET /applications/:id/contract/status`

Workflow transition endpoints:

- `POST /workflow/applications/:id/transition`
- `POST /workflow/applications/bulk-transition`
- `GET /workflow/applications/:id/history`
- `GET /workflow/applications/:id/available-transitions`
- `POST /workflow/applications/:id/reopen`

### Regions (`/regions`)

- `GET /regions`
- `GET /regions/:id`
- `POST /regions`
- `PUT /regions/:id`
- `DELETE /regions/:id`

### Jobs and Links (`/jobs`, `/public/jobs`)

- `GET /jobs`
- `POST /jobs`
- `GET /jobs/:id`
- `PUT /jobs/:id`
- `DELETE /jobs/:id`
- `POST /jobs/:id/publish`
- `POST /jobs/:id/unpublish`
- `POST /jobs/:id/close`
- `GET /jobs/:id/links`
- `POST /jobs/:id/links`
- `DELETE /jobs/links/:linkId`

### Contracts (`/contract-templates`)

- `GET /contract-templates`
- `GET /contract-templates/region/:regionId`
- `GET /contract-templates/:id`
- `POST /contract-templates`
- `PUT /contract-templates/:id`
- `DELETE /contract-templates/:id`

### Documents (Admin under `/applications/:id/documents`)

- `GET /applications/:id/documents`
- `GET /applications/:id/documents/summary`
- `GET /applications/:id/documents/:docId/download`
- `GET /applications/:id/documents/:docId/context`
- `PUT /applications/:id/documents/:docId/review`
- `POST /applications/:id/documents/review-all`

Document requirement management (`/document-requirements`):

- `GET /document-requirements/region/:regionId`
- `POST /document-requirements/seed/:regionId`
- `POST /document-requirements`
- `PUT /document-requirements/:id`
- `DELETE /document-requirements/:id`

### Analytics (`/analytics`)

- `GET /analytics/funnel`
- `GET /analytics/stage-duration`
- `GET /analytics/volume`
- `GET /analytics/regions`
- `GET /analytics/jobs`

### Communications (`/communications`)

- `GET /communications/templates`
- `GET /communications/templates/:id`
- `POST /communications/templates`
- `PUT /communications/templates/:id`
- `DELETE /communications/templates/:id`
- `POST /communications/templates/:id/preview`
- `POST /communications/templates/:id/test-send`
- `GET /communications/notifications/matrix`
- `GET /communications/stats`
- `GET /communications/logs/:applicationId`
- `POST /communications/logs/:logId/retry`

## Webhooks

- `GET /webhooks/dropbox-sign`
  - Purpose: Dropbox Sign challenge verification
- `POST /webhooks/dropbox-sign`
  - Purpose: contract signature events
- `POST /webhooks/resend`
  - Purpose: email delivery/status events
- `POST /webhooks/twilio`
  - Purpose: SMS delivery/status events

## Health

- `GET /health`
  - Includes app status, dependency checks, uptime, timestamp
