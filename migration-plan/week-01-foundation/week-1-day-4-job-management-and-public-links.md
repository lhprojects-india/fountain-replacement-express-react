# Week 1 — Day 4: Job Management & Public Links

## Context

We are building a full hiring lifecycle platform. On Days 1-3 we built the database schema, stage transition engine, and city/contract template management (API + admin UI).

**Previous day**: City and contract template CRUD — APIs and admin UI for managing cities with currency, timezone, payment requirements, and contract templates.

**What we're building today**: Job management — admins create jobs linked to a city and contract template, then generate public apply links (slugs) that candidates use to reach the application form.

## Today's Focus

1. Job CRUD API
2. Public link generation API
3. Admin UI for job management (new tab or section)
4. Public job page route (driver-web) — just the landing page skeleton

## Detailed Changes

### Backend

#### 1. `apps/backend/src/modules/jobs/job.schemas.js`

Zod validation:
- `createJobSchema`: cityId (required int), contractTemplateId (optional int), title (required string), description (optional), requirements (optional)
- `updateJobSchema`: all optional
- `publishJobSchema`: no body (action endpoint)
- `createPublicLinkSchema`: expiresAt (optional datetime)

#### 2. `apps/backend/src/modules/jobs/job.service.js`

Functions:
- `createJob(data)` — validate city exists, create with isPublished=false
- `updateJob(id, data)` — update fields
- `getJob(id)` — include city, contractTemplate, publicLinks, _count of applications
- `getAllJobs(filters?)` — list with city name, application counts, optional filter by cityId/isPublished
- `publishJob(id)` — set isPublished=true, publishedAt=now; error if city not active
- `unpublishJob(id)` — set isPublished=false
- `closeJob(id)` — set closedAt=now, deactivate all public links
- `deleteJob(id)` — only if no applications exist; else error
- `createPublicLink(jobId, expiresAt?)` — generate a unique slug (nanoid 10 chars, URL-safe), create JobPublicLink row
- `deactivatePublicLink(linkId)` — set isActive=false
- `getJobByPublicLink(slug)` — look up job via slug, validate active + not expired + job published; increment clickCount
- `getAllPublicLinks(jobId)` — list links for a job

Slug generation: use `nanoid` or `crypto.randomUUID().slice(0,10)` — must be URL-safe.

#### 3. `apps/backend/src/modules/jobs/job.controller.js` + `job.routes.js`

Admin routes (authenticated):
```
GET    /api/jobs                    — list all jobs
GET    /api/jobs/:id                — get job with details
POST   /api/jobs                    — create job
PUT    /api/jobs/:id                — update job
POST   /api/jobs/:id/publish        — publish job
POST   /api/jobs/:id/unpublish      — unpublish job
POST   /api/jobs/:id/close          — close job
DELETE /api/jobs/:id                — delete job (no applications)
POST   /api/jobs/:id/links          — create public link
GET    /api/jobs/:id/links          — list public links
DELETE /api/jobs/links/:linkId      — deactivate link
```

Public routes (no auth):
```
GET    /api/public/jobs/:slug       — get job info by public link slug
```

This public endpoint returns: job title, description, requirements, city info (for the apply form to know currency, timezone, etc.). It does NOT return internal IDs — only the slug is exposed.

#### 4. Mount Routes

```javascript
import jobRoutes from './modules/jobs/job.routes.js';
import publicJobRoutes from './modules/jobs/public-job.routes.js';

app.use('/api/jobs', authenticateToken, authorizeAdmin, jobRoutes);
app.use('/api/public/jobs', publicJobRoutes); // no auth
```

### Frontend (Admin Web)

#### 1. New Tab: "Jobs" in AdminDashboard

Add a "Jobs" tab to the admin dashboard.

#### 2. `apps/admin-web/src/components/admin/JobManager.jsx`

Features:
- **List view**: Table with columns: Title, City, Contract Type, Status (Draft/Published/Closed), Applications count, Created date, Actions
- **Create dialog**: Title, Description (textarea), Requirements (textarea), City (dropdown from cities API), Contract Template (dropdown filtered by selected city)
- **Edit dialog**: Same form
- **Publish/Unpublish toggle**: Button that calls publish/unpublish endpoint
- **Close job**: Confirmation dialog
- **Public links section** (per job):
  - List of active links with their full URL displayed (copy button)
  - "Generate Link" button with optional expiry date
  - Deactivate link action
  - Show click count per link

The full public URL format: `{VITE_DRIVER_APP_URL}/apply/{slug}`

#### 3. `apps/admin-web/src/lib/admin-services.js`

Add job service methods:
```javascript
getAllJobs(filters?)
getJob(id)
createJob(data)
updateJob(id, data)
publishJob(id)
unpublishJob(id)
closeJob(id)
deleteJob(id)
createPublicLink(jobId, data?)
getPublicLinks(jobId)
deactivatePublicLink(linkId)
```

### Frontend (Driver Web) — Skeleton Only

#### 1. New Route: `/apply/:slug`

Add to `apps/driver-web/src/App.jsx`:
```jsx
<Route path="/apply/:slug" element={<JobApplication />} />
```

#### 2. `apps/driver-web/src/pages/JobApplication.jsx` — Skeleton

For today, just a loading state that:
1. Reads `:slug` from URL params
2. Calls `GET /api/public/jobs/:slug`
3. Displays the job title, description, and city info
4. Shows a "Start Application" area (form comes tomorrow)

If the slug is invalid/expired, show a clear error message.

#### 3. `apps/driver-web/src/lib/public-services.js`

New service file for unauthenticated API calls:
```javascript
export const publicServices = {
  getJobBySlug(slug) — GET /api/public/jobs/:slug
};
```

## Acceptance Criteria

- [ ] Job CRUD API working (all endpoints)
- [ ] Public link generation creates unique slugs
- [ ] `GET /api/public/jobs/:slug` returns job info without auth
- [ ] Expired/inactive links return 404
- [ ] Click count increments on public link access
- [ ] Admin UI shows jobs list with create/edit/publish/close
- [ ] Admin UI shows public links with copy URL + generate
- [ ] Driver web `/apply/:slug` route loads and displays job info
- [ ] Invalid slug shows clear error page

## What's Next (Day 5)

Tomorrow we build the **application submission flow** — the form where drivers apply by filling in their details (name, email, phone, vehicle, address), which creates an Application record and enters them into the pipeline.
