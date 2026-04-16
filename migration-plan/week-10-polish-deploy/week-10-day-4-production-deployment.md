# Week 10 — Day 4: Production Deployment

## Context

Staging is verified and working. Today we go live.

**Previous day**: Staging deployment — all services deployed, integrations verified, smoke tests passed.

**What we're building today**: Production deployment — final checklist, environment variable setup, DNS, and go-live.

## Today's Focus

1. Pre-deployment checklist
2. Production environment setup
3. Deploy to production
4. Post-deployment verification
5. Rollback plan

## Pre-Deployment Checklist

### Code
- [ ] All tests passing
- [ ] No known Critical/High bugs
- [ ] Code reviewed (self-review if solo)
- [ ] No debug/test code in production paths
- [ ] No hardcoded URLs (all from env vars)
- [ ] No secrets in code

### Database
- [ ] Migration SQL reviewed
- [ ] Backup current production database (if migrating existing)
- [ ] Migration tested on staging database copy

### Environment Variables
- [ ] All production env vars set in Render dashboard
- [ ] Secrets are strong (JWT_SECRET, etc.)
- [ ] External API keys are production keys (not test/sandbox)
- [ ] URLs point to production domains

### External Services
- [ ] Resend: domain verified, production API key
- [ ] Twilio: production phone number, verified sender
- [ ] Dropbox Sign: production API key, webhook URL updated
- [ ] S3/R2: production bucket, CORS configured for production frontend domains
- [ ] Firebase: production project for admin auth

### DNS/Domains
- [ ] Custom domain configured for backend (if applicable)
- [ ] Custom domain for driver web (if applicable)
- [ ] Custom domain for admin web (if applicable)
- [ ] SSL certificates active

## Deployment Procedure

### Step 1: Database Migration
```bash
# On production database
npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma
```

Verify: connect to production DB, check tables exist.

### Step 2: Deploy Backend
- Push to production branch (or merge to main)
- Render auto-deploys
- Monitor logs during startup
- Verify health check: `GET {production-url}/health`

### Step 3: Deploy Driver Web
- Trigger build on Render
- Verify SPA loads at production URL
- Verify API calls reach production backend

### Step 4: Deploy Admin Web
- Trigger build on Render
- Verify SPA loads at production URL
- Verify admin login works

### Step 5: Configure Webhooks (production URLs)
- Dropbox Sign: update callback URL to production
- Resend: update webhook URL to production
- Twilio: update status callback URL to production

### Step 6: Seed Initial Data
- Create initial admin account
- Create initial city(s)
- Create initial email/SMS templates (or verify seeds ran)
- Create initial document requirements
- Create initial questionnaire

## Post-Deployment Verification

Run a quick smoke test on production:

- [ ] Health check returns 200
- [ ] Admin can log in
- [ ] Admin dashboard loads
- [ ] Create a test job
- [ ] Public link works
- [ ] Application submission works
- [ ] Driver login with OTP works
- [ ] Email received (real)
- [ ] Basic pipeline operations work

## Rollback Plan

If critical issues discovered:

1. **Backend rollback**: Redeploy previous Git commit on Render
2. **Frontend rollback**: Same — redeploy previous commit
3. **Database rollback**: 
   - If migration caused issues: `npx prisma migrate resolve --rolled-back [migration_name]`
   - Restore from backup if needed
4. **External services**: Webhook URLs can be reverted to staging

## Post-Go-Live Monitoring

For the first 24 hours:
- Watch error logs continuously
- Monitor health check
- Check email delivery rates
- Watch for 500 errors
- Monitor response times
- Verify no CORS issues from production domains

## Acceptance Criteria

- [ ] All pre-deployment checks passed
- [ ] Database migration applied to production
- [ ] Backend healthy on production
- [ ] Both frontends accessible on production
- [ ] Admin login works
- [ ] Public application flow works
- [ ] Emails sending from production
- [ ] Webhooks configured for production
- [ ] No 500 errors in first hour
- [ ] Rollback plan tested/documented

## What's Next (Day 5)

Tomorrow is the final day — **post-launch monitoring, feedback collection, and future roadmap planning**.
