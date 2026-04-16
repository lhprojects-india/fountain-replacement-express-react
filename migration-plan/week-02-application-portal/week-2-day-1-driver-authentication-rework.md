# Week 2 — Day 1: Driver Authentication Rework

## Context

We completed Week 1 with the foundational infrastructure: new DB schema, stage engine, cities/contracts, jobs with public links, and the application submission form. Drivers can now apply via a public job link and their application enters the pipeline at `pending_review`.

The OLD auth flow was: Fountain email check → phone verify → JWT. We need to replace this entirely since Fountain is being removed.

**Previous day (Week 1, Day 5)**: Application submission flow — drivers can apply via public links, application created and auto-transitioned to pending_review.

**What we're building today**: New driver authentication system. Drivers authenticate using their application email + a verification code (email-based OTP or magic link). Once authenticated, they can access their application status and complete later stages.

## Today's Focus

1. Email-based verification code system (6-digit OTP sent via email)
2. New driver auth endpoints
3. Refactor driver-web AuthContext
4. Driver login/status page

## Detailed Changes

### Backend

#### 1. Add `VerificationCode` model to Prisma schema

```prisma
model VerificationCode {
  id          Int      @id @default(autoincrement())
  email       String
  code        String
  expiresAt   DateTime @map("expires_at")
  usedAt      DateTime? @map("used_at")
  attempts    Int      @default(0)
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([email, code])
  @@map("verification_codes")
}
```

Run `prisma migrate dev --name add_verification_codes`.

#### 2. `apps/backend/src/modules/applications/auth.service.js`

Functions:
- `requestVerificationCode(email)`:
  1. Find application(s) by email — if none, return error "No application found"
  2. Generate 6-digit random code
  3. Store in `VerificationCode` table (expires in 10 minutes)
  4. Invalidate any previous unused codes for this email
  5. Send email with code (for now, just console.log the code — actual email comes Week 5)
  6. Return `{ sent: true }`

- `verifyCode(email, code)`:
  1. Look up the latest unused code for this email
  2. Validate: not expired, not already used, attempts < 5
  3. If mismatch: increment attempts, return error
  4. If match: mark as used, generate JWT with `{ email, role: 'driver', applicationId }`
  5. Return `{ token, application: { id, currentStage, firstName, lastName } }`

- `getDriverSession(email)`:
  1. Get application(s) for this email
  2. Return application summary (current stage, basic info)

#### 3. `apps/backend/src/modules/applications/auth.routes.js`

Public (no auth):
```
POST /api/auth/driver/request-code    — { email }
POST /api/auth/driver/verify-code     — { email, code }
```

Driver (JWT required):
```
GET  /api/auth/driver/session          — returns current application + stage
```

#### 4. Update JWT payload

The new driver JWT should include:
```javascript
{
  email: 'driver@example.com',
  role: 'driver',
  applicationId: 123  // primary application
}
```

Update `authMiddleware.js` to handle this — the `authenticateToken` middleware already reads `req.user` from JWT, but now the payload structure includes `applicationId`.

#### 5. Keep old auth endpoints temporarily

Don't delete the old `/auth/check-email` and `/auth/verify-phone` yet — they'll be removed in Week 4 when we refactor the screening flow.

### Frontend (Driver Web)

#### 1. New page: `apps/driver-web/src/pages/DriverLogin.jsx`

Two-step form:
1. **Email step**: Enter email → calls `POST /api/auth/driver/request-code`
   - Success: show "We sent a verification code to your email"
   - Error (no application): show "No application found. Please apply first." with link to job listing

2. **Code step**: Enter 6-digit code → calls `POST /api/auth/driver/verify-code`
   - Success: save token, redirect to `/dashboard`
   - Error: show "Invalid or expired code" + retry

Use existing shared `Input`, `Button` components. Make the code input either 6 separate boxes or one text input with pattern validation.

#### 2. New page: `apps/driver-web/src/pages/DriverDashboard.jsx` — Skeleton

After login, drivers land here. For today, just show:
- "Welcome, {firstName}!"
- Current application stage (human-readable label)
- A timeline/stepper showing all stages with current highlighted
- Placeholder content area where stage-specific actions will appear later

#### 3. New route: `/login` and `/dashboard`

Add to `apps/driver-web/src/App.jsx`:
```jsx
<Route path="/login" element={<DriverLogin />} />
<Route path="/dashboard" element={<ProtectedRoute><DriverDashboard /></ProtectedRoute>} />
```

#### 4. `apps/driver-web/src/components/ProtectedRoute.jsx`

Simple guard component:
- If authenticated (token exists + valid): render children
- If not: redirect to `/login`

#### 5. Refactor `apps/driver-web/src/context/AuthContext.jsx`

Add new methods alongside existing ones (don't remove old ones yet):
- `requestCode(email)` — calls new request-code API
- `verifyCode(email, code)` — calls new verify-code API, saves token, sets authenticated
- `getSession()` — calls session API, returns application info

Keep the old `checkEmail` and `verifyPhone` for now — they'll be removed in Week 4.

#### 6. `apps/driver-web/src/lib/public-services.js`

Add:
```javascript
requestVerificationCode(email) — POST /api/auth/driver/request-code
verifyCode(email, code) — POST /api/auth/driver/verify-code
getDriverSession() — GET /api/auth/driver/session (with token)
```

## Acceptance Criteria

- [ ] `POST /api/auth/driver/request-code` generates and stores 6-digit code
- [ ] Code expires after 10 minutes
- [ ] `POST /api/auth/driver/verify-code` returns JWT on correct code
- [ ] Max 5 attempts per code before lockout
- [ ] JWT includes applicationId
- [ ] Driver login page: email → code → dashboard flow works
- [ ] ProtectedRoute redirects to /login when unauthenticated
- [ ] Dashboard shows welcome message + current stage
- [ ] Old auth endpoints still functional (not broken)
- [ ] Verification code logged to console (no email provider yet)

## What's Next (Day 2)

Tomorrow we build the **driver application status portal** — the dashboard where drivers can see their application progress, view a timeline of stages, and access stage-specific actions (the gateway to screening, document upload, etc. in future weeks).
