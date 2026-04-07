import prisma from '../../lib/prisma.js';
import {
  matrixToAvailabilityRows,
  normalizeStepName,
  POLICY_PARAM_TO_STEP,
  toDriverApiShape,
  upsertOnboardingStep,
} from '../../lib/driverSerialize.js';

const DRIVER_SCALAR_WHITELIST = new Set([
  'name',
  'phone',
  'city',
  'lastRoute',
  'lastRouteUpdatedAt',
  'smokingStatus',
  'hasPhysicalDifficulties',
  'status',
  'adminNotes',
  'onboardingStatus',
]);

/**
 * Pick allowed driver scalar updates from request body (snake_case keys are ignored; use camelCase).
 * @param {Record<string, unknown>} body
 */
function pickDriverScalars(body) {
  /** @type {Record<string, unknown>} */
  const data = {};
  for (const key of DRIVER_SCALAR_WHITELIST) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (data.lastRouteUpdatedAt && typeof data.lastRouteUpdatedAt === 'string') {
    data.lastRouteUpdatedAt = new Date(data.lastRouteUpdatedAt);
  }
  return data;
}

/**
 * Load driver with relations and build API payload (normalized + legacy fields for existing UI).
 * @param {string} email
 */
async function loadDriverPayload(email) {
  const driver = await prisma.driver.findUnique({
    where: { email },
    include: {
      availabilities: true,
      facilities: true,
      onboardingSteps: true,
    },
  });

  if (!driver) return null;
  return toDriverApiShape(driver);
}

export const getDriverData = async (req, res) => {
  const { email } = req.user;

  try {
    const driverPayload = await loadDriverPayload(email);

    const verification = await prisma.verification.findUnique({
      where: { email },
    });

    const applicant = await prisma.fountainApplicant.findUnique({
      where: { email },
    });

    if (!driverPayload) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    return res.status(200).json({
      success: true,
      driver: {
        ...driverPayload,
        verification,
        fountainData: applicant?.fountainData,
      },
    });
  } catch (error) {
    console.error('Error fetching driver data:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updatePersonalDetails = async (req, res) => {
  const { email } = req.user;
  const body = req.body || {};

  try {
    const driver = await prisma.driver.findUnique({ where: { email } });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const scalarUpdates = pickDriverScalars(body);
    const stepFromBody = body.step ? normalizeStepName(String(body.step)) : '';

    await prisma.$transaction(async (tx) => {
      if (Object.keys(scalarUpdates).length > 0) {
        await tx.driver.update({
          where: { email },
          data: scalarUpdates,
        });
      }

      if (Array.isArray(body.selectedFacilities)) {
        await tx.driverFacility.deleteMany({ where: { driverId: driver.id } });
        const codes = body.selectedFacilities.filter((c) => typeof c === 'string' && c.length > 0);
        if (codes.length > 0) {
          await tx.driverFacility.createMany({
            data: codes.map((facilityCode) => ({
              driverId: driver.id,
              facilityCode,
            })),
          });
        }
        await upsertOnboardingStep(tx, driver.id, 'facility_locations', true, new Date());
      }

      if (stepFromBody && stepFromBody !== 'facility_locations') {
        await upsertOnboardingStep(tx, driver.id, stepFromBody, true, new Date());
      } else if (stepFromBody === 'facility_locations' && !Array.isArray(body.selectedFacilities)) {
        await upsertOnboardingStep(tx, driver.id, 'facility_locations', true, new Date());
      }

      const touched =
        Object.keys(scalarUpdates).length > 0 ||
        Array.isArray(body.selectedFacilities) ||
        Boolean(stepFromBody);
      if (touched) {
        await tx.driver.update({
          where: { email },
          data: { updatedAt: new Date() },
        });
      }
    });

    const driverPayload = await loadDriverPayload(email);
    return res.status(200).json({ success: true, driver: driverPayload });
  } catch (error) {
    console.error('Error updating personal details:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const saveAvailability = async (req, res) => {
  const { email } = req.user;
  const { availability: matrix } = req.body;

  try {
    const driver = await prisma.driver.findUnique({ where: { email } });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.driverAvailability.deleteMany({ where: { driverId: driver.id } });
      const rows = matrixToAvailabilityRows(driver.id, matrix);
      if (rows.length > 0) {
        await tx.driverAvailability.createMany({ data: rows });
      }
      await upsertOnboardingStep(tx, driver.id, 'availability', true, new Date());
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving availability:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const saveVerification = async (req, res) => {
  const { email } = req.user;
  const body = req.body || {};

  try {
    const driver = await prisma.driver.findUnique({ where: { email } });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const verificationData = {
      vehicle: body.vehicle ?? undefined,
      licensePlate: body.licensePlate ?? undefined,
      address: body.address ?? undefined,
      city: body.city ?? undefined,
    };

    await prisma.$transaction(async (tx) => {
      await tx.verification.upsert({
        where: { email },
        update: { ...verificationData, updatedAt: new Date() },
        create: { email, ...verificationData },
      });
      await upsertOnboardingStep(tx, driver.id, 'verification', true, new Date());
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving verification:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateProgress = async (req, res) => {
  const { email } = req.user;
  const { step, data: _data } = req.body;

  try {
    const stepName = normalizeStepName(String(step || ''));
    if (!stepName) {
      return res.status(400).json({ success: false, message: 'step is required' });
    }

    const driver = await prisma.driver.findUnique({ where: { email } });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    await prisma.$transaction(async (tx) => {
      await upsertOnboardingStep(tx, driver.id, stepName, true, new Date());
      await tx.driver.update({
        where: { email },
        data: { updatedAt: new Date() },
      });
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const acknowledgePolicy = async (req, res) => {
  const { email } = req.user;
  const { policy } = req.params;

  try {
    const stepName = POLICY_PARAM_TO_STEP[policy];
    if (!stepName) {
      return res.status(400).json({ success: false, message: 'Unknown policy key' });
    }

    const driver = await prisma.driver.findUnique({ where: { email } });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    await prisma.$transaction(async (tx) => {
      await upsertOnboardingStep(tx, driver.id, stepName, true, new Date());
      await tx.driver.update({
        where: { email },
        data: { updatedAt: new Date() },
      });
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error acknowledging ${policy}:`, error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const completeOnboarding = async (req, res) => {
  const { email } = req.user;

  try {
    await prisma.driver.update({
      where: { email },
      data: {
        onboardingStatus: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({ success: true, message: 'Onboarding completed' });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
