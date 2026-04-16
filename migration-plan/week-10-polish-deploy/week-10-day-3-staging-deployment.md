# Week 10 — Day 3: Staging Deployment

## Context

All bugs from testing are fixed. Today we deploy to a staging environment to verify everything works outside of localhost.

**Previous day**: Bug fixes and polish — all Critical/High bugs fixed, UI consistency, copy review.

**What we're building today**: Deploy the complete system to Render staging, verify external integrations, and perform smoke testing in a production-like environment.

## Today's Focus

1. Database setup (staging)
2. Deploy backend to Render
3. Deploy both frontends to Render
4. Configure external services for staging
5. Staging smoke tests

## Deployment Steps

### 1. Database

- [ ] Create staging PostgreSQL database (Render managed or external)
- [ ] Set `DATABASE_URL` environment variable
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Run seed script for test data
- [ ] Verify database connectivity via health check

### 2. Backend Deployment

- [ ] Push code to deployment branch
- [ ] Render auto-deploys from branch
- [ ] Verify health check: `GET /health` returns 200
- [ ] Verify all environment variables set
- [ ] Check logs for startup errors

### 3. Frontend Deployments

- [ ] Driver web deploys and loads at staging URL
- [ ] Admin web deploys and loads at staging URL
- [ ] Verify `VITE_API_URL` points to staging backend
- [ ] Verify SPA routing works (refresh on any route)

### 4. External Service Configuration

#### Resend (Email)
- [ ] Verify `RESEND_API_KEY` works
- [ ] Send test email from staging
- [ ] Configure webhook URL in Resend dashboard: `{staging-backend}/api/webhooks/resend`

#### Twilio (SMS)
- [ ] Verify `TWILIO_*` credentials work
- [ ] Send test SMS from staging
- [ ] Verify status callback URL: `{staging-backend}/api/webhooks/twilio`

#### Dropbox Sign
- [ ] Verify `DROPBOX_SIGN_API_KEY` works
- [ ] Configure webhook callback URL: `{staging-backend}/api/webhooks/dropbox-sign`
- [ ] Test webhook verification challenge (GET)
- [ ] Create a test signature request

#### S3/R2 (File Storage)
- [ ] Verify `S3_*` credentials work
- [ ] Test presigned URL generation
- [ ] Test file upload + download
- [ ] Verify CORS on S3 bucket allows staging frontend origin

### 5. Staging Smoke Tests

Run through the critical path on staging:

- [ ] Admin login (Google auth with staging Firebase project)
- [ ] Create a test city + job + public link
- [ ] Open public link in browser
- [ ] Submit application
- [ ] Check confirmation email received (real email)
- [ ] Login as driver with OTP (check real email for code)
- [ ] Move through first 3 screening steps
- [ ] Admin moves application through pipeline
- [ ] Upload a test document
- [ ] Verify document appears in S3/R2

### 6. Performance Check

- [ ] Backend response times acceptable (< 500ms for most endpoints)
- [ ] Frontend loads quickly (< 3s initial load)
- [ ] No render-blocking resources in frontend
- [ ] Database query times acceptable

### 7. CORS Verification

- [ ] Driver web can call backend APIs
- [ ] Admin web can call backend APIs
- [ ] No CORS errors in browser console
- [ ] Webhook endpoints accept external calls (no CORS for webhooks)

### Fixes

If any issues found:
- Fix locally
- Push to staging branch
- Re-verify

## Acceptance Criteria

- [ ] Backend deployed and healthy on staging
- [ ] Both frontends accessible and functional
- [ ] Database migrations applied successfully
- [ ] Email sending works (real emails received)
- [ ] SMS sending works (real SMS received)
- [ ] File upload to S3/R2 works
- [ ] Dropbox Sign webhook configured
- [ ] Full critical path works on staging
- [ ] No CORS issues
- [ ] Performance acceptable

## What's Next (Day 4)

Tomorrow we do **production deployment preparation** — final checklist, DNS/domain setup, SSL verification, and the production deployment itself.
