export const SCREENING_ROUTES = [
  "confirm-details",
  "vehicle-check",
  "introduction",
  "about",
  "role",
  "availability",
  "facility-locations",
  "blocks-classification",
  "fee-structure",
  "payment-cycle-schedule",
  "how-route-works",
  "cancellation-policy",
  "smoking-fitness-check",
  "liabilities",
  "summary",
];

export const SCREENING_STEP_PATHS = SCREENING_ROUTES.map((route) => `/screening/${route}`);

export function getNextScreeningStep(currentStep) {
  const idx = SCREENING_ROUTES.indexOf(currentStep);
  if (idx < 0) return SCREENING_ROUTES[0];
  return SCREENING_ROUTES[Math.min(idx + 1, SCREENING_ROUTES.length - 1)];
}

export function getPrevScreeningStep(currentStep) {
  const idx = SCREENING_ROUTES.indexOf(currentStep);
  if (idx <= 0) return SCREENING_ROUTES[0];
  return SCREENING_ROUTES[idx - 1];
}

export function getScreeningProgress(completedSteps = []) {
  const set = new Set(completedSteps || []);
  const completedCount = SCREENING_ROUTES.filter((step) => set.has(step.replace(/-/g, "_"))).length;
  const total = SCREENING_ROUTES.length;
  return {
    completedCount,
    total,
    percent: total ? Math.round((completedCount / total) * 100) : 0,
  };
}
