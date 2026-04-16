# Week 10 — Day 1: Regression Testing

## Context

We are in the final week. All features, security, performance, and documentation are done. This week is about ensuring everything works perfectly before going live.

**Previous day (Week 9, Day 5)**: Documentation and review — README rewrite, API docs, runbook, dead code removal.

**What we're building today**: Full regression test suite covering all major flows, with both manual walkthroughs and automated smoke tests.

## Today's Focus

1. Manual regression test of all flows
2. Automated API smoke tests
3. Cross-browser testing (driver-web)
4. Mobile testing
5. Bug tracking and prioritization

## Testing Plan

### Manual Regression: Admin Flows

- [ ] Admin login (Google auth)
- [ ] Dashboard home loads with correct KPIs
- [ ] Create city with all fields
- [ ] Create contract template linked to city
- [ ] Create job linked to city + contract
- [ ] Publish job
- [ ] Generate public link, copy URL
- [ ] Pipeline view: table mode — filters, search, pagination
- [ ] Pipeline view: kanban mode — drag-drop
- [ ] Application detail: all tabs (profile, timeline, documents, notes, communications)
- [ ] Stage transition: forward, reject, reopen
- [ ] Bulk selection and actions
- [ ] Export CSV
- [ ] Analytics: all charts load with data
- [ ] Activity feed: shows recent transitions
- [ ] Quick search (Cmd+K): finds applications
- [ ] Document review: images, video, approve/reject
- [ ] Onboarding call: schedule, complete
- [ ] Questionnaire builder: create, edit, delete
- [ ] Decision: approve, reject
- [ ] First block: assign, pass/fail
- [ ] Email template management
- [ ] Admin management: create, assign roles
- [ ] Fee structure management
- [ ] Facility management
- [ ] Role-based access: admin_view cannot edit, admin_fleet limited

### Manual Regression: Driver Flows

- [ ] Open public job link
- [ ] Apply: multi-step form, validation, submission
- [ ] Receive confirmation email
- [ ] Login: email entry, receive OTP, enter code
- [ ] Dashboard: stage timeline, action panel, profile card
- [ ] Screening: all 13+ steps in order
- [ ] Screening summary: checklist, complete
- [ ] Document upload: each type (image, PDF, video)
- [ ] In-app video recording (on mobile if possible)
- [ ] Document re-upload after rejection
- [ ] Payment details: dynamic form submission
- [ ] Questionnaire: answer all, submit, see results
- [ ] Withdrawal flow
- [ ] Approved state on dashboard
- [ ] Rejected state on dashboard

### Cross-Browser Testing

Test driver-web on:
- [ ] Chrome (desktop)
- [ ] Safari (desktop)
- [ ] Firefox (desktop)
- [ ] Chrome (Android mobile)
- [ ] Safari (iOS mobile)
- [ ] Samsung Internet (if available)

Test admin-web on:
- [ ] Chrome (desktop)
- [ ] Safari (desktop)
- [ ] Firefox (desktop)

### Automated API Smoke Tests

Create `apps/backend/tests/smoke.test.js` (or a simple script):

```javascript
// Test each public endpoint returns expected status:
// GET  /health → 200
// GET  /api/public/jobs/:slug → 200 (with valid slug) / 404 (invalid)
// POST /api/public/applications → 201 (valid) / 400 (missing fields) / 409 (duplicate)
// POST /api/auth/driver/request-code → 200 (valid email) / 404 (no application)
// POST /api/auth/driver/verify-code → 200 (correct) / 401 (wrong code)

// Test each admin endpoint requires auth:
// GET /api/applications → 401 without token
// GET /api/cities → 401 without token

// Test rate limiting:
// Send 10 auth requests rapidly → expect 429 after 5
```

### Bug Tracking

For each issue found:
1. Note the severity: Critical (blocks launch), High (major UX issue), Medium (works but wrong), Low (cosmetic)
2. Fix Critical and High today
3. Document Medium and Low for post-launch

## Acceptance Criteria

- [ ] All manual regression tests passed or bugs documented
- [ ] No Critical bugs remaining
- [ ] All High severity bugs fixed
- [ ] Cross-browser testing shows no breaking issues
- [ ] Mobile flows work on iOS and Android
- [ ] API smoke tests all pass
- [ ] Rate limiting verified working
- [ ] Auth required on all protected endpoints

## What's Next (Day 2)

Tomorrow we focus on **bug fixes and polish** — fixing all issues found today, plus UI polish items.
