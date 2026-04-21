import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma.js';
import { adminAuth } from '../../lib/firebase-admin.js';
import { upsertOnboardingStep } from '../../lib/driverSerialize.js';
import { JWT_SECRET, jwtSignOptionsByRole } from '../../lib/jwt.js';
import logger from '../../lib/logger.js';

function getBootstrapSuperAdminEmail() {
  return String(process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL || '')
    .toLowerCase()
    .trim();
}

export const checkFountainEmail = async (req, res) => {
  const { email } = req.validatedBody || req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const applicant = await prisma.fountainApplicant.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (applicant) {
      return res.status(200).json({
        exists: true,
        phone: applicant.phone,
        name: applicant.name,
        applicantId: applicant.applicantId,
        city: applicant.city,
        country: applicant.country,
        funnelId: applicant.funnelId,
      });
    }

    return res.status(200).json({ exists: false });
  } catch (error) {
    logger.error({ msg: 'Error checking email', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const verifyApplicantPhone = async (req, res) => {
  const { email, phone } = req.validatedBody || req.body;

  if (!email || !phone) {
    return res.status(400).json({ success: false, message: 'Email and phone are required' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const applicant = await prisma.fountainApplicant.findUnique({
      where: { email: normalizedEmail },
    });

    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found' });
    }

    const normalize = (value) => value.replace(/[^\d+]/g, '');
    if (normalize(applicant.phone) !== normalize(phone)) {
      return res.status(400).json({ success: false, message: 'Phone number mismatch' });
    }

    const driver = await prisma.driver.upsert({
      where: { email: normalizedEmail },
      update: { updatedAt: new Date() },
      create: {
        email: normalizedEmail,
        onboardingStatus: 'started',
      },
    });
    await upsertOnboardingStep(prisma, driver.id, 'verify', true, new Date());

    const token = jwt.sign(
      { email: normalizedEmail, role: 'driver' },
      JWT_SECRET,
      jwtSignOptionsByRole.driver
    );

    return res.status(200).json({
      success: true,
      isValid: true,
      applicant: {
        email: applicant.email,
        phone: applicant.phone,
        name: applicant.name,
        applicantId: applicant.applicantId,
        stage: applicant.stage,
        status: applicant.status,
        city: applicant.city,
      },
      token,
    });
  } catch (error) {
    logger.error({ msg: 'Error verifying phone', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const adminGoogleLogin = async (req, res) => {
  const { idToken } = req.validatedBody || req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Firebase ID token is required' });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase().trim();

    if (!email) {
      return res.status(401).json({ success: false, message: 'Could not retrieve email from Google account' });
    }

    let admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      const bootstrapEmail = getBootstrapSuperAdminEmail();
      if (bootstrapEmail && email === bootstrapEmail) {
        const adminCount = await prisma.admin.count();
        if (adminCount === 0) {
          admin = await prisma.admin.create({
            data: {
              email,
              role: 'super_admin',
              name: decoded.name || 'Bootstrap Super Admin',
            },
          });
          logger.info({ msg: 'Bootstrap super admin created from Google login', email });
        }
      }
    }

    if (!admin) {
      return res.status(403).json({ success: false, message: 'Access denied. This Google account is not authorised as an admin.' });
    }

    const token = jwt.sign(
      { email: admin.email, role: 'admin' },
      JWT_SECRET,
      jwtSignOptionsByRole.admin
    );

    return res.status(200).json({
      success: true,
      token,
      admin: {
        email: admin.email,
        role: admin.role,
        name: admin.name,
      },
    });
  } catch (error) {
    logger.error({ msg: 'Error verifying Google token', error });
    return res.status(401).json({ success: false, message: 'Invalid or expired Google token.' });
  }
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.validatedBody || req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (admin.password) {
      const isBcryptHash = admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$');
      const isValid = isBcryptHash
        ? await bcrypt.compare(password, admin.password)
        : admin.password === password;

      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      if (!isBcryptHash) {
        // Seamless migration path: upgrade plaintext passwords on successful login.
        const hashedPassword = await bcrypt.hash(password, 12);
        await prisma.admin.update({
          where: { email: admin.email },
          data: { password: hashedPassword },
        });
      }
    }

    // Generate JWT for admin
    const token = jwt.sign(
      { email: admin.email, role: 'admin' },
      JWT_SECRET,
      jwtSignOptionsByRole.admin
    );

    return res.status(200).json({
      success: true,
      token,
      admin: {
        email: admin.email,
        role: admin.role,
        name: admin.name
      }
    });
  } catch (error) {
    logger.error({ msg: 'Error admin login', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
