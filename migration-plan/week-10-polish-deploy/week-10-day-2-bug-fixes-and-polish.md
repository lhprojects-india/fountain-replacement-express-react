# Week 10 — Day 2: Bug Fixes & Polish

## Context

Yesterday's regression testing uncovered bugs and polish items. Today we fix them.

**Previous day**: Regression testing — full manual walkthrough, cross-browser, mobile, API smoke tests, bug tracking.

**What we're building today**: Fix all Critical/High bugs from testing, address Medium bugs, and apply final UI polish.

## Today's Focus

1. Fix all Critical and High bugs
2. Address Medium bugs where feasible
3. UI consistency polish
4. Loading state improvements
5. Copy/text review

## Approach

This day is reactive to the bugs found yesterday. The work depends on what was discovered. Below is a framework for common issues:

### Common Bug Categories

#### API Errors
- Missing error handling in specific endpoints
- Incorrect status codes returned
- Missing validation for edge cases
- Transaction issues (partial updates)

**Fix pattern**: Add/update Zod schema, add error handling, wrap in transaction.

#### UI Issues
- Layout breaks at certain screen sizes
- Missing loading states
- Incorrect data display
- Navigation issues
- Form validation gaps

**Fix pattern**: Add responsive breakpoints, add Skeleton/Spinner, fix data mapping, add form validation rules.

#### Stage Transition Bugs
- Guard not checking correct condition
- Action not firing
- History not recording correctly
- Available transitions showing wrong options

**Fix pattern**: Update guard logic, verify action registration, check transition matrix.

#### Email/SMS Issues
- Template variables not rendering
- Wrong email sent for stage
- Missing notifications for some transitions
- Delivery failures

**Fix pattern**: Fix template variable names, verify event-to-template mapping, check provider configuration.

### UI Polish Checklist

Apply consistent polish across both apps:
- [ ] All buttons have hover/active states
- [ ] All form inputs have focus rings
- [ ] All dialogs have close buttons and Escape key support
- [ ] All tables have alternating row colors
- [ ] All loading states use consistent Skeleton components
- [ ] All error toasts use consistent styling
- [ ] All empty states have helpful messages
- [ ] All dates displayed in user-friendly format
- [ ] All phone numbers displayed in E.164 format
- [ ] All monetary values show correct currency symbol
- [ ] Page titles set correctly for each route (document.title)
- [ ] Favicon displays correctly
- [ ] Brand colors consistent throughout

### Copy Review

Review all user-facing text:
- [ ] Email templates: grammar, tone, clarity
- [ ] Application form labels and help text
- [ ] Dashboard status messages
- [ ] Error messages: helpful, not technical
- [ ] Empty states: actionable instructions
- [ ] Button labels: action-oriented ("Submit", not "OK")

## Acceptance Criteria

- [ ] All Critical bugs fixed and verified
- [ ] All High bugs fixed and verified
- [ ] Medium bugs: fixed where feasible, rest documented as tech debt
- [ ] UI consistency verified across all pages
- [ ] All user-facing copy reviewed and corrected
- [ ] No JavaScript console errors during normal flows
- [ ] No broken links or dead routes

## What's Next (Day 3)

Tomorrow we do the **staging deployment** — deploy to a staging environment, run smoke tests against it, and verify external integrations (Dropbox Sign, Resend, Twilio, S3) work in a non-local environment.
