# Migration Plan: Full Hiring Lifecycle Platform

## Vision

Replace external ATS (Fountain) with an in-house hiring lifecycle platform built inside the existing monorepo. The system will manage the complete driver hiring journey from job posting through first block assignment.

## Canonical Stage Flow

```
applied → pending_review → screening → acknowledgements → contract_sent → contract_signed → documents_pending → documents_under_review → payment_details_pending → onboarding_call → questionnaire → decision_pending → approved → first_block_assigned → active | first_block_failed → rejected
```

Rejection can occur at: `pending_review`, `documents_under_review`, `decision_pending`, `first_block_failed`.

## Current System (being replaced)

- **Fountain webhook** ingests applicant data into `fountain_applicants` table
- **Driver auth**: email lookup against Fountain data → phone verify → JWT
- **Driver onboarding**: 16-page acknowledgement/data-collection flow
- **Admin dashboard**: single-page with status management, fee structures, facilities, admin CRUD
- **Tech**: Express 5, Prisma 7, PostgreSQL, React + Vite, Tailwind, Firebase Admin (admin auth), Render deployment

## Target System

**Note:** The platform uses **cities** (table `cities`, API `/api/cities`) instead of the older “regions” naming. See [architecture-cities-refactor.md](./architecture-cities-refactor.md) for the full mapping.

### New Capabilities
1. **City setup** — city name, code, country, currency, timezone, payment requirements, contract templates
2. **Job management** — create, publish, generate public apply links
3. **Public application portal** — drivers apply directly, no Fountain
4. **Stage-based pipeline** — all transitions through one engine with guards + actions
5. **Email/SMS notifications** — template-based, triggered by stage transitions
6. **Dropbox Sign contracts** — send, track, receive signed callbacks
7. **Document collection** — image/PDF uploads + in-app video recording (1-2 min max)
8. **Document verification** — admin review with approve/reject per document
9. **Payment details** — city-specific requirements (via `paymentFieldsSchema` on the city)
10. **Onboarding call tracking** — schedule + complete
11. **Questionnaire/MOQ** — configurable questions with scoring
12. **Decision engine** — approve/reject based on MOQ + manual override
13. **First block tracking** — pass/fail with terminal rejection

### Architecture Principles
- **Modular monolith** — modules in `apps/backend/src/modules/`
- **Single transition API** — all stage changes via one service with guards
- **Immutable audit log** — every transition recorded with actor, reason, timestamp
- **Config-driven** — cities, payment rules, templates are data, not code
- **Template-based comms** — no hardcoded email/SMS text in controllers

## Monorepo Structure (Target)

```
apps/
  backend/
    prisma/schema.prisma          (expanded)
    src/
      index.js                    (Express app, updated route mounts)
      modules/
        regions/                  (city.*.js — cities API; folder name is historical)
        contracts/                (controller, service, schemas)
        jobs/                     (controller, service, schemas)
        applications/             (controller, service, schemas)
        workflow/                 (stage engine, transition matrix, guards)
        documents/                (controller, service, upload handling)
        payments/                 (controller, service, schemas)
        questionnaire/            (controller, service, schemas)
        communications/           (email/SMS templates, delivery queue)
        integrations/
          dropbox-sign/           (API client, webhook handler)
      api/                        (legacy routes — phased out)
      lib/                        (shared utilities — kept)
  driver-web/
    src/
      pages/                      (new apply flow + refactored screening)
      components/                 (new: camera, upload, contract viewer)
      context/                    (refactored auth + application context)
  admin-web/
    src/
      pages/                      (pipeline view, city mgmt, job mgmt)
      components/                 (kanban, document reviewer, stage controls)
packages/
  shared/                         (UI components, API client, types)
```

## Weekly Breakdown

| Week | Focus | Milestone |
|------|-------|-----------|
| 1 | Foundation: schema, stage engine, city/job models | Core DB + workflow engine working |
| 2 | Public application portal | Drivers can apply via job link |
| 3 | Admin pipeline management | Admin can view + move applications through stages |
| 4 | Screening & acknowledgements refactor | Current onboarding flow integrated as pipeline stages |
| 5 | Communications + Dropbox Sign | Email/SMS on transitions + contract signing |
| 6 | Document collection | Image/PDF/video upload with in-app camera |
| 7 | Document verification + payment details | Admin reviews docs + collect payment info |
| 8 | Onboarding call + questionnaire | Call tracking + MOQ system |
| 9 | Decision engine + first block | Approve/reject + first block pass/fail |
| 10 | Polish + deploy | E2E testing, hardening, deployment |

## Database Tables (Target — Full List)

### Core Platform
- `City` (`cities`) — city name, city code, country, timezone, currency, payment schema, settings
- `ContractTemplate` — per city/type, Dropbox Sign template ID, content
- `Job` — name, description, city, contract, publish status
- `JobPublicLink` — slug, job ref, active/expiry

### Applications & Workflow
- `Application` — candidate profile, current stage, job ref (city via job)
- `ApplicationStageHistory` — every transition with actor, reason, timestamp
- `ApplicationTask` — checklist items per stage

### Documents
- `DocumentRequirement` — per city, what docs are needed
- `DocumentSubmission` — file URL, type, verification status, reviewer notes

### Payments
- `PaymentDetailSubmission` — structured per city requirements

### Questionnaire
- `Questionnaire` — template with questions
- `QuestionnaireQuestion` — individual question + scoring
- `QuestionnaireResponse` — driver answers + scores

### Communications
- `MessageTemplate` — event key, channel, locale, subject, body
- `CommunicationLog` — delivery attempts, status, provider IDs

### Existing (kept/modified)
- `Driver` → becomes linked to `Application`
- `DriverAvailability` → kept
- `DriverFacility` → kept
- `DriverOnboardingStep` → kept (used during screening stage)
- `Verification` → merged into documents
- `FeeStructure` / `BlockData` → kept
- `Facility` → kept
- `Admin` → expanded with roles/permissions
- `FountainApplicant` → deprecated, eventually dropped

## Key Decisions

1. **Email provider**: Resend (simple API, good DX, free tier sufficient)
2. **SMS provider**: Twilio (reliable, good API)
3. **File storage**: AWS S3 (signed URL uploads from client)
4. **Contract signing**: Dropbox Sign API
5. **Job queue**: pg-boss (PostgreSQL-based, no Redis needed)
6. **Video recording**: MediaRecorder API (browser-native)
