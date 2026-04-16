import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageLayout } from "@lh/shared";
import { Button } from "@lh/shared";
import AvailabilityGrid from "@/components/AvailabilityGrid";
import { useOptionalApplication } from "../context/ApplicationContext";
import { SCREENING_STEP_PATHS } from "../lib/screening-navigation";

const Availability = () => {
  const navigate = useNavigate();
  const appContext = useOptionalApplication();
  const { currentUser, saveAvailability: legacySaveAvailability, isLoading } = useAuth();
  const screeningProgress = appContext?.screeningProgress;
  const isLoadingScreening = appContext ? appContext.isLoadingScreening : isLoading;
  const [isSaving, setIsSaving] = useState(false);

  const [availability, setAvailability] = useState({
    Mondays: { morning: false, noon: false, evening: false },
    Tuesdays: { morning: false, noon: false, evening: false },
    Wednesdays: { morning: false, noon: false, evening: false },
    Thursdays: { morning: false, noon: false, evening: false },
    Fridays: { morning: false, noon: false, evening: false },
    Saturdays: { morning: false, noon: false, evening: false },
    Sundays: { morning: false, noon: false, evening: false }
  });

  // Load existing availability data
  useEffect(() => {
    if (!appContext) {
      if (currentUser?.availability) {
        setAvailability(currentUser.availability);
      }
      return;
    }

    const rows = screeningProgress?.driver?.availabilities || [];
    if (!rows.length) return;

    const next = {
      Mondays: { morning: false, noon: false, evening: false },
      Tuesdays: { morning: false, noon: false, evening: false },
      Wednesdays: { morning: false, noon: false, evening: false },
      Thursdays: { morning: false, noon: false, evening: false },
      Fridays: { morning: false, noon: false, evening: false },
      Saturdays: { morning: false, noon: false, evening: false },
      Sundays: { morning: false, noon: false, evening: false }
    };

    for (const row of rows) {
      const day = row.dayOfWeek;
      const shift = row.shiftPeriod;
      if (next[day] && Object.prototype.hasOwnProperty.call(next[day], shift)) {
        next[day][shift] = true;
      }
    }

    setAvailability(next);
  }, [appContext, currentUser, screeningProgress]);

  const handleContinue = async () => {
    setIsSaving(true);
    try {
      const success = appContext
        ? await appContext.saveAvailability(availability)
        : await legacySaveAvailability(availability);
      if (success) {
        navigate(appContext ? "/screening/facility-locations" : "/facility-locations");
      }
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvailabilityChange = (newAvailability) => {
    setAvailability(newAvailability);
  };

  // Check if at least one availability slot is selected
  const hasAtLeastOneSelection = () => {
    return Object.values(availability).some(
      (day) => day.morning === true || day.noon === true || day.evening === true
    );
  };

  const isButtonDisabled = !hasAtLeastOneSelection() || isSaving || isLoadingScreening;

  return (
    <PageLayout
      compact
      title=""
      routes={appContext ? SCREENING_STEP_PATHS : undefined}
      basePath={appContext ? "/screening" : "/"}
    >
      <div className="w-full max-w-sm mx-auto flex flex-col gap-4 pb-6">
        {/* Left-aligned heading */}
        <div>
          <h2 className="text-2xl font-bold text-brand-shadeBlue animate-slide-down">
            Availability Check
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Define your working rhythm. Select the time windows where you're ready to hit the road. We operate in three primary shifts across the week.
          </p>
        </div>

        <AvailabilityGrid
          availability={availability}
          onAvailabilityChange={handleAvailabilityChange}
        />

        {!hasAtLeastOneSelection() && (
          <div className="error-box">
            <span className="flex-shrink-0 text-brand-shadePink font-bold text-base">i</span>
            <span>Please select at least one availability slot to continue</span>
          </div>
        )}

        <Button
          onClick={handleContinue}
          className="w-full mt-2"
          disabled={isButtonDisabled}
        >
          {isSaving ? "Saving..." : "I confirm my weekly availability"}
        </Button>
      </div>
    </PageLayout>
  );
};

export default Availability;
