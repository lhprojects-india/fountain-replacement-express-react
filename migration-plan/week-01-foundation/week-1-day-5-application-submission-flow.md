# Week 1 — Day 5: Application Submission Flow

## Context

We are building a full hiring lifecycle platform. This week we've built the database schema (Day 1), stage engine (Day 2), city/contract management (Day 3), and job management with public links (Day 4).

**Previous day**: Job management — CRUD API, public link generation, admin jobs UI, and the driver-web skeleton for `/apply/:slug`.

**What we're building today**: The full driver application form. When a driver clicks a public job link, they see job details and fill out an application form. Submitting creates an `Application` record at the `applied` stage and auto-transitions to `pending_review`.

## Today's Focus

1. Application submission API (public, no auth)
2. Complete the driver-web apply form
3. Application list API for admin (basic)
4. Duplicate detection (same email + job)
5. Auto-transition `applied → pending_review`

## Detailed Changes

### Backend

#### 1. `apps/backend/src/modules/applications/application.schemas.js`

Zod validation for the public apply form:
```javascript
createApplicationSchema:
  - jobSlug (required string) — resolved to jobId server-side
  - firstName (required, min 2)
  - lastName (required, min 2)
  - email (required, valid email, lowercased + trimmed)
  - phone (required, min 8 — E.164 format preferred)
  - vehicleType (optional, enum: "car", "van", "bicycle", "motorcycle")
  - vehicleDetails (optional string — make/model/year)
  - addressLine1 (optional)
  - addressLine2 (optional)
  - city (optional)
  - postcode (optional)
  - country (optional)
  - source (optional, default "job_portal")
```

#### 2. `apps/backend/src/modules/applications/application.service.js`

Functions:
- `submitApplication(data)`:
  1. Resolve jobSlug → job (via JobPublicLink), validate job is published
  2. Check for existing application with same email + jobId (return error if duplicate)
  3. Create Application record with `currentStage: 'applied'`
  4. Insert initial `ApplicationStageHistory` record (null → applied)
  5. Auto-transition to `pending_review` via the stage engine
  6. Return the created application (with ID for confirmation)

- `getApplication(id)` — full application with relations (stageHistory, tasks, documents)
- `getApplicationsByJob(jobId, filters?)` — list for a job
- `getAllApplications(filters?)` — paginated, filterable by stage, city, job, search (name/email)
- `getApplicationByEmail(email)` — find by email across all jobs
- `getApplicationStats()` — counts by stage, by city

#### 3. `apps/backend/src/modules/applications/application.controller.js`

Public endpoint (no auth):
```
POST /api/public/applications — submit application
```

Admin endpoints (authenticated):
```
GET  /api/applications              — list all (paginated, filtered)
GET  /api/applications/:id          — get single with full details
GET  /api/applications/stats        — aggregate counts
```

#### 4. `apps/backend/src/modules/applications/public-application.routes.js`

```javascript
router.post('/', submitApplicationHandler);
```

#### 5. `apps/backend/src/modules/applications/application.routes.js`

```javascript
router.get('/', getAllApplicationsHandler);
router.get('/stats', getApplicationStatsHandler);
router.get('/:id', getApplicationHandler);
```

#### 6. Mount in `index.js`

```javascript
import publicApplicationRoutes from './modules/applications/public-application.routes.js';
import applicationRoutes from './modules/applications/application.routes.js';

app.use('/api/public/applications', publicApplicationRoutes);
app.use('/api/applications', authenticateToken, authorizeAdmin, applicationRoutes);
```

### Frontend (Driver Web)

#### 1. Complete `apps/driver-web/src/pages/JobApplication.jsx`

Full apply form with these sections:

**Job info header** (from slug lookup):
- Job title, company description, city

**Application form** (React Hook Form + Zod):
- First Name (required)
- Last Name (required)
- Email (required, email validation)
- Phone (required, with country code selector — `react-phone-number-input` already in deps)
- Vehicle Type (select: Car, Van, Bicycle, Motorcycle)
- Vehicle Details (optional text — make/model/year)
- Address Line 1
- Address Line 2
- City
- Postcode
- Country (pre-filled from job city if possible)

**Submit button** → calls `POST /api/public/applications`

**Success state**:
After successful submission, show a confirmation page:
- "Application submitted successfully!"
- "You will receive an email with next steps."
- Application reference (the application ID or a generated ref)
- Summary of what happens next

**Error handling**:
- Duplicate application: "You have already applied for this position with this email."
- Invalid/closed job: "This position is no longer accepting applications."
- Validation errors: inline field errors

#### 2. `apps/driver-web/src/lib/public-services.js`

Add:
```javascript
submitApplication(data) — POST /api/public/applications
```

#### 3. Styling

Use existing Tailwind + shared UI components (Card, Input, Button, Select). Make the form clean and mobile-friendly — this is the first impression for drivers.

### Frontend (Admin Web) — Minimal

#### 1. Update admin-services.js

Add:
```javascript
getAllApplications(filters?) — GET /api/applications
getApplication(id) — GET /api/applications/:id
getApplicationStats() — GET /api/applications/stats
```

No new admin UI today — the full pipeline view comes in Week 3. But verify the API returns data correctly for future use.

## Acceptance Criteria

- [ ] `POST /api/public/applications` creates application + auto-transitions to pending_review
- [ ] Duplicate email+job returns 409 Conflict
- [ ] Closed/unpublished jobs return 400
- [ ] ApplicationStageHistory has two entries: null→applied, applied→pending_review
- [ ] Driver web form validates all required fields
- [ ] Phone input uses country code selector
- [ ] Form submission shows success/error states
- [ ] `GET /api/applications` returns paginated list
- [ ] `GET /api/applications/stats` returns counts by stage
- [ ] Mobile-responsive apply form

## What's Next (Week 2, Day 1)

Next week starts with building the **driver authentication flow for the new system** — after submitting an application, drivers need to be able to log back in to check status and complete later stages (screening, document upload, etc.). We'll replace the Fountain-based auth with application-based auth.
