# Week 4 — Day 5: Clean Up Old Flow & Fountain Removal

## Context

The screening flow is now fully integrated with the new pipeline. Today we clean up technical debt — removing Fountain dependencies and the old standalone onboarding flow.

**Previous day**: Final screening pages refactored, screening completion → pipeline transition, post-screening dashboard states.

**What we're building today**: Remove all Fountain-related code, clean up old routes, delete dead code, and ensure the new flow is the only path.

## Today's Focus

1. Remove Fountain webhook and related code
2. Remove old auth flow (check-email + verify-phone)
3. Clean up old standalone onboarding routes
4. Remove dead components
5. Update shared package exports

## Detailed Changes

### Backend

#### 1. Remove Fountain webhook

- Delete `apps/backend/src/api/controllers/webhookController.js`
- Delete `apps/backend/src/api/routes/webhookRoutes.js`
- Remove webhook route mount from `apps/backend/src/index.js`

#### 2. Remove old auth endpoints

In `apps/backend/src/api/controllers/authController.js`:
- Remove `checkFountainEmail` function
- Remove `verifyApplicantPhone` function
- Keep `adminGoogleLogin` and `adminLogin` (still needed)

In `apps/backend/src/api/routes/authRoutes.js`:
- Remove `POST /check-email` route
- Remove `POST /verify-phone` route
- Keep admin auth routes

#### 3. Deprecate FountainApplicant model

In `schema.prisma`:
- Add a comment: `/// @deprecated — Fountain integration removed. Table kept for historical data.`
- Do NOT drop the table yet (historical data preservation)
- Remove any active queries against this table

#### 4. Clean up driver controller

In `apps/backend/src/api/controllers/driverController.js`:
- Remove `getDriverData`'s Fountain applicant lookup (lines that query `fountainApplicant`)
- The driver data now comes from Application + Driver tables only

#### 5. Remove old serialization helpers

In `apps/backend/src/lib/driverSerialize.js`:
- Keep the availability/step/progress helpers (still used by screening)
- Remove any Fountain-specific field mapping

#### 6. Remove migration scripts

- Delete `apps/backend/scripts/migrate-data.js` (Firestore → Postgres migration, no longer needed)
- Delete `apps/backend/scripts/check-admin.cjs` (Firestore check)
- Delete `apps/backend/scripts/initialize-super-admin.cjs` (Firestore init)
- Delete `apps/backend/check-count.js` (Fountain count check)

#### 7. Clean up admin controller

In `apps/backend/src/api/controllers/adminController.js`:
- `getAdminDashboardData` — this queried `fountainApplicant.findMany()` and merged with drivers. Remove the Fountain query. This endpoint can now redirect to the new `/api/applications` endpoint, or be kept as a thin wrapper.

### Frontend (Driver Web)

#### 1. Remove old standalone routes

In `apps/driver-web/src/App.jsx`, remove the old top-level routes:
- `/` (Welcome — old email entry)
- `/verify` (old phone verification)
- `/confirm-details` (old standalone)
- `/introduction`, `/about`, `/role`, etc. (old standalone paths)
- `/thank-you` (old completion)

These are now all under `/screening/*`.

New top-level routes should be:
```jsx
<Route path="/" element={<Navigate to="/dashboard" />} />
<Route path="/apply/:slug" element={<JobApplication />} />
<Route path="/login" element={<DriverLogin />} />
<Route path="/dashboard" element={<ProtectedRoute><DriverDashboard /></ProtectedRoute>} />
<Route path="/screening/*" element={<ProtectedRoute><ScreeningGuard>...</ScreeningGuard></ProtectedRoute>} />
<Route path="*" element={<NotFound />} />
```

#### 2. Remove old pages (if replaced)

Delete files that have been superseded:
- `apps/driver-web/src/pages/Welcome.jsx` (replaced by JobApplication + DriverLogin)
- `apps/driver-web/src/pages/Verify.jsx` (replaced by DriverLogin with OTP)
- `apps/driver-web/src/pages/ThankYou.jsx` (replaced by dashboard states)

#### 3. Clean up AuthContext

In `apps/driver-web/src/context/AuthContext.jsx`:
- Remove `checkEmail` method (Fountain lookup)
- Remove `verifyPhone` method (old phone verify)
- Keep: `requestCode`, `verifyCode`, `getSession`, `signOut`
- Remove any `fountainData` state handling

#### 4. Clean up services

In `apps/driver-web/src/lib/firebase-services.js`:
- Remove `authServices.checkFountainApplicant`
- Remove `authServices.verifyPhoneNumber`
- Rename file to `api-services.js` (no longer Firebase-specific)

#### 5. Clean up shared package

In `packages/shared/lib/driver-services.js`:
- Remove `authServices.checkFountainApplicant`
- Remove any Fountain-specific code

In `packages/shared/lib/progress-tracking.js`:
- Update `ONBOARDING_ROUTES` to reflect `/screening/*` paths
- Update `getNextRoute` to work with new screening route structure
- Or deprecate if ApplicationContext now handles progress tracking

In `packages/shared/lib/utils.js`:
- Remove `debugFountainDataStructure` function
- Keep `getVehicleTypeFromMOT` if still useful for vehicle type normalization

#### 6. Remove dead components

- `apps/driver-web/src/components/ProgressRedirect.jsx` (never imported)
- `apps/driver-web/src/components/ScreenshotProtection.jsx` (if not used in new flow)
- `apps/driver-web/src/hooks/useSaveProgress.js` (replaced by ApplicationContext step tracking)
- `apps/driver-web/src/config/agent-prompt.js` (Vapi agent — evaluate if keeping)

### Both Apps

#### 1. Remove Firestore config (if not used by admin auth)

Check if Firebase client SDK is still needed:
- Admin web: YES — used for Google sign-in (keep `firebase.js`)
- Driver web: NO — can remove Firebase client dependencies if not using Google auth for drivers

In driver-web, if Firebase is only for Fountain:
- Remove `firebase` import/config
- Remove from `package.json` dependencies

#### 2. Update README.md

Update the architecture section to reflect the new flow (no Fountain webhook).

## Acceptance Criteria

- [ ] Fountain webhook endpoint removed
- [ ] Old auth endpoints (check-email, verify-phone) removed
- [ ] No active code queries FountainApplicant table
- [ ] Old standalone routes removed from driver-web
- [ ] Old Welcome/Verify/ThankYou pages deleted
- [ ] AuthContext has no Fountain methods
- [ ] Service files renamed and cleaned
- [ ] Dead components removed
- [ ] Shared package cleaned of Fountain utilities
- [ ] Backend starts without errors
- [ ] Driver web builds without errors
- [ ] Admin web builds without errors
- [ ] All new flows still work (apply, login, dashboard, screening)

## What's Next (Week 5, Day 1)

Week 5 starts **communications and contract signing**. Day 1 focuses on building the email infrastructure — template system, email service with Resend, and triggering emails on stage transitions.
