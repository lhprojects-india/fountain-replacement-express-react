# Week 9 — Day 4: Deployment Configuration

## Context

The system is secure, performant, and observable. Today we prepare for production deployment.

**Previous day**: Error handling & observability — structured logging, global error handling, health checks, error boundaries.

**What we're building today**: Deployment configuration — render.yaml updates, environment variables, database migration strategy, and build optimization.

## Today's Focus

1. Update render.yaml for new services
2. Environment variable inventory
3. Database migration strategy
4. Build configuration
5. Deployment checklist

## Detailed Changes

### Infrastructure

#### 1. Update `render.yaml`

```yaml
services:
  - type: web
    name: lh-onboarding-backend
    env: node
    plan: starter  # upgraded from free for production
    rootDir: .
    buildCommand: npm ci && npx prisma generate --schema=apps/backend/prisma/schema.prisma
    startCommand: npm run start -w backend
    healthCheckPath: /health
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: FIREBASE_SERVICE_ACCOUNT_JSON
        sync: false
      - key: RESEND_API_KEY
        sync: false
      - key: TWILIO_ACCOUNT_SID
        sync: false
      - key: TWILIO_AUTH_TOKEN
        sync: false
      - key: TWILIO_PHONE_NUMBER
        sync: false
      - key: DROPBOX_SIGN_API_KEY
        sync: false
      - key: DROPBOX_SIGN_CLIENT_ID
        sync: false
      - key: DROPBOX_SIGN_WEBHOOK_SECRET
        sync: false
      - key: S3_BUCKET
        sync: false
      - key: S3_REGION
        sync: false
      - key: S3_ENDPOINT
        sync: false
      - key: S3_ACCESS_KEY_ID
        sync: false
      - key: S3_SECRET_ACCESS_KEY
        sync: false
      - key: FROM_EMAIL
        value: noreply@laundryheap.com
      - key: API_BASE_URL
        value: https://lh-onboarding-backend.onrender.com
      - key: DRIVER_WEB_URL
        value: https://lh-driver-web.onrender.com
      - key: ADMIN_WEB_URL
        value: https://lh-admin-web.onrender.com
      - key: LOG_LEVEL
        value: info

  - type: web
    name: lh-driver-web
    runtime: static
    rootDir: .
    buildCommand: npm ci && npm run build -w driver-web
    staticPublishPath: apps/driver-web/dist
    pullRequestPreviewsEnabled: true
    envVars:
      - key: VITE_API_URL
        value: https://lh-onboarding-backend.onrender.com/api
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

  - type: web
    name: lh-admin-web
    runtime: static
    rootDir: .
    buildCommand: npm ci && npm run build -w admin-web
    staticPublishPath: apps/admin-web/dist
    pullRequestPreviewsEnabled: true
    envVars:
      - key: VITE_API_URL
        value: https://lh-onboarding-backend.onrender.com/api
      - key: VITE_FIREBASE_API_KEY
        sync: false
      - key: VITE_FIREBASE_AUTH_DOMAIN
        sync: false
      - key: VITE_FIREBASE_PROJECT_ID
        sync: false
      - key: VITE_FIREBASE_APP_ID
        sync: false
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

#### 2. Environment variable inventory

Create a `.env.example` file documenting all required variables:

```env
# ── Core ──
NODE_ENV=development
PORT=5001
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=replace-with-strong-secret

# ── Firebase (admin auth) ──
FIREBASE_SERVICE_ACCOUNT_JSON={}

# ── Email (Resend) ──
RESEND_API_KEY=re_xxxx
FROM_EMAIL=noreply@laundryheap.com

# ── SMS (Twilio) ──
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# ── Contract Signing (Dropbox Sign) ──
DROPBOX_SIGN_API_KEY=xxxx
DROPBOX_SIGN_CLIENT_ID=xxxx
DROPBOX_SIGN_WEBHOOK_SECRET=xxxx

# ── File Storage (S3/R2) ──
S3_BUCKET=lh-driver-documents
S3_REGION=auto
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=xxxx
S3_SECRET_ACCESS_KEY=xxxx

# ── URLs ──
API_BASE_URL=http://localhost:5001
DRIVER_WEB_URL=http://localhost:3000
ADMIN_WEB_URL=http://localhost:3001

# ── Frontend (Vite) ──
VITE_API_URL=http://localhost:5001/api
VITE_FIREBASE_API_KEY=xxxx
VITE_FIREBASE_AUTH_DOMAIN=xxxx
VITE_FIREBASE_PROJECT_ID=xxxx
VITE_FIREBASE_APP_ID=xxxx
```

#### 3. Database migration strategy

For production deployment:
1. Generate migration from current schema: `npx prisma migrate dev --name full_hiring_lifecycle`
2. Review the generated SQL
3. In production: `npx prisma migrate deploy` (non-interactive)
4. Update backend start command: `npx prisma migrate deploy && npx prisma generate && node src/index.js`

Rollback strategy:
- Keep track of migrations
- For schema changes, always add (never remove) columns during transition
- Drop deprecated columns only after confirmed no code references them

#### 4. Build scripts update

Update root `package.json`:
```json
{
  "scripts": {
    "dev:backend": "npm run dev -w backend",
    "dev:driver": "npm run dev -w driver-web",
    "dev:admin": "npm run dev -w admin-web",
    "build": "npm run build --workspaces",
    "build:backend": "npx prisma generate --schema=apps/backend/prisma/schema.prisma",
    "build:driver": "npm run build -w driver-web",
    "build:admin": "npm run build -w admin-web",
    "migrate": "npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma",
    "seed": "node apps/backend/scripts/seed-test-data.js",
    "lint": "npm run lint --workspaces"
  }
}
```

#### 5. Production start script

Update `apps/backend/package.json` start script:
```json
"start": "npx prisma generate && node src/index.js"
```

The migration step should be separate (run before deploy, not on every start).

### Both Frontend Apps

#### 6. Build optimization verification

Verify Vite builds produce optimized output:
- Check bundle sizes: `vite build --reporter`
- Ensure tree shaking removes unused code
- Verify code splitting works
- Check that environment variables are correctly injected
- Ensure source maps are NOT included in production builds

### Documentation

#### 7. Deployment runbook

Create `migration-plan/deployment-runbook.md` with step-by-step production deployment instructions (this is done at the end of the day as documentation).

## Acceptance Criteria

- [ ] render.yaml has all new environment variables
- [ ] .env.example documents all required variables
- [ ] Database migration runs cleanly (dev and deploy)
- [ ] Backend starts with correct migration + generate flow
- [ ] CORS configured with production URLs
- [ ] Frontend builds produce optimized bundles
- [ ] No source maps in production builds
- [ ] Health check works in production configuration
- [ ] All webhook URLs point to production backend
- [ ] Build scripts documented and working

## What's Next (Day 5)

Tomorrow we do a **final review and documentation** — reviewing all code for quality, updating the README, and creating an operational runbook.
