import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';
import { adminAuth } from '../../lib/firebase-admin.js';
import { upsertOnboardingStep } from '../../lib/driverSerialize.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const checkFountainEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const applicant = await prisma.fountainApplicant.findUnique({
      where: { email: email.toLowerCase().trim() }
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
    console.error('Error checking email:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const verifyApplicantPhone = async (req, res) => {
  const { email, phone } = req.body;

  if (!email || !phone) {
    return res.status(400).json({ success: false, message: 'Email and phone are required' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const applicant = await prisma.fountainApplicant.findUnique({
      where: { email: normalizedEmail }
    });

    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found' });
    }

    // Basic normalization for comparison
    const normalize = (p) => p.replace(/[^\d+]/g, '');
    if (normalize(applicant.phone) !== normalize(phone)) {
      return res.status(400).json({ success: false, message: 'Phone number mismatch' });
    }

    // Create or update driver record; mark verify step so progress survives refresh
    const driver = await prisma.driver.upsert({
      where: { email: normalizedEmail },
      update: { updatedAt: new Date() },
      create: {
        email: normalizedEmail,
        onboardingStatus: 'started',
      },
    });
    await upsertOnboardingStep(prisma, driver.id, 'verify', true, new Date());

    // Generate JWT
    const token = jwt.sign(
      { email: normalizedEmail, role: 'driver' },
      JWT_SECRET,
      { expiresIn: '7d' }
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
      token
    });
  } catch (error) {
    console.error('Error verifying phone:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const adminGoogleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Firebase ID token is required' });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase().trim();

    if (!email) {
      return res.status(401).json({ success: false, message: 'Could not retrieve email from Google account' });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      return res.status(403).json({ success: false, message: 'Access denied. This Google account is not authorised as an admin.' });
    }

    const token = jwt.sign(
      { email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1d' }
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
    console.error('Error verifying Google token:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired Google token.' });
  }
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

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

    // In a real scenario, use bcrypt to compare passwords
    // For now, if no password is set, allow login for existing admins (migration phase)
    if (admin.password && admin.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT for admin
    const token = jwt.sign(
      { email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1d' }
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
    console.error('Error admin login:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
