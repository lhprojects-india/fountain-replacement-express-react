# Week 8 — Day 5: End-to-End Integration Testing

## Context

The full system is built and polished. Today we verify everything works together by testing the complete flow end-to-end.

**Previous day**: Driver web refinement — multi-step forms, mobile-first design, accessibility, polish.

**What we're building today**: End-to-end test scenarios, data seeding for testing, and fix any integration issues discovered.

## Today's Focus

1. Test data seeding script
2. Happy path walkthrough
3. Edge case testing
4. Bug fixing
5. Performance baseline

## Detailed Changes

### Backend

#### 1. Test data seeding script

Create `apps/backend/scripts/seed-test-data.js`:

```javascript
// Seeds a complete test environment:
// 1. Create city: "United Kingdom" with payment schema and doc requirements
// 2. Create contract template for the city
// 3. Create job: "Van Driver — London"
// 4. Generate public link
// 5. Create sample applications at each stage (for admin testing)
// 6. Create admin accounts with different roles
// 7. Create questionnaire with sample questions
// 8. Seed email/SMS templates
```

This allows quickly resetting the database to a known state for testing.

#### 2. Add to package.json scripts:
```json
"seed:test": "node scripts/seed-test-data.js"
```

### Testing Scenarios

#### Happy Path: Complete Flow

Walk through every step manually:

1. **Admin: Create city**
   - [ ] Login as super_admin
   - [ ] Create "United Kingdom" city with GBP, Europe/London
   - [ ] Set payment fields (bank name, account number, sort code)
   - [ ] Seed document requirements (selfie, DL, vehicle photo, ID, vehicle video)

2. **Admin: Create job**
   - [ ] Create "Van Driver — London" linked to UK city
   - [ ] Add contract template
   - [ ] Publish job
   - [ ] Generate public link
   - [ ] Copy link

3. **Driver: Apply**
   - [ ] Open public link
   - [ ] Fill application form
   - [ ] Submit successfully
   - [ ] See confirmation page
   - [ ] Verify email received (check Resend dashboard)

4. **Admin: Review application**
   - [ ] See application in pipeline (pending_review)
   - [ ] Open detail panel
   - [ ] Move to screening
   - [ ] Verify email sent to driver

5. **Driver: Login & screening**
   - [ ] Login with email + verification code
   - [ ] See dashboard with "Begin Screening" action
   - [ ] Complete all 13 screening steps
   - [ ] See screening summary → complete
   - [ ] Verify transition to acknowledgements

6. **Admin: Send contract**
   - [ ] Move application to contract_sent
   - [ ] Verify Dropbox Sign request created (or manual flow)
   - [ ] Verify driver notified

7. **Driver/System: Contract signed**
   - [ ] Simulate contract signed (Dropbox Sign webhook or manual mark)
   - [ ] Verify auto-transition to documents_pending
   - [ ] Verify driver notified

8. **Driver: Upload documents**
   - [ ] Login, see "Upload Documents" action
   - [ ] Upload selfie (image compression works)
   - [ ] Upload driving license (PDF)
   - [ ] Upload vehicle photo
   - [ ] Upload ID document
   - [ ] Record vehicle video (in-app camera)
   - [ ] Submit documents for review

9. **Admin: Review documents**
   - [ ] See application in documents_under_review
   - [ ] Open document reviewer
   - [ ] View each document (image lightbox, video player)
   - [ ] Complete verification checklists
   - [ ] Approve all documents
   - [ ] Verify auto-transition to payment_details_pending

10. **Driver: Submit payment details**
    - [ ] See "Submit Payment Details" on dashboard
    - [ ] Fill dynamic form (bank name, account number, sort code)
    - [ ] Submit successfully
    - [ ] Verify transition to onboarding_call

11. **Admin: Onboarding call**
    - [ ] Schedule call with date/time
    - [ ] Verify driver notified
    - [ ] Complete call with notes
    - [ ] Verify transition to questionnaire

12. **Driver: Questionnaire**
    - [ ] See "Take Assessment" on dashboard
    - [ ] Answer all questions
    - [ ] Submit assessment
    - [ ] See score and pass/fail result
    - [ ] Verify transition to decision_pending

13. **Admin: Decision**
    - [ ] See decision summary with all sections
    - [ ] See auto-recommendation
    - [ ] Approve application
    - [ ] Verify congratulations email sent

14. **Admin: First block**
    - [ ] Assign first block date
    - [ ] Verify driver notified
    - [ ] Record pass result
    - [ ] Verify transition to active

15. **Driver: Active state**
    - [ ] Dashboard shows "Active" status
    - [ ] Welcome message displayed

#### Edge Cases to Test

- [ ] Duplicate application (same email + job) → 409 error
- [ ] Apply to closed job → clear error
- [ ] Expired public link → clear error
- [ ] Wrong OTP code → error with retry
- [ ] Expired OTP → request new code
- [ ] Navigate to screening when not in screening stage → redirect
- [ ] Upload wrong file type → validation error
- [ ] Upload oversized file → validation error
- [ ] Video too short (< 30s) → validation warning
- [ ] Reject document → driver sees reason + re-upload
- [ ] Reject application → driver sees rejection message
- [ ] Withdraw application → dashboard shows withdrawn
- [ ] Re-open rejected application → moves back to pending_review
- [ ] Bulk transition → partial failures handled correctly
- [ ] Session expired → redirect to login
- [ ] Offline state → appropriate messaging

### Performance Baseline

Record:
- [ ] Time to load pipeline page (target < 2s)
- [ ] Time to load application detail (target < 1s)
- [ ] Time to transition between stages (target < 500ms)
- [ ] Document upload speed (varies by size)
- [ ] API response times for key endpoints

### Fix Any Issues Found

Dedicate the second half of the day to fixing bugs discovered during testing. Document all issues found.

## Acceptance Criteria

- [ ] Complete happy path works end-to-end
- [ ] All email notifications sent at correct times
- [ ] All stage transitions fire correctly
- [ ] No JavaScript console errors during flow
- [ ] All edge cases handled gracefully
- [ ] Performance targets met
- [ ] Test seed script works and can reset environment
- [ ] All bugs found today are fixed or documented

## What's Next (Week 9, Day 1)

Week 9 focuses on **hardening, security, and performance** — rate limiting, input sanitization, SQL injection prevention, CORS tightening, and performance optimization.
