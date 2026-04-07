/**
 * Helpers for normalized driver tables ↔ API / legacy onboarding UI shape.
 * @module driverSerialize
 */

/** @typedef {import('@prisma/client').DriverOnboardingStep} DriverOnboardingStep */

const DAYS_ORDER = [
  'Mondays',
  'Tuesdays',
  'Wednesdays',
  'Thursdays',
  'Fridays',
  'Saturdays',
  'Sundays',
];

const SHIFT_KEYS = ['morning', 'noon', 'evening'];

/**
 * Map API route param (e.g. feeStructure) to onboarding step_name in DB.
 */
export const POLICY_PARAM_TO_STEP = {
  feeStructure: 'fee_structure',
  liabilities: 'liabilities',
  cancellationPolicy: 'cancellation_policy',
  paymentCycleSchedule: 'payment_cycle_schedule',
};

/**
 * @param {string | undefined} step
 * @returns {string}
 */
export function normalizeStepName(step) {
  if (!step || typeof step !== 'string') return '';
  return step.trim().toLowerCase().replace(/-/g, '_');
}

/**
 * @param {Array<{ dayOfWeek: string, shiftPeriod: string }>} rows
 * @returns {Record<string, { morning: boolean, noon: boolean, evening: boolean }>}
 */
export function availabilityRowsToMatrix(rows) {
  /** @type {Record<string, { morning: boolean, noon: boolean, evening: boolean }>} */
  const matrix = {};
  for (const d of DAYS_ORDER) {
    matrix[d] = { morning: false, noon: false, evening: false };
  }
  for (const row of rows || []) {
    const day = row.dayOfWeek;
    const shift = row.shiftPeriod;
    if (matrix[day] && SHIFT_KEYS.includes(shift)) {
      matrix[day][shift] = true;
    }
  }
  return matrix;
}

/**
 * @param {number} driverId
 * @param {Record<string, Record<string, boolean>> | null | undefined} matrix
 * @returns {Array<{ driverId: number, dayOfWeek: string, shiftPeriod: string }>}
 */
export function matrixToAvailabilityRows(driverId, matrix) {
  const rows = [];
  if (!matrix || typeof matrix !== 'object') return rows;
  for (const day of DAYS_ORDER) {
    const slots = matrix[day] || {};
    for (const shift of SHIFT_KEYS) {
      if (slots[shift]) {
        rows.push({ driverId, dayOfWeek: day, shiftPeriod: shift });
      }
    }
  }
  return rows;
}

/**
 * Maps onboarding step rows to legacy `progress_*` and `*Acknowledged*` fields used by the driver web app.
 * @param {DriverOnboardingStep[]} steps
 * @returns {Record<string, unknown>}
 */
export function buildLegacyProgressFromSteps(steps) {
  /** @type {Record<string, unknown>} */
  const out = {};
  /** @type {Record<string, DriverOnboardingStep>} */
  const byName = {};
  for (const s of steps || []) {
    byName[s.stepName] = s;
  }

  for (const step of steps || []) {
    if (!step.isConfirmed) continue;
    const iso = step.confirmedAt ? step.confirmedAt.toISOString() : null;
    const progressKey = `progress_${step.stepName}`;
    out[progressKey] = { confirmed: true, confirmedAt: iso };
  }

  if (byName.verify?.isConfirmed) {
    out.phoneVerified = true;
  }
  if (byName.confirm_details?.isConfirmed) {
    out.detailsConfirmed = true;
    out.detailsConfirmedAt = byName.confirm_details.confirmedAt?.toISOString() ?? null;
  }

  const ackPairs = [
    ['fee_structure', 'feeStructureAcknowledged', 'feeStructureAcknowledgedAt', 'acknowledgedFeeStructure'],
    ['liabilities', 'acknowledgedLiabilities', 'liabilitiesAcknowledgedAt', null],
    ['cancellation_policy', 'cancellationPolicyAcknowledged', 'cancellationPolicyAcknowledgedAt', 'acknowledgedCancellationPolicy'],
    ['blocks_classification', 'blocksClassificationAcknowledged', 'blocksClassificationAcknowledgedAt', null],
    ['routes_policy', 'routesPolicyAcknowledged', 'routesPolicyAcknowledgedAt', null],
    ['role', 'roleAcknowledged', 'roleAcknowledgedAt', null],
    ['about', 'aboutAcknowledged', 'aboutAcknowledgedAt', null],
    ['introduction', 'introductionAcknowledged', 'introductionAcknowledgedAt', null],
    ['facility_locations', 'facilityLocationsAcknowledged', 'facilityLocationsAcknowledgedAt', null],
  ];

  for (const [stepName, boolField, atField, altBool] of ackPairs) {
    const row = byName[stepName];
    if (!row?.isConfirmed) continue;
    out[boolField] = true;
    if (altBool) out[altBool] = true;
    if (row.confirmedAt) out[atField] = row.confirmedAt;
  }

  return out;
}

/**
 * @param {import('@prisma/client').PrismaClient | import('@prisma/client').Prisma.TransactionClient} db
 * @param {number} driverId
 * @param {string} stepName normalized snake_case
 * @param {boolean} [isConfirmed]
 * @param {Date | null} [confirmedAt]
 */
export async function upsertOnboardingStep(db, driverId, stepName, isConfirmed = true, confirmedAt = new Date()) {
  return db.driverOnboardingStep.upsert({
    where: {
      driverId_stepName: { driverId, stepName },
    },
    create: {
      driverId,
      stepName,
      isConfirmed,
      confirmedAt,
    },
    update: {
      isConfirmed,
      confirmedAt,
    },
  });
}

/**
 * Prisma driver row + includes → single object for API responses and admin merge.
 * @param {import('@prisma/client').Driver & {
 *   availabilities?: import('@prisma/client').DriverAvailability[],
 *   facilities?: import('@prisma/client').DriverFacility[],
 *   onboardingSteps?: import('@prisma/client').DriverOnboardingStep[],
 * }} driver
 */
export function toDriverApiShape(driver) {
  const { availabilities, facilities, onboardingSteps, ...core } = driver;
  const legacy = buildLegacyProgressFromSteps(onboardingSteps || []);
  const availability = availabilityRowsToMatrix(availabilities || []);
  const selectedFacilities = (facilities || []).map((f) => f.facilityCode);
  return {
    ...core,
    ...legacy,
    availability,
    onboardingSteps: onboardingSteps || [],
    selectedFacilities,
    facilityCodes: selectedFacilities,
  };
}
