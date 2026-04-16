# Week 8 Day 5 - E2E Test Log

Use this file while running the Day 5 checklist.

## Environment
- Date: 2026-04-10
- Backend URL: http://localhost:5001
- Driver URL: http://localhost:3000
- Admin URL: http://localhost:3001
- DB status: reachable during seed and API smoke run

## Seed
- Command: `npm run seed:test -w backend`
- Result: success
- Public job link slug: `uk-van-driver-mnslb19f-b57300`

## Happy Path Results
- [ ] Admin create city
- [ ] Admin create job + public link
- [ ] Driver apply
- [ ] Admin move to screening
- [ ] Driver screening complete
- [ ] Admin contract sent
- [ ] Contract signed -> documents pending
- [ ] Driver documents upload
- [ ] Admin documents approve -> payment pending
- [ ] Driver payment details submit
- [ ] Admin onboarding call complete
- [ ] Driver questionnaire submit
- [ ] Admin decision approve
- [ ] Admin first block assign + pass
- [ ] Driver active state

## Edge Cases
- [ ] Duplicate application -> 409
- [ ] Closed job apply blocked
- [ ] Expired link blocked
- [ ] Wrong OTP retry
- [ ] Expired OTP + resend
- [ ] Unauthorized screening redirect
- [ ] Upload invalid file type blocked
- [ ] Upload oversized file blocked
- [ ] Short video warning
- [ ] Document reject + re-upload
- [ ] Reject application shown to driver
- [ ] Withdraw flow
- [ ] Re-open rejected -> pending_review
- [ ] Bulk transition partial failures
- [ ] Session expiry redirect
- [ ] Offline banner shown

## Performance Baseline
- Pipeline load: 583 ms (API)
- Application detail load: 704 ms (API)
- Stage transition API: 2014 ms (API)
- Upload timings: not yet measured (manual UI test pending)

Notes:
- Transition to `pending_review` on app 16 returned 403 when called through generic transition endpoint (re-open path requires role metadata/reopen endpoint).
- Baseline target check (plan): pipeline/detail pass; transition target `<500ms` not met in this run.
- Additional probe after making notification dispatch non-blocking in workflow actions:
  - pipeline: 1689 ms
  - detail: 1915 ms
  - transition (successful): 2228 ms
  - Conclusion: no measurable improvement due to likely network/DB variability; bottleneck appears external (DB/connectivity), not notification wait.

## Bugs Found
1. Re-open style transition (`toStage=pending_review`) from app 16 returns 403 through generic workflow transition endpoint in perf smoke run.
2.
3.

## Fixes Applied
1. Optimized workflow actions so notification dispatch no longer blocks transition response path (`apps/backend/src/modules/workflow/actions.js`).
2.
3.

## Final Signoff
- [ ] Happy path complete
- [ ] Notifications sent correctly
- [ ] Stage transitions correct
- [ ] No blocking console errors
- [ ] Edge cases acceptable or documented
