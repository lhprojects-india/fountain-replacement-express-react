# Week 9 — Day 5: Final Review & Documentation

## Context

Deployment configuration is ready. Today is the final review and documentation day before the polish week.

**Previous day**: Deployment config — render.yaml, env variables, migration strategy, build optimization.

**What we're building today**: Code quality review, README update, API documentation, operational runbook, and final cleanup.

## Today's Focus

1. Code quality review
2. README rewrite
3. API documentation
4. Operational runbook
5. Dead code removal

## Detailed Changes

### Code Quality Review

#### 1. Consistency pass

Review ALL modules for consistency:
- Controller pattern: validate → service call → response
- Service pattern: business logic, uses Prisma, returns data
- Error handling: uses custom error classes everywhere
- Logging: uses pino logger everywhere (no console.log)
- Response format: `{ success: boolean, data?, error?, message? }` consistently

#### 2. Remove dead code

Scan for and remove:
- Unused imports
- Commented-out code blocks
- Unused functions/variables
- Old Fountain-related code that was missed in Week 4
- Unused components in both frontend apps
- Stale test data or mock functions

#### 3. TypeScript JSDoc annotations

Add JSDoc type annotations to all service functions and key utilities. The backend uses JavaScript but TypeScript-aware JSDoc helps IDE support:
```javascript
/** @param {number} applicationId */
/** @returns {Promise<import('@prisma/client').Application>} */
```

### Documentation

#### 4. Rewrite README.md

Complete rewrite reflecting the new system:
- Project overview (hiring lifecycle platform)
- Architecture diagram (text-based)
- Tech stack
- Getting started (install, env vars, seed, run)
- Module descriptions
- API overview (grouped by module)
- Deployment instructions
- Contributing guidelines

#### 5. API documentation

Create `docs/api.md` with all endpoints:

Organize by module:
- **Public**: Job lookup, application submission, auth (OTP)
- **Driver**: Application status, screening, documents, payment, questionnaire
- **Admin**: Pipeline, transitions, cities, jobs, contracts, documents, analytics
- **Webhooks**: Dropbox Sign, Resend, Twilio

For each endpoint: method, path, auth requirement, request body, response format, error codes.

#### 6. Operational runbook

Create `docs/runbook.md`:
- **Daily operations**: How to review applications, manage pipeline
- **Common tasks**: Create city, create job, generate link
- **Troubleshooting**: Common errors and fixes
- **Monitoring**: What to watch (health check, error rates, queue depth)
- **Incident response**: What to do if X fails
- **Database**: How to run migrations, backups
- **Scaling**: When/how to scale

#### 7. Architecture decision records

Create `docs/adr/` with key decisions:
- `001-modular-monolith.md` — why single backend with modules
- `002-stage-engine.md` — why centralized transition management
- `003-email-provider.md` — why Resend
- `004-file-storage.md` — why S3/R2 with signed URLs
- `005-contract-signing.md` — why Dropbox Sign

### Cleanup

#### 8. Remove stale files

- `stitch.html` (design reference, no longer needed in repo)
- `ai-prompt.md` (if outdated)
- `firestore.rules` / `firestore.indexes.json` (if Firestore fully removed)
- `firebase.json` (if only used for Firestore)
- `.firebaserc` (if Firebase hosting not used)
- Old migration scripts from `apps/backend/scripts/`

#### 9. Update .gitignore

Ensure these are ignored:
- `.env`
- `*.log`
- `node_modules/`
- `dist/`
- Firebase service account JSON files
- IDE files

#### 10. Package dependency cleanup

Run `npm audit` and fix vulnerabilities.
Remove unused packages from all `package.json` files:
- Driver web: remove Firebase client SDK if no longer used
- Shared: remove any Fountain-specific utilities
- Backend: remove any unused packages

## Acceptance Criteria

- [ ] No console.log/error in production code
- [ ] All dead code removed
- [ ] Response format consistent across all endpoints
- [ ] README accurately describes the new system
- [ ] API documentation covers all endpoints
- [ ] Operational runbook provides clear guidance
- [ ] Stale files removed from repo
- [ ] No npm audit vulnerabilities (high/critical)
- [ ] All packages in use (no unused deps)
- [ ] .gitignore is comprehensive

## What's Next (Week 10, Day 1)

Week 10 is the final polish and deployment week. Day 1 starts with a **complete end-to-end regression test** on the production-like configuration.
