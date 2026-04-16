import { Resend } from 'resend';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../lib/prisma.js';
import { PRODUCT_DISPLAY_NAME } from '../../lib/product-name.js';
import logger from '../../lib/logger.js';
import { logCommunication } from './communication.service.js';

const FROM_EMAIL =
  process.env.FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const APP_BASE_URL = process.env.DRIVER_DASHBOARD_URL || process.env.APP_BASE_URL || '';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_LAYOUT_PATH = path.resolve(__dirname, './templates/base-layout.html');
let baseLayoutCache = null;

const STAGE_LABELS = {
  applied: 'Applied',
  pending_review: 'Pending Review',
  screening: 'Screening',
  acknowledgements: 'Acknowledgements',
  contract_sent: 'Contract Sent',
  contract_signed: 'Contract Signed',
  documents_pending: 'Documents Pending',
  documents_under_review: 'Documents Under Review',
  payment_details_pending: 'Payment Details Pending',
  onboarding_call: 'Onboarding Call',
  questionnaire: 'Questionnaire',
  decision_pending: 'Decision Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export function renderTemplate(template, variables = {}) {
  let input = String(template || '');
  input = input.replace(/\{\{#if\s+([a-zA-Z0-9_]+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g, (_m, key, block) => {
    const value = variables[key];
    return value ? block : '';
  });
  return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = variables[key];
    return value == null ? '' : String(value);
  });
}

async function getBaseLayoutTemplate() {
  if (baseLayoutCache) return baseLayoutCache;
  try {
    baseLayoutCache = await readFile(BASE_LAYOUT_PATH, 'utf8');
  } catch (error) {
    logger.warn({ msg: '[email] failed to load base layout, using inline fallback', error: error?.message || error });
    baseLayoutCache = '<html><body>{{content}}</body></html>';
  }
  return baseLayoutCache;
}

export async function renderEmailHtml(templateBody, variables = {}) {
  const body = renderTemplate(templateBody || '', variables);
  const baseLayout = await getBaseLayoutTemplate();
  return renderTemplate(baseLayout, { ...variables, content: body });
}

function getResendClient() {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) return null;
  try {
    return new Resend(apiKey);
  } catch (error) {
    logger.error({ msg: '[email] failed to initialize resend client', error: error?.message || error });
    return null;
  }
}

export async function sendEmail({ to, subject, html, text }) {
  const resend = getResendClient();
  if (!resend) {
    logger.warn({ msg: '[email] RESEND_API_KEY missing; skipping send', to, subject });
    return { messageId: null, status: 'skipped', error: 'RESEND_API_KEY missing' };
  }

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: html || undefined,
      text: text || undefined,
    });
    if (response?.error) {
      logger.error({ msg: '[email] resend send error', error: response.error });
      return {
        messageId: null,
        status: 'failed',
        error: response.error.message || 'Email provider failed',
      };
    }

    return {
      messageId: response?.data?.id || null,
      status: 'sent',
      error: null,
    };
  } catch (error) {
    logger.error({ msg: '[email] unexpected send failure', error });
    return {
      messageId: null,
      status: 'failed',
      error: error?.message || 'Unknown send error',
    };
  }
}

function buildGlobalVariables(recipientEmail, variables = {}) {
  const firstName = variables.firstName || '';
  const lastName = variables.lastName || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const currentStage = variables.currentStage || null;
  return {
    firstName,
    lastName,
    fullName,
    email: recipientEmail || variables.email || '',
    jobTitle: variables.jobTitle || '',
    regionName: variables.regionName || '',
    currentStage,
    stageLabelHuman: variables.stageLabelHuman || (currentStage ? STAGE_LABELS[currentStage] : ''),
    dashboardUrl: variables.dashboardUrl || APP_BASE_URL || '',
    supportUrl: variables.supportUrl || process.env.SUPPORT_URL || APP_BASE_URL || '',
    unsubscribeUrl: variables.unsubscribeUrl || process.env.UNSUBSCRIBE_URL || APP_BASE_URL || '',
    logoUrl:
      variables.logoUrl ||
      process.env.EMAIL_LOGO_URL ||
      'https://images.ctfassets.net/whz1awz2x4s7/4X0fR5B3hATQCy5X2wS0pM/3fdd9eefeb6f5e145470f79f87edace6/laundryheap_logo_white.png',
    companyAddress: variables.companyAddress || process.env.COMPANY_ADDRESS || '6th Floor, 2 Kingdom Street, London, W2 6BD',
    companyName: variables.companyName || PRODUCT_DISPLAY_NAME,
    ...variables,
  };
}

async function inferApplicationId(recipientEmail, variables = {}) {
  if (variables.applicationId && Number.isInteger(Number(variables.applicationId))) {
    return Number(variables.applicationId);
  }
  if (!recipientEmail) return null;
  const app = await prisma.application.findFirst({
    where: { email: recipientEmail },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  return app?.id || null;
}

export async function sendTemplatedEmail(templateEventKey, recipientEmail, variables = {}) {
  const eventKey = String(templateEventKey || '').trim();
  const email = String(recipientEmail || '').trim().toLowerCase();
  if (!eventKey || !email) {
    return { status: 'failed', reason: 'Missing event key or recipient email' };
  }

  const template = await prisma.messageTemplate.findFirst({
    where: {
      eventKey,
      channel: 'email',
      locale: 'en',
      isActive: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!template) {
    const msg = `Missing active email template for event "${eventKey}"`;
    logger.warn({ msg: '[email] missing active template', detail: msg });
    await logCommunication({
      applicationId: await inferApplicationId(email, variables),
      channel: 'email',
      templateEventKey: eventKey,
      recipientEmail: email,
      subject: null,
      body: null,
      providerMessageId: null,
      status: 'failed',
      errorMessage: msg,
      sentAt: null,
    });
    return { status: 'failed', reason: msg };
  }

  const mergedVars = buildGlobalVariables(email, variables);
  const subject = renderTemplate(template.subject || '', mergedVars);
  const body = await renderEmailHtml(template.body || '', mergedVars);
  const result = await sendEmail({
    to: email,
    subject,
    html: body,
    text: body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  });

  await logCommunication({
    applicationId: await inferApplicationId(email, variables),
    channel: 'email',
    templateEventKey: eventKey,
    recipientEmail: email,
    subject,
    body,
    providerMessageId: result.messageId,
    status: result.status,
    errorMessage: result.error || null,
    sentAt: result.status === 'sent' ? new Date() : null,
  });

  return result;
}
