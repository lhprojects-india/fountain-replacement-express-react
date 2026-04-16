import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PRODUCT_DISPLAY_NAME } from '../src/lib/product-name.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const prisma = (await import('../src/lib/prisma.js')).default;

const templates = [
  {
    eventKey: 'application.received',
    subject: "We've Received Your Application - {{jobTitle}}",
    body: `<p style="margin:0 0 12px;">Hi {{firstName}},</p>
<p style="margin:0 0 12px;">Thank you for applying for the <strong>{{jobTitle}}</strong> role in {{regionName}}.</p>
<p style="margin:0 0 16px;">Our team has received your application and will review it shortly. We will email you again as soon as your status changes.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 8px;">
  <tr><td style="background:#00B4D8;border-radius:6px;padding:10px 16px;">
    <a href="{{dashboardUrl}}" style="color:#ffffff;text-decoration:none;font-weight:600;">Open dashboard</a>
  </td></tr>
</table>
<p style="margin:8px 0 0;color:#4b5563;">Expected initial review timeline: 1-3 business days.</p>`,
  },
  {
    eventKey: 'stage.screening',
    subject: 'Action Required: Begin Your Screening',
    body: `<p style="margin:0 0 12px;">Hi {{firstName}},</p>
<p style="margin:0 0 12px;">Great news - your application has progressed to <strong>Screening</strong>.</p>
<p style="margin:0 0 16px;">Please complete all screening steps to move forward. Most applicants finish this in under 20 minutes.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 8px;">
  <tr><td style="background:#00B4D8;border-radius:6px;padding:10px 16px;">
    <a href="{{dashboardUrl}}" style="color:#ffffff;text-decoration:none;font-weight:600;">Start screening</a>
  </td></tr>
</table>`,
  },
  {
    eventKey: 'stage.contract_sent',
    subject: 'Your Contract is Ready to Sign',
    body: `<p style="margin:0 0 12px;">Hi {{firstName}},</p>
<p style="margin:0 0 12px;">Your contract is now ready for signature.</p>
<p style="margin:0 0 12px;">Please review all sections carefully and sign as soon as possible to avoid onboarding delays.</p>
<p style="margin:0;">If you have trouble accessing the signing link, reply to this email and our team will assist you.</p>`,
  },
  {
    eventKey: 'stage.documents_pending',
    subject: 'Upload Your Documents to Continue',
    body: `<p style="margin:0 0 12px;">Hi {{firstName}},</p>
<p style="margin:0 0 12px;">Thanks for signing your contract. The next step is uploading your required documents.</p>
<p style="margin:0 0 16px;">Please make sure images are clear, not cropped, and fully readable.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 8px;">
  <tr><td style="background:#00B4D8;border-radius:6px;padding:10px 16px;">
    <a href="{{dashboardUrl}}" style="color:#ffffff;text-decoration:none;font-weight:600;">Upload documents</a>
  </td></tr>
</table>`,
  },
  {
    eventKey: 'stage.payment_details_pending',
    subject: 'Submit Your Payment Details',
    body: `<p style="margin:0 0 12px;">Hi {{firstName}},</p>
<p style="margin:0 0 12px;">Your documents have been approved. Please submit your payment details so we can complete onboarding.</p>
<p style="margin:0 0 16px;">Your information is encrypted and used only for payout processing.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 8px;">
  <tr><td style="background:#00B4D8;border-radius:6px;padding:10px 16px;">
    <a href="{{dashboardUrl}}" style="color:#ffffff;text-decoration:none;font-weight:600;">Submit details</a>
  </td></tr>
</table>`,
  },
  {
    eventKey: 'stage.onboarding_call',
    subject: 'Schedule Your Onboarding Call',
    body: `<p style="margin:0 0 12px;">Hi {{firstName}},</p>
<p style="margin:0 0 12px;">Your application is ready for the onboarding call stage.</p>
<p style="margin:0 0 12px;">Please be prepared with your phone nearby and enough time for a short call with our team.</p>
<p style="margin:0;">Check your dashboard for your current call status and next instructions.</p>`,
  },
  {
    eventKey: 'stage.questionnaire',
    subject: 'Complete Your Assessment',
    body: `<p style="margin:0 0 12px;">Hi {{firstName}},</p>
<p style="margin:0 0 12px;">The next step is your driver assessment.</p>
<p style="margin:0 0 16px;">Please complete it in one sitting and review each question carefully before submitting.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 8px;">
  <tr><td style="background:#00B4D8;border-radius:6px;padding:10px 16px;">
    <a href="{{dashboardUrl}}" style="color:#ffffff;text-decoration:none;font-weight:600;">Take assessment</a>
  </td></tr>
</table>`,
  },
  {
    eventKey: 'stage.approved',
    subject: "Congratulations! You're Approved",
    body: `<p style="margin:0 0 12px;">Hi {{firstName}},</p>
<p style="margin:0 0 12px;">Congratulations - your application has been approved.</p>
<p style="margin:0 0 12px;">Your first block details will be shared shortly. Once completed successfully, your account will move to active status.</p>
<p style="margin:0;">Welcome to the {{companyName}} driver journey.</p>`,
  },
  {
    eventKey: 'stage.rejected',
    subject: 'Update on Your Application',
    body: `<p style="margin:0 0 12px;">Hi {{firstName}},</p>
<p style="margin:0 0 12px;">Thank you for your interest in {{companyName}} and the time you invested in the process.</p>
<p style="margin:0 0 12px;">After careful review, we are unable to proceed with your application at this time.</p>
<p style="margin:0;">We appreciate your effort and encourage you to apply again in the future when relevant opportunities open.</p>`,
  },
  {
    eventKey: 'stage.first_block_assigned',
    subject: 'Your First Block Details',
    body: `<p style="margin:0 0 12px;">Hi {{firstName}},</p>
<p style="margin:0 0 12px;">Your first block has been scheduled.</p>
<p style="margin:0 0 12px;"><strong>Date and time:</strong> {{firstBlockDateHuman}}</p>
<p style="margin:0 0 12px;">Please arrive on time and bring any required identification and your phone.</p>
<p style="margin:0;">If you cannot attend, contact our team immediately so we can assist.</p>`,
  },
  {
    eventKey: 'auth.verification_code',
    subject: 'Your Verification Code - {{code}}',
    body: `<p style="margin:0 0 12px;">Hi {{firstName}},</p>
<p style="margin:0 0 12px;">Use the code below to continue:</p>
<p style="margin:0 0 14px;font-size:28px;font-weight:700;letter-spacing:4px;">{{code}}</p>
<p style="margin:0 0 8px;color:#4b5563;">This code expires in 10 minutes.</p>
<p style="margin:0;color:#4b5563;">If you did not request this, you can ignore this email.</p>`,
  },
  {
    eventKey: 'stage.first_block_rescheduled',
    subject: 'Your First Block Has Been Rescheduled',
    body: `<p style="margin:0 0 12px;">Hi {{firstName}},</p>
<p style="margin:0 0 12px;">Your first block date has been updated.</p>
<p style="margin:0 0 12px;"><strong>New date and time:</strong> {{firstBlockDateHuman}}</p>
<p style="margin:0;">Please review your dashboard for the latest details.</p>`,
  },
  {
    eventKey: 'application.received',
    channel: 'sms',
    subject: null,
    body: `${PRODUCT_DISPLAY_NAME}: We received your {{jobTitle}} application. Track progress here: {{dashboardUrl}}`,
  },
  {
    eventKey: 'stage.screening',
    channel: 'sms',
    subject: null,
    body: `${PRODUCT_DISPLAY_NAME}: You are invited to screening. Start now: {{dashboardUrl}}`,
  },
  {
    eventKey: 'auth.verification_code',
    channel: 'sms',
    subject: null,
    body: 'Your code: {{code}}. Expires in 10 min.',
  },
];

try {
  for (const item of templates) {
    await prisma.messageTemplate.upsert({
      where: {
        eventKey_channel_locale: {
          eventKey: item.eventKey,
          channel: item.channel || 'email',
          locale: 'en',
        },
      },
      update: {
        subject: item.subject ?? null,
        body: item.body,
        isActive: true,
      },
      create: {
        eventKey: item.eventKey,
        channel: item.channel || 'email',
        locale: 'en',
        subject: item.subject ?? null,
        body: item.body,
        isActive: true,
      },
    });
  }
  console.log(`Seeded ${templates.length} email templates.`);
} catch (error) {
  console.error('Failed to seed email templates:', error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
