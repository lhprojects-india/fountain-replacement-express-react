# Week 8 — Day 4: Driver Web Refinement

## Context

The admin dashboard is polished. Now we refine the driver-facing experience to be production-ready.

**Previous day**: Admin dashboard refinement — sidebar navigation, dashboard home, KPIs, design consistency.

**What we're building today**: Driver web polish — improved apply form, dashboard UX, stage transitions, loading states, error handling, and mobile-first design.

## Today's Focus

1. Apply form improvements
2. Dashboard UX polish
3. Stage transition animations
4. Mobile-first responsive design
5. Error and empty states
6. Accessibility improvements

## Detailed Changes

### Frontend (Driver Web)

#### 1. Apply form (`JobApplication.jsx`) improvements

- **Multi-step form**: Break the single form into steps:
  1. Personal details (name, email, phone)
  2. Vehicle & address
  3. Review & submit
- **Step progress indicator** at the top
- **Auto-save**: Save progress to sessionStorage between steps
- **Phone validation**: Use `react-phone-number-input` with country code detection (e.g. from city/job config or default country)
- **Address autocomplete**: If feasible, integrate a simple address autocomplete (Google Places or just smart field layout)
- **Animated transitions** between steps

#### 2. Login page (`DriverLogin.jsx`) improvements

- Clean, branded login page
- Email input with autofocus
- OTP input: 6 separate digit boxes (auto-advance on digit entry, paste support)
- "Resend code" with countdown timer (60s)
- Clear error states with retry
- "Don't have an application? Find jobs" link

#### 3. Dashboard (`DriverDashboard.jsx`) polish

- **Stage timeline** improvement:
  - Vertical timeline on mobile, horizontal on desktop
  - Animated transitions when stage changes
  - Estimated time for each stage
- **Action panel** improvements:
  - Clear CTA buttons with icons
  - Progress indicators where applicable
  - Estimated timeline: "Typical processing time: 1-2 business days"
- **Application summary card** redesign:
  - Clean card with profile info
  - Vehicle details with icon
  - City badge (job city / location)
- **Notification center** (lightweight):
  - Show recent communications (emails sent)
  - "Check your email for..." reminders

#### 4. Screening flow polish

- **Progress bar**: Smooth animation between steps
- **Page transitions**: Subtle slide/fade animations
- **Form validation**: Real-time validation (not just on submit)
- **Autosave**: Save partially filled forms
- **Keyboard navigation**: Tab order, Enter to submit
- **Exit confirmation**: "Are you sure? Your progress will be saved." when navigating away mid-form

#### 5. Document upload polish

- **Drag-and-drop visual feedback**: Animated drop zone border
- **Upload progress**: Smooth progress bar animation
- **Image preview**: Smooth fade-in on load
- **Camera capture**: Better mobile camera UX
- **Video recording**: Countdown before recording starts (3-2-1)
- **Thumbnail generation**: Generate preview thumbnails for uploaded images

#### 6. Mobile-first responsive design

All pages must work perfectly on mobile (375px width):
- **Touch targets**: All buttons at least 44x44px
- **Font sizes**: Minimum 16px for inputs (prevents iOS zoom)
- **Spacing**: Adequate padding for thumb reachability
- **Scroll behavior**: Smooth scroll, no unexpected content shifts
- **Bottom sheet dialogs**: Use bottom sheets instead of centered modals on mobile
- **Swipe gestures**: Swipe between screening steps (optional)

#### 7. Loading and error states

- **Global loading**: Full-page Laundryheap-branded spinner for initial load
- **Component loading**: Skeleton screens for all data-dependent components
- **API errors**: Toast notifications with retry option
- **Network offline**: Banner "You're offline. Some features may be unavailable."
- **Session expired**: Auto-redirect to login with message

#### 8. Accessibility

- **ARIA labels** on all interactive elements
- **Focus management**: Auto-focus first field on page load
- **Keyboard navigation**: Full keyboard support for all flows
- **Color contrast**: WCAG AA minimum for all text
- **Screen reader**: Important status messages announced via `aria-live`
- **Reduced motion**: Respect `prefers-reduced-motion`

### Backend

No backend changes today.

## Acceptance Criteria

- [ ] Multi-step apply form works with progress saving
- [ ] OTP input handles paste and auto-advance
- [ ] Dashboard timeline is responsive (vertical mobile, horizontal desktop)
- [ ] All pages work at 375px width
- [ ] Touch targets are minimum 44px
- [ ] Loading skeletons appear for all data loading
- [ ] Error states show with retry options
- [ ] Screening form validation is real-time
- [ ] Exit confirmation prevents accidental navigation
- [ ] Video recording has countdown
- [ ] Accessibility: keyboard navigation works throughout
- [ ] Color contrast meets WCAG AA

## What's Next (Day 5)

Tomorrow we do **end-to-end integration testing** — walking through the complete flow from job creation to active driver, verifying all transitions, emails, and UI states work correctly.
