import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { driverServices } from "@/lib/firebase-services";

/**
 * Saves the current route as last visited route for authenticated drivers.
 * Lives in driver-web (not @lh/shared) because it depends on app auth and API services.
 */
export function useSaveProgress() {
  const location = useLocation();
  const { currentUser, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.email) return;

    const flowRoutes = [
      "/confirm-details",
      "/introduction",
      "/about",
      "/role",
      "/availability",
      "/blocks-classification",
      "/fee-structure",
      "/how-route-works",
      "/cancellation-policy",
      "/smoking-fitness-check",
      "/liabilities",
      "/acknowledgements-summary",
    ];

    if (flowRoutes.includes(location.pathname)) {
      driverServices
        .updatePersonalDetails(currentUser.email, {
          lastRoute: location.pathname,
          lastRouteUpdatedAt: new Date().toISOString(),
        })
        .catch((error) => {
          console.error("Error saving current route:", error);
        });
    }
  }, [location.pathname, currentUser, isAuthenticated]);
}
