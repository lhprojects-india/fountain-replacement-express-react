# Deployment Runbook

## Purpose

This runbook defines the production deployment flow for the onboarding monorepo.

## Prerequisites

- Render services exist for:
  - `lh-onboarding-backend`
  - `lh-driver-web`
  - `lh-admin-web`
- Production environment variables are configured in Render.
- Database backups are enabled for production.
- Migrations have been reviewed before deployment.

## Required Environment Variables

Reference `.env.example` for the full inventory. At minimum, production must include:

- Core: `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`
- Auth: `FIREBASE_SERVICE_ACCOUNT_JSON`
- Email/SMS: `RESEND_API_KEY`, `FROM_EMAIL`, `TWILIO_*`
- Contracts: `DROPBOX_SIGN_*`
- Storage: `S3_*`
- URLs: `API_BASE_URL`, `DRIVER_WEB_URL`, `ADMIN_WEB_URL`
- Frontend: `VITE_API_URL` and admin Firebase `VITE_FIREBASE_*`

## Pre-Deployment Checklist

1. Confirm branch is merged and CI checks pass.
2. Confirm schema changes have an accompanying Prisma migration.
3. Review migration SQL for destructive operations.
4. Validate Render `render.yaml` is up to date.
5. Ensure webhook endpoints point to production backend domain.

## Deployment Steps

### 1) Run database migrations

Run once per release before backend rollout:

```bash
npm run migrate
```

This executes:

```bash
npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma
```

### 2) Deploy backend

Render backend service should build and start with:

- Build: `npm ci && npx prisma generate --schema=apps/backend/prisma/schema.prisma`
- Start: `npm run start -w backend`

Backend start script:

```bash
npx prisma generate && node src/index.js
```

### 3) Deploy frontend apps

Render static services should build and publish:

- Driver web: `npm ci && npm run build -w driver-web`
- Admin web: `npm ci && npm run build -w admin-web`

Both apps should rewrite `/*` to `/index.html`.

## Post-Deployment Validation

1. Check backend health endpoint:
   - `GET /health` returns `healthy` and dependency checks are `ok`.
2. Verify admin login and driver login flows.
3. Verify core workflows:
   - application submission
   - stage transitions
   - document upload URL generation
4. Verify outbound integrations:
   - Resend email delivery
   - Twilio webhook updates
   - Dropbox Sign webhook handling
5. Check logs for unhandled errors and elevated 5xx rates.

## Rollback Strategy

- Application rollback:
  - Roll back to previous stable Render deploy.
- Database rollback:
  - Prefer forward fixes.
  - Avoid destructive schema changes during transition windows.
  - Drop deprecated columns only after code references are fully removed.

## Operational Notes

- Keep migration execution separate from runtime startup.
- Use `LOG_LEVEL=info` in production unless actively debugging.
- Keep CORS URLs aligned with deployed frontend domains.
