import crypto from 'node:crypto';
import { writeSync } from 'node:fs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';
import { dispatchNotifications } from '../communications/notification.service.js';
import { JWT_SECRET, jwtSignOptionsByRole } from '../../lib/jwt.js';
import logger from '../../lib/logger.js';
const CODE_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

/** Trim so .env quirks like spaces around values don't break checks. */
function nodeEnvIsProduction() {
  return String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
}

function maxCodeRequestsPerHour() {
  const raw = process.env.VERIFICATION_CODE_MAX_REQUESTS_PER_HOUR;
  if (raw !== undefined && raw !== '') {
    const n = Number.parseInt(String(raw), 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return nodeEnvIsProduction() ? 3 : 100;
}

export class DriverAuthServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'DriverAuthServiceError';
    this.statusCode = statusCode;
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function createVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashVerificationCode(email, code) {
  const salt = String(process.env.VERIFICATION_CODE_SALT || JWT_SECRET);
  return crypto.createHash('sha256').update(`${salt}:${email}:${code}`).digest('hex');
}

function hasResendApiKey() {
  return Boolean(String(process.env.RESEND_API_KEY || '').trim());
}

/**
 * When true, logs plaintext OTP to stdout.
 * - Logs in non-production, or when Resend is not configured (email cannot be delivered), or when LOG_VERIFICATION_CODES=1.
 * - Set SUPPRESS_CONSOLE_OTP=1 to disable even when Resend is missing (e.g. strict prod-like local test).
 */
function shouldLogVerificationOtp() {
  const suppress = String(process.env.SUPPRESS_CONSOLE_OTP || '').toLowerCase();
  if (suppress === '1' || suppress === 'true' || suppress === 'yes') {
    return false;
  }
  if (!hasResendApiKey()) {
    return true;
  }
  if (!nodeEnvIsProduction()) {
    return true;
  }
  const v = String(process.env.LOG_VERIFICATION_CODES || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/** Sync writes to stdout + stderr; logger may be hidden if LOG_LEVEL=error. */
function emitOtpToTerminal(email, code) {
  const line = `\n[driver-auth] OTP for ${email}: ${code}\n`;
  const buf = Buffer.from(line, 'utf8');
  for (const stream of [process.stdout, process.stderr]) {
    try {
      const fd = stream.fd;
      if (typeof fd === 'number' && fd >= 0) {
        writeSync(fd, buf);
      } else {
        stream.write(line);
      }
    } catch {
      try {
        stream.write(line);
      } catch {
        // ignore
      }
    }
  }
  // Bypasses pino level filtering — always visible in the backend terminal
  // eslint-disable-next-line no-console -- intentional dev OTP visibility
  console.error(line.trimEnd());
  logger.warn({ msg: `[driver-auth] OTP (copy this): ${code}`, email, code });
}

export async function requestVerificationCode(rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    throw new DriverAuthServiceError('Email is required.', 400);
  }

  const requestedSince = new Date(Date.now() - 60 * 60 * 1000);
  const recentRequests = await prisma.verificationCode.count({
    where: {
      email,
      createdAt: { gte: requestedSince },
    },
  });

  const limit = maxCodeRequestsPerHour();
  if (limit > 0 && recentRequests >= limit) {
    throw new DriverAuthServiceError('Too many verification code requests. Try again later.', 429);
  }

  const applications = await prisma.application.findMany({
    where: { email },
    select: { id: true, firstName: true, lastName: true, phone: true },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });

  if (!applications.length) {
    throw new DriverAuthServiceError('No application found.', 404);
  }

  const code = createVerificationCode();
  const codeHash = hashVerificationCode(email, code);
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.verificationCode.updateMany({
      where: { email, usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.verificationCode.create({
      data: {
        email,
        code: codeHash,
        expiresAt,
      },
    });
  });

  if (shouldLogVerificationOtp()) {
    emitOtpToTerminal(email, code);
  }

  const latestApp = applications[0];
  void dispatchNotifications(
    'auth.verification_code',
    {
      id: latestApp.id,
      email,
      phone: latestApp.phone || null,
      firstName: latestApp.firstName || '',
      lastName: latestApp.lastName || '',
    },
    { code }
  ).catch((error) => {
    logger.error({ msg: '[driver-auth] notification dispatch failed', error: error?.message || error });
  });

  const payload = { sent: true };
  // Non-production only: lets you copy the code from the API response / driver UI without relying on server logs.
  if (!nodeEnvIsProduction()) {
    payload.devOtp = code;
  }
  return payload;
}

export async function verifyCode(rawEmail, rawCode) {
  const email = normalizeEmail(rawEmail);
  const code = String(rawCode || '').trim();

  if (!email || !code) {
    throw new DriverAuthServiceError('Email and code are required.', 400);
  }

  const latestCode = await prisma.verificationCode.findFirst({
    where: { email, usedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!latestCode) {
    throw new DriverAuthServiceError('Invalid or expired code.', 400);
  }
  if (latestCode.attempts >= MAX_ATTEMPTS) {
    throw new DriverAuthServiceError('Invalid or expired code.', 400);
  }
  if (latestCode.expiresAt < new Date()) {
    throw new DriverAuthServiceError('Invalid or expired code.', 400);
  }

  const codeHash = hashVerificationCode(email, code);
  if (latestCode.code !== codeHash) {
    await prisma.verificationCode.update({
      where: { id: latestCode.id },
      data: { attempts: { increment: 1 } },
    });
    throw new DriverAuthServiceError('Invalid or expired code.', 400);
  }

  const application = await prisma.application.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      currentStage: true,
    },
  });

  if (!application) {
    throw new DriverAuthServiceError('No application found.', 404);
  }

  await prisma.verificationCode.update({
    where: { id: latestCode.id },
    data: { usedAt: new Date() },
  });

  const token = jwt.sign(
    { email, role: 'driver', applicationId: application.id },
    JWT_SECRET,
    jwtSignOptionsByRole.driver
  );

  return {
    token,
    application,
  };
}

export async function getDriverSession(emailFromJwt) {
  const email = normalizeEmail(emailFromJwt);
  if (!email) {
    throw new DriverAuthServiceError('Invalid session.', 401);
  }

  const application = await prisma.application.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      currentStage: true,
      createdAt: true,
    },
  });

  if (!application) {
    throw new DriverAuthServiceError('No application found.', 404);
  }

  return { application };
}
