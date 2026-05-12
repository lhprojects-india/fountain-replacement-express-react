/** Canonical screening steps — must match driver onboarding flow. */
export const REQUIRED_SCREENING_STEPS = [
  'confirm_details',
  'vehicle_check',
  'introduction',
  'about',
  'role',
  'availability',
  'facility_locations',
  'blocks_classification',
  'fee_structure',
  'payment_cycle_schedule',
  'routes_policy',
  'cancellation_policy',
  'smoking_fitness_check',
  'liabilities',
];

export const SCREENING_STEP_LABELS = {
  confirm_details: 'Personal Details',
  vehicle_check: 'Vehicle Check',
  introduction: 'Introduction',
  about: 'Company Overview',
  role: 'Role Understanding',
  availability: 'Availability',
  facility_locations: 'Facility Locations',
  blocks_classification: 'Blocks Classification',
  fee_structure: 'Fee Structure',
  payment_cycle_schedule: 'Payment Cycle',
  routes_policy: 'Route Policy',
  cancellation_policy: 'Cancellation Policy',
  smoking_fitness_check: 'Health & Fitness Check',
  liabilities: 'Liabilities',
};
