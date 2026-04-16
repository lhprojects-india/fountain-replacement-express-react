/**
 * Progress tracking utilities
 * Determines the next route based on user's onboarding progress
 */

// Define the onboarding flow order
export const ONBOARDING_ROUTES = [
  '/screening/confirm-details',
  '/screening/vehicle-check',
  '/screening/introduction',
  '/screening/about',
  '/screening/role',
  '/screening/availability',
  '/screening/facility-locations',
  '/screening/blocks-classification',
  '/screening/fee-structure',
  '/screening/payment-cycle-schedule',
  '/screening/how-route-works',
  '/screening/cancellation-policy',
  '/screening/smoking-fitness-check',
  '/screening/liabilities',
  '/screening/summary',
];

/**
 * Maps step names to routes
 */
export const STEP_TO_ROUTE = {
  'confirm_details': '/screening/confirm-details',
  'vehicle_check': '/screening/vehicle-check',
  'introduction': '/screening/introduction',
  'about': '/screening/about',
  'role': '/screening/role',
  'availability': '/screening/availability',
  'facility_locations': '/screening/facility-locations',
  'blocks_classification': '/screening/blocks-classification',
  'fee_structure': '/screening/fee-structure',
  'payment_cycle_schedule': '/screening/payment-cycle-schedule',
  'routes_policy': '/screening/how-route-works',
  'cancellation_policy': '/screening/cancellation-policy',
  'smoking_fitness_check': '/screening/smoking-fitness-check',
  'liabilities': '/screening/liabilities',
  'acknowledgements_summary': '/screening/summary',
};

/**
 * Determines the next route based on user's progress
 * Returns the route the user should be redirected to
 */
export function getNextRoute(userData) {
  if (!userData) return '/dashboard';
  const stepOrder = [
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
  for (const step of stepOrder) {
    if (userData[`progress_${step}`]?.confirmed !== true) {
      return STEP_TO_ROUTE[step] || '/screening';
    }
  }
  return '/screening/summary';
}

/**
 * Gets the current stage name for display purposes
 */
export function getCurrentStage(userData) {
  if (!userData) return 'Not Started';
  return userData.currentStage || 'In Progress';
}

/**
 * Saves the current route as the last route visited
 */
export async function saveCurrentRoute(userEmail, route, driverServices) {
  if (!userEmail || !driverServices) return;

  try {
    await driverServices.updatePersonalDetails(userEmail, {
      lastRoute: route,
      lastRouteUpdatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving current route:', error);
  }
}


/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  EMAIL: 'driver_email',
};

/**
 * Saves driver data to local storage for session persistence
 * Helps maintain state across page refreshes
 */
export function saveLocalDriverData(data) {
  if (typeof window === 'undefined') return;

  const { email } = data;

  if (email) {
    localStorage.setItem(STORAGE_KEYS.EMAIL, email);
  }

}

/**
 * Retrieves driver data from local storage
 * Used to restore session on page refresh
 */
export function getLocalDriverData() {
  if (typeof window === 'undefined') return { email: null };

  const email = localStorage.getItem(STORAGE_KEYS.EMAIL);
  return { email };
}

/**
 * Clears driver data from local storage
 * Used on logout
 */
export function clearLocalDriverData() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEYS.EMAIL);
}
