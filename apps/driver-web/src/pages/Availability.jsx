import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageLayout } from "@lh/shared";
import { Button } from "@lh/shared";
import AvailabilityGrid from "@/components/AvailabilityGrid";
import { useSaveProgress } from "@/hooks/useSaveProgress";

const Availability = () => {
  const navigate = useNavigate();
  const { currentUser, saveAvailability, isLoading, isAuthenticated } = useAuth();
  useSaveProgress(); // Automatically save progress when user visits this page
  const [isSaving, setIsSaving] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("Availability Page: Mount/Update", {
      isLoading,
      isAuthenticated,
      hasCurrentUser: !!currentUser,
      email: currentUser?.email
    });
  }, [isLoading, isAuthenticated, currentUser]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !currentUser?.email) {
      console.log("Availability Page: No auth, redirecting to welcome");
      // navigate("/", { replace: true }); // Commented out for now to allow viewing logs
    }
  }, [isLoading, isAuthenticated, currentUser, navigate]);

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
    if (currentUser?.availability) {
      setAvailability(currentUser.availability);
    }
  }, [currentUser]);

  const handleContinue = async () => {
    setIsSaving(true);
    try {
      const success = await saveAvailability(availability);
      if (success) {
        navigate("/facility-locations");
      }
    } catch (error) {
      console.error("Error saving availability:", error);
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

  const isButtonDisabled = !hasAtLeastOneSelection() || isSaving || isLoading;

  return (
    <PageLayout compact title="">
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
