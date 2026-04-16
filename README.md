# Talentrix by Laundryheap

Driver hiring and onboarding platform (Talentrix by Laundryheap), implemented as a monorepo with one modular backend and two frontend apps.

## Overview

This system manages the full hiring lifecycle for driver candidates:

- public job discovery and application submission
- OTP-based driver authentication
- staged screening and onboarding progression
- admin pipeline management and lifecycle transitions
- document upload/review, payment details, questionnaire, contract signing

## Architecture

```text
Driver Browser (driver-web) ----\
                                  > Static apps on Render
Admin Browser (admin-web)  -----/
                |
                v
        Backend API (Express modular monolith)
                |
      --------------------------------
      | Prisma | Postgres | S3/R2 |
      --------------------------------
                |
   Integrations: Resend, Twilio, Dropbox Sign
```

## Repository Layout

```text
.
├── apps/
│   ├── backend/       # Express API + Prisma
│   ├── driver-web/    # Driver-facing app
│   └── admin-web/     # Admin dashboard
├── packages/
│   └── shared/        # Shared components and client utilities
├── docs/              # API docs, runbook, ADRs
├── migration-plan/
├── render.yaml
└── package.json
```

## Tech Stack

- Backend: Node.js, Express, Prisma, PostgreSQL, JWT, Pino
- Frontend: React, Vite, React Router, Tailwind
- Integrations: Resend, Twilio, Dropbox Sign, S3-compatible storage
- Deployment: Render (one Node service + two static services)

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Copy `.env.example` to `.env` and fill values.

```bash
cp .env.example .env
```

The backend reads env values from repository root `.env`.

### 3) Generate Prisma client

```bash
npm run build:backend
```

### 4) Seed development data (optional)

```bash
npm run seed
npm run seed:test-admin -w backend
npm run seed:email-templates -w backend
```

### 5) Run services locally

```bash
npm run dev:backend
npm run dev:driver
npm run dev:admin
```

## Modules (Backend)

- `applications`: submission, pipeline, transitions, decisions, first-block flow
- `communications`: templates, delivery logs, Resend/Twilio workflow
- `documents`: requirement management, upload/review lifecycle
- `payments`: driver payment details and verification
- `questionnaire`: dynamic onboarding questionnaire lifecycle
- `jobs`: job management + public links
- `regions`: operational geography configuration
- `contracts`: contract templates + Dropbox Sign integration
- `workflow`: transition rules and stage engine

## API Overview

Local base URL: `http://localhost:5001/api`

See full endpoint documentation in `docs/api.md`.

High-level groups:

- Public: jobs + application submission
- Driver: auth/session, application status, screening, docs, payment, questionnaire
- Admin: pipeline, jobs, regions, contracts, documents, analytics, communications
- Webhooks: Dropbox Sign, Resend, Twilio

## Deployment

- Render configuration lives in `render.yaml`
- Deployment runbook: `migration-plan/deployment-runbook.md`
- Operational runbook: `docs/runbook.md`

Core scripts:

- `npm run migrate`
- `npm run build:backend`
- `npm run build:driver`
- `npm run build:admin`

## Contributing

- Follow module boundaries (controllers -> services -> Prisma)
- Use structured logging (`logger.*`) instead of `console.*`
- Keep response shape consistent: `success` + payload/error fields
- Add validation schemas for new request payloads
- Update docs (`docs/api.md`, runbook, ADR) for behavior changes

## License

Proprietary - Laundryheap
