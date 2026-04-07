import prisma from '../../lib/prisma.js';
import {
  normalizeCity,
  dbRowsToLegacyList,
  buildFeeStructureCreatesFromLegacy,
} from '../../lib/feeStructureMapper.js';
import { toDriverApiShape } from '../../lib/driverSerialize.js';

export const getAdminDashboardData = async (req, res) => {
  try {
    // Fetch all applicants and their linked driver profiles
    const applicants = await prisma.fountainApplicant.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    const drivers = await prisma.driver.findMany({
      include: {
        availabilities: true,
        facilities: true,
        onboardingSteps: true,
      },
    });
    const driversMap = drivers.reduce((acc, d) => {
      acc[d.email] = toDriverApiShape(d);
      return acc;
    }, {});

    // Merge data for the dashboard
    const applications = applicants.map((app) => ({
      ...app,
      ...(driversMap[app.email] || {}),
      applicantId: app.applicantId,
    }));

    return res.status(200).json({ success: true, applications });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAdminData = async (req, res) => {
  const { email } = req.user;

  try {
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    return res.status(200).json({ success: true, admin });
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateApplicationStatus = async (req, res) => {
  const { email, status, adminNotes } = req.body;

  if (!email || !status) {
    return res.status(400).json({ success: false, message: 'Email and status are required' });
  }

  try {
    const updatedDriver = await prisma.driver.update({
      where: { email },
      data: {
        status,
        adminNotes,
        statusUpdatedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        availabilities: true,
        facilities: true,
        onboardingSteps: true,
      },
    });

    return res.status(200).json({ success: true, driver: toDriverApiShape(updatedDriver) });
  } catch (error) {
    console.error('Error updating application status:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteApplication = async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Use a transaction to delete from all related tables
    await prisma.$transaction([
      prisma.fountainApplicant.deleteMany({ where: { email: normalizedEmail } }),
      prisma.verification.deleteMany({ where: { email: normalizedEmail } }),
      prisma.report.deleteMany({ where: { email: normalizedEmail } }),
      prisma.driver.deleteMany({ where: { email: normalizedEmail } }),
    ]);

    return res.status(200).json({ success: true, message: 'Application and related data deleted' });
  } catch (error) {
    console.error('Error deleting application:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ success: true, admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const setAdmin = async (req, res) => {
  const { email, role, name } = req.body;

  try {
    const admin = await prisma.admin.upsert({
      where: { email: email.toLowerCase().trim() },
      update: { role, name, updatedAt: new Date() },
      create: { email: email.toLowerCase().trim(), role, name }
    });
    return res.status(200).json({ success: true, admin });
  } catch (error) {
    console.error('Error setting admin:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAllFeeStructures = async (req, res) => {
  try {
    const rows = await prisma.feeStructure.findMany({
      include: {
        details: { orderBy: { id: 'asc' } },
      },
      orderBy: [{ city: 'asc' }, { vehicleType: 'asc' }],
    });
    const feeStructures = dbRowsToLegacyList(rows);
    return res.status(200).json({ success: true, feeStructures });
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const upsertFeeStructures = async (req, res) => {
  const body = req.body;
  if (!body?.city?.trim()) {
    return res.status(400).json({ success: false, message: 'City is required' });
  }
  const city = normalizeCity(body.city);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.feeStructure.deleteMany({ where: { city } });
      const creates = buildFeeStructureCreatesFromLegacy(body);
      for (const data of creates) {
        await tx.feeStructure.create({ data });
      }
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving fee structures:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteFeeStructuresForCity = async (req, res) => {
  const raw = req.params.city;
  if (!raw) {
    return res.status(400).json({ success: false, message: 'City is required' });
  }
  const city = normalizeCity(decodeURIComponent(raw));
  try {
    await prisma.feeStructure.deleteMany({ where: { city } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting fee structures:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAllFacilities = async (req, res) => {
  try {
    const facilities = await prisma.facility.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return res.status(200).json({ success: true, facilities });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
