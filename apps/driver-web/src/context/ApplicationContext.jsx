import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { publicServices } from "../lib/public-services";

const ApplicationContext = createContext(undefined);

export function ApplicationProvider({ children }) {
  const { application, loadDriverApplication } = useAuth();
  const [screeningProgress, setScreeningProgress] = useState(null);
  const [isLoadingScreening, setIsLoadingScreening] = useState(false);

  const refreshProgress = useCallback(async () => {
    if (!application?.id) {
      setScreeningProgress(null);
      return null;
    }

    setIsLoadingScreening(true);
    try {
      const result = await publicServices.getScreeningProgress();
      const screening = result?.screening || null;
      setScreeningProgress(screening);
      return screening;
    } finally {
      setIsLoadingScreening(false);
    }
  }, [application?.id]);

  const markStepCompleted = useCallback(
    async (stepName, data = {}) => {
      await publicServices.markDriverProgress(stepName, data);
      await Promise.allSettled([loadDriverApplication(), refreshProgress()]);
      return true;
    },
    [loadDriverApplication, refreshProgress]
  );

  const updateProfile = useCallback(
    async (payload) => {
      await publicServices.updateApplicationProfile(payload || {});
      await Promise.allSettled([loadDriverApplication(), refreshProgress()]);
      return true;
    },
    [loadDriverApplication, refreshProgress]
  );

  const saveAvailability = useCallback(
    async (availability) => {
      await publicServices.saveDriverAvailability(availability);
      await Promise.allSettled([loadDriverApplication(), refreshProgress()]);
      return true;
    },
    [loadDriverApplication, refreshProgress]
  );

  const updatePersonalDetails = useCallback(
    async (payload) => {
      await publicServices.updateDriverPersonalDetails(payload || {});
      await Promise.allSettled([loadDriverApplication(), refreshProgress()]);
      return true;
    },
    [loadDriverApplication, refreshProgress]
  );

  const acknowledgePolicy = useCallback(
    async (policyKey) => {
      await publicServices.acknowledgePolicy(policyKey);
      await Promise.allSettled([loadDriverApplication(), refreshProgress()]);
      return true;
    },
    [loadDriverApplication, refreshProgress]
  );

  useEffect(() => {
    refreshProgress().catch((error) => {
    });
  }, [refreshProgress]);

  const value = useMemo(
    () => ({
      application,
      screeningProgress,
      isLoadingScreening,
      refreshProgress,
      markStepCompleted,
      updateProfile,
      saveAvailability,
      updatePersonalDetails,
      acknowledgePolicy,
    }),
    [
      application,
      screeningProgress,
      isLoadingScreening,
      refreshProgress,
      markStepCompleted,
      updateProfile,
      saveAvailability,
      updatePersonalDetails,
      acknowledgePolicy,
    ]
  );

  return <ApplicationContext.Provider value={value}>{children}</ApplicationContext.Provider>;
}

export function useApplication() {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error("useApplication must be used within an ApplicationProvider");
  }
  return context;
}

export function useOptionalApplication() {
  return useContext(ApplicationContext);
}
