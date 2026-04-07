/**
 * API and persistence types for normalized driver onboarding (backend).
 * The REST layer still merges {@link LegacyProgressFields} for existing clients.
 */

export interface DriverCore {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  onboardingStatus: string;
  status: string | null;
  smokingStatus: string | null;
  hasPhysicalDifficulties: boolean | null;
  lastRoute: string | null;
  lastRouteUpdatedAt: Date | null;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  statusUpdatedAt: Date | null;
}

export interface DriverAvailabilityRow {
  id: number;
  driverId: number;
  dayOfWeek: string;
  shiftPeriod: string;
}

export interface DriverFacilityLink {
  driverId: number;
  facilityCode: string;
}

export interface DriverOnboardingStepRow {
  id: number;
  driverId: number;
  stepName: string;
  isConfirmed: boolean;
  confirmedAt: Date | null;
}

/** Weekly matrix as used by the driver web app UI. */
export type AvailabilityMatrix = Record<
  string,
  { morning: boolean; noon: boolean; evening: boolean }
>;

/** Normalized GET /drivers/me payload (relations + legacy merge). */
export interface DriverApiPayload extends DriverCore {
  availability: AvailabilityMatrix;
  onboardingSteps: DriverOnboardingStepRow[];
  selectedFacilities: string[];
  facilityCodes: string[];
}

/** Synthetic fields derived from onboarding steps for backwards compatibility. */
export type LegacyProgressFields = Record<string, unknown>;
