import prisma from '../../lib/prisma.js';
import {
  normalizeCity,
  dbRowsToLegacyList,
  buildFeeStructureCreatesFromLegacy,
} from '../../lib/feeStructureMapper.js';
import { toDriverApiShape } from '../../lib/driverSerialize.js';
import { pollPendingContracts } from '../../modules/integrations/dropbox-sign/polling.service.js';
import logger from '../../lib/logger.js';

export const getAdminDashboardData = async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            city: { select: { id: true, city: true, cityCode: true } },
          },
        },
        driver: {
          include: {
            availabilities: true,
            facilities: true,
            onboardingSteps: true,
          },
        },
      },
    });

    const payload = applications.map((app) => ({
      id: app.id,
      email: app.email,
      firstName: app.firstName,
      lastName: app.lastName,
      phone: app.phone,
      city: app.city,
      currentStage: app.currentStage,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      job: app.job,
      driver: app.driver ? toDriverApiShape(app.driver) : null,
    }));

    return res.status(200).json({ success: true, applications: payload });
  } catch (error) {
    logger.error({ msg: 'Error fetching admin dashboard data', error });
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
    logger.error({ msg: 'Error fetching admin data', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateApplicationStatus = async (req, res) => {
  const { email, status, adminNotes } = req.validatedBody || req.body;

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
    logger.error({ msg: 'Error updating application status', error });
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
      prisma.verification.deleteMany({ where: { email: normalizedEmail } }),
      prisma.report.deleteMany({ where: { email: normalizedEmail } }),
      prisma.driver.deleteMany({ where: { email: normalizedEmail } }),
    ]);

    return res.status(200).json({ success: true, message: 'Application and related data deleted' });
  } catch (error) {
    logger.error({ msg: 'Error deleting application', error });
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
    logger.error({ msg: 'Error fetching admins', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const setAdmin = async (req, res) => {
  const { email, role, name } = req.validatedBody || req.body;

  try {
    const admin = await prisma.admin.upsert({
      where: { email: email.toLowerCase().trim() },
      update: { role, name, updatedAt: new Date() },
      create: { email: email.toLowerCase().trim(), role, name }
    });
    return res.status(200).json({ success: true, admin });
  } catch (error) {
    logger.error({ msg: 'Error setting admin', error });
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
    logger.error({ msg: 'Error fetching fee structures', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const upsertFeeStructures = async (req, res) => {
  const body = req.validatedBody || req.body;
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
    logger.error({ msg: 'Error saving fee structures', error });
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
    logger.error({ msg: 'Error deleting fee structures', error });
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
    logger.error({ msg: 'Error fetching facilities', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const upsertFacility = async (req, res) => {
  const body = req.validatedBody || req.body;
  const facilityCode = String(body?.facility || '').trim().toUpperCase();
  const city = String(body?.city || '').trim();
  const address = String(body?.address || '').trim();

  if (!facilityCode || !city || !address) {
    return res.status(400).json({ success: false, message: 'City, facility code, and address are required' });
  }

  try {
    await prisma.facility.upsert({
      where: { facilityCode },
      update: {
        city,
        address,
      },
      create: {
        facilityCode,
        city,
        address,
      },
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ msg: 'Error saving facility', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteFacility = async (req, res) => {
  const raw = req.params.facilityCode;
  const facilityCode = String(raw || '').trim().toUpperCase();

  if (!facilityCode) {
    return res.status(400).json({ success: false, message: 'Facility code is required' });
  }

  try {
    await prisma.facility.delete({ where: { facilityCode } });
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ msg: 'Error deleting facility', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const pollContractStatusHandler = async (_req, res) => {
  try {
    const result = await pollPendingContracts(prisma);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    logger.error({ msg: 'Error polling contract status', error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
