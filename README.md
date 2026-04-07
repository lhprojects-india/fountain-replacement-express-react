# Laundryheap Driver Onboarding Monorepo

Monorepo for Laundryheap driver onboarding:

- `apps/backend`: Express API with Prisma + Postgres
- `apps/driver-web`: Driver onboarding frontend (React + Vite)
- `apps/admin-web`: Admin dashboard frontend (React + Vite)
- `packages/shared`: Shared API client/utilities/components

## Architecture

1. Fountain sends applicant data to the backend webhook.
2. Drivers log in with email + phone verification (no OTP flow).
3. Driver onboarding data is saved via API endpoints.
4. Admin app reviews and manages onboarding data.

## Repository Structure

```text
.
├── apps/
│   ├── backend/
│   ├── driver-web/
│   └── admin-web/
├── packages/
│   └── shared/
├── render.yaml
└── package.json
```

## Tech Stack

- **Backend**: Node.js, Express, Prisma, PostgreSQL, JWT, Firebase Admin SDK
- **Frontend**: React, Vite, Tailwind CSS
- **Deployment**: Render (backend + two static apps)

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database URL
- Firebase service account credentials (for admin auth verification)

## Environment Variables

The backend loads environment variables from the root `.env` file.

Create `.env` in the repository root:

```env
# Backend
PORT=5001
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=replace-with-strong-secret

# Option A: inline JSON (recommended for hosted envs)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Option B: local file path relative to repo root
# FIREBASE_SERVICE_ACCOUNT_PATH=driver-onboarding-lh-firebase-adminsdk-fbsvc-51cf561c46.json

# Frontend API base URL (used by driver/admin web apps)
VITE_API_URL=http://localhost:5001/api

# Firebase web app config (admin auth only)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

Notes:
- `apps/backend/src/index.js` explicitly loads `../../../.env` (repo root).
- `VITE_*` Firebase vars are only needed by `admin-web` for Google sign-in.

## Install

```bash
npm install
```

## Run Locally

Start each app in separate terminals:

```bash
# Backend API
npm run dev:backend

# Driver app
npm run dev:driver

# Admin app
npm run dev:admin
```

Equivalent workspace commands:

```bash
npm run dev -w backend
npm run dev -w driver-web
npm run dev -w admin-web
```

## Build

Build all workspaces:

```bash
npm run build
```

Build individual apps:

```bash
npm run build -w driver-web
npm run build -w admin-web
```

## API Overview

Base URL (local): `http://localhost:5001/api`

### Auth

- `POST /auth/check-email`
- `POST /auth/verify-phone`
- `POST /auth/admin-login`
- `POST /auth/admin-google-login`

### Driver (JWT required)

- `GET /drivers/me`
- `PUT /drivers/personal-details`
- `POST /drivers/availability`
- `POST /drivers/verification`
- `POST /drivers/progress`
- `POST /drivers/acknowledge/:policy`
- `POST /drivers/complete-onboarding`
- `GET /drivers/facilities`

### Admin (JWT + admin role required)

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

### Webhooks

- `POST /webhooks/fountain`

## Healthcheck

- `GET /health`

## Quick Webhook Test

```bash
curl -sS -X POST "http://localhost:5001/api/webhooks/fountain" \
curl -sS -X POST "https://lh-onboarding-backend.onrender.com/api/webhooks/fountain"
  -H "Content-Type: application/json" \
  -d '{"email":"driver@test.com","phone":"+353123456789","name":"Jane Smith"}'
```

## Deployment (Render)

`render.yaml` defines three services:

1. `lh-onboarding-backend` (Node web service)
2. `lh-driver-web` (static site)
3. `lh-admin-web` (static site)

Production backend health endpoint: `/health`.

## Common Scripts (root)

- `npm run dev:backend`
- `npm run dev:driver`
- `npm run dev:admin`
- `npm run build`
- `npm run lint`

## License

Proprietary - Laundryheap
