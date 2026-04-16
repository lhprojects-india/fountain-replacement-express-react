# Week 8 — Day 2: Email Templates & Branding

## Context

The full pipeline is functionally complete from apply → active/rejected. Now we need professional email content for every touchpoint.

**Previous day**: First block assignment — scheduling, pass/fail, active transition, block queue.

**What we're building today**: Professional HTML email templates for every stage transition, with Laundryheap branding, responsive design, and proper variable handling.

## Today's Focus

1. Email template HTML base layout
2. Content for all stage transition emails
3. Responsive email design
4. Template variable system improvements
5. Email preview in admin

## Detailed Changes

### Backend

#### 1. HTML email base template

Create `apps/backend/src/modules/communications/templates/base-layout.html`:

A responsive HTML email layout with:
- Laundryheap logo header
- Content area
- Footer with company info, unsubscribe link, social media
- Mobile-responsive (max-width tables, inline CSS)
- Works in Gmail, Outlook, Apple Mail

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
    <tr><td align="center" style="padding:20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;">
        <!-- Logo header -->
        <tr><td style="padding:24px;text-align:center;background:#00B4D8;border-radius:8px 8px 0 0;">
          <img src="{{logoUrl}}" alt="Laundryheap" width="180">
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:32px 24px;">
          {{content}}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 24px;border-top:1px solid #eee;color:#888;font-size:12px;">
          <p>Laundryheap Ltd. • {{companyAddress}}</p>
          <p>This email was sent regarding your driver application.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

#### 2. Template rendering engine

Update `email.service.js` to:
1. Load the base layout
2. Inject the specific template body into `{{content}}`
3. Replace all `{{variable}}` tokens
4. Support conditional sections: `{{#if passed}}...{{/if}}` (simple handlebars-style or just string replacement)

For simplicity, use a lightweight template engine or stick with string replacement.

#### 3. Seed/update all email templates

Update the seeded templates with professional content:

**application.received:**
- Subject: "We've Received Your Application — {{jobTitle}}"
- Body: Welcome message, what to expect, timeline info, dashboard link

**stage.screening:**
- Subject: "Action Required: Begin Your Screening"
- Body: Congratulations on acceptance, explain screening process, clear CTA button "Start Screening", timeline

**stage.contract_sent:**
- Subject: "Your Contract is Ready for Signing"
- Body: Contract details, signing instructions, deadline, CTA "Sign Contract"

**stage.documents_pending:**
- Subject: "Upload Your Documents to Continue"
- Body: Contract signed confirmation, required documents list, CTA "Upload Documents"

**stage.payment_details_pending:**
- Subject: "Submit Your Payment Details"
- Body: Documents approved, payment requirements, CTA "Submit Details"

**stage.onboarding_call:**
- Subject: "Schedule Your Onboarding Call"
- Body: Next steps, what to prepare, how the call works

**stage.questionnaire:**
- Subject: "Complete Your Assessment"
- Body: Assessment instructions, preparation tips, passing score info, CTA "Take Assessment"

**stage.approved:**
- Subject: "Congratulations! You're Approved 🎉"
- Body: Welcome message, first block info, what's next, team intro

**stage.rejected:**
- Subject: "Update on Your Application"
- Body: Respectful rejection, reason (generic), thank you, future opportunities mention

**stage.first_block_assigned:**
- Subject: "Your First Block Details"
- Body: Date, time, location, what to bring, what to expect, contact for questions

**auth.verification_code:**
- Subject: "Your Verification Code — {{code}}"
- Body: Code prominently displayed, expiry note, didn't request this? ignore instruction

#### 4. SMS template updates

Ensure SMS templates are concise (160 chars where possible):
- Application received: keep under 160 chars
- Screening: short + dashboard URL (use URL shortener if needed)
- Verification code: "Your code: {{code}}. Expires in 10 min."

### Frontend (Admin Web)

#### 1. Enhanced template editor

Update `EmailTemplateManager.jsx`:
- **Rich preview**: Shows the rendered email with base layout + content
- **Variable helper**: Autocomplete when typing `{{`
- **HTML editor**: Syntax highlighting for HTML content
- **Mobile preview toggle**: Show email at 375px width
- **Test send**: Send preview to any email address

#### 2. Template versioning (lightweight)

When a template is updated, store the previous version:
- Add `version` field to MessageTemplate
- On update: increment version, keep old content accessible
- Admin can view previous versions

This is optional polish — implement if time allows.

### Frontend (Driver Web)

No changes today — all driver-facing updates are in the emails themselves.

## Acceptance Criteria

- [ ] Base HTML email layout renders correctly in Gmail, Outlook, Apple Mail
- [ ] All 11 email templates have professional content
- [ ] Variables render correctly in all templates
- [ ] CTA buttons link to correct dashboard URLs
- [ ] Emails are mobile-responsive
- [ ] SMS templates are concise
- [ ] Admin preview shows rendered email
- [ ] Test send works with all templates
- [ ] Logo displays correctly in emails
- [ ] Footer has correct company information

## What's Next (Day 3)

Tomorrow we focus on **admin dashboard refinements** — cleaning up the admin interface, improving the pipeline UX, and ensuring all the new features work cohesively.
