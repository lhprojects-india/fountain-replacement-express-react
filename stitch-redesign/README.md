# Stitch Redesign Prompts

Step-by-step Stitch prompts to redesign the Laundryheap Driver Onboarding UI.

---

## How to Use

1. **Start with `00-design-system-tokens.md`** — always paste this first in a new Stitch session. It establishes the full design system, color tokens, typography, and component library that all other prompts reference.

2. **Paste each numbered prompt in order** in Stitch, one at a time. Each prompt references the design system and builds on the previous screens.

3. **Iterate per screen** — after Stitch generates a screen, refine it before moving to the next. Keep the output consistent with the design system.

---

## Prompt Index

### Foundation
| File | Screen | App |
|------|--------|-----|
| [`00-design-system-tokens.md`](./00-design-system-tokens.md) | Design System, Colors, Typography, Components | Both |

### Driver Web App (Mobile-First, 390px)
| File | Screen | Notes |
|------|--------|-------|
| [`01-driver-job-application.md`](./01-driver-job-application.md) | Job Application Form | Public, multi-step |
| [`02-driver-login-otp.md`](./02-driver-login-otp.md) | Login (OTP Flow) | Email + 6-digit code |
| [`03-driver-dashboard.md`](./03-driver-dashboard.md) | Driver Dashboard | Stage timeline + actions |
| [`04-driver-screening-landing.md`](./04-driver-screening-landing.md) | Screening Hub | Step checklist |
| [`05-driver-policy-pages.md`](./05-driver-policy-pages.md) | Policy & Acknowledgement Pages | Reusable template |
| [`06-driver-availability-facilities.md`](./06-driver-availability-facilities.md) | Availability Grid + Facility Picker | Interactive selections |
| [`07-driver-acknowledgements-summary.md`](./07-driver-acknowledgements-summary.md) | Acknowledgements Summary | Screening completion |
| [`08-driver-document-upload.md`](./08-driver-document-upload.md) | Document Upload | Upload + status review |
| [`09-driver-payment-questionnaire.md`](./09-driver-payment-questionnaire.md) | Payment Details + Questionnaire | Two late-stage screens |

### Admin Panel (Desktop-First, 1280px)
| File | Screen | Notes |
|------|--------|-------|
| [`10-admin-login-shell.md`](./10-admin-login-shell.md) | Login + App Shell | Sidebar + header |
| [`11-admin-home-dashboard.md`](./11-admin-home-dashboard.md) | Home Dashboard | KPIs + activity feed |
| [`12-admin-pipeline.md`](./12-admin-pipeline.md) | Application Pipeline | Table with filters |
| [`13-admin-application-detail.md`](./13-admin-application-detail.md) | Application Detail | Tabs: Overview, Docs, Notes, History |
| [`14-admin-kanban-calls.md`](./14-admin-kanban-calls.md) | Kanban Board + Call Queue | Board view + calls |
| [`15-admin-analytics.md`](./15-admin-analytics.md) | Analytics Dashboard | Charts + metrics |
| [`16-admin-settings.md`](./16-admin-settings.md) | Settings | Regions, Templates, Team, etc. |
| [`17-admin-document-reviewer.md`](./17-admin-document-reviewer.md) | Document Reviewer + Transition Dialog | Modal components |

---

## Brand Quick Reference

| Token | Hex | Use |
|-------|-----|-----|
| Primary Blue | `#0890F1` | CTAs, links, active states |
| Deep Navy | `#202B93` | Headings, admin sidebar |
| Teal | `#2FCCC0` | Success, completion, focus |
| Light Blue | `#BAEBFF` | Driver app background |
| Light Teal | `#93ECE5` | Gradient end, secondary bg |
| Yellow | `#FFD06D` | Warnings, badges |
| Pink | `#EF8EA2` | Errors, destructive |

**Driver gradient:** `linear-gradient(135deg, #BAEBFF, #93ECE5)`  
**Admin gradient:** `linear-gradient(135deg, #202B93, #2FCCC0)`  
**Font:** Inter — 700 display, 600 headings, 500 labels, 400 body  
**Radius:** 12px cards, 8px inputs/buttons, 999px pills  
