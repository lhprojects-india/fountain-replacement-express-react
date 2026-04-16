import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@lh/shared";
import { Button } from "@lh/shared";
import { CheckboxWithLabel } from "@lh/shared";
import { useToast } from "@lh/shared";
import { useAuth } from "../context/AuthContext";
import { useApplication } from "../context/ApplicationContext";
import { SCREENING_STEP_PATHS } from "../lib/screening-navigation";
import { publicServices } from "../lib/public-services";

const VEHICLE_OPTIONS = [
  { value: "small_car_hatchback", label: "Small Car / Hatchback" },
  { value: "large_car_sedan", label: "Large Car / Sedan" },
  { value: "small_van", label: "Small Van" },
  { value: "large_van", label: "Large Van" },
];

const VehicleCheck = () => {
  const navigate = useNavigate();
  const { loadDriverApplication } = useAuth();
  const { refreshProgress } = useApplication();
  const { toast } = useToast();
  const [hasOwnVehicle, setHasOwnVehicle] = useState(null);
  const [vehicleType, setVehicleType] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    if (hasOwnVehicle === null) {
      toast({
        title: "Selection required",
        description: "Please answer whether you have your own vehicle.",
        variant: "destructive",
      });
      return;
    }
    if (hasOwnVehicle && !vehicleType) {
      toast({
        title: "Vehicle type required",
        description: "Select the type of vehicle you will use.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const data = await publicServices.submitVehicleCheck({
        hasOwnVehicle,
        vehicleType: hasOwnVehicle ? vehicleType : undefined,
      });

      if (data.rejected) {
        await loadDriverApplication();
        toast({
          title: "Application not successful",
          description: "This role requires your own vehicle.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      await Promise.allSettled([loadDriverApplication(), refreshProgress()]);
      navigate("/screening/introduction");
    } catch {
      toast({
        title: "Save failed",
        description: "Unable to save your response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageLayout compact title="" routes={SCREENING_STEP_PATHS} basePath="/screening">
      <div className="w-full flex flex-col items-center max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-2 text-brand-shadeBlue text-center">Vehicle</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Do you have your own vehicle for this role?
        </p>

        <div className="w-full space-y-4 mb-6">
          <CheckboxWithLabel
            label="Yes, I have my own vehicle"
            checked={hasOwnVehicle === true}
            onChange={() => {
              setHasOwnVehicle(true);
            }}
          />
          <CheckboxWithLabel
            label="No, I do not have my own vehicle"
            checked={hasOwnVehicle === false}
            onChange={() => {
              setHasOwnVehicle(false);
              setVehicleType("");
            }}
          />
        </div>

        {hasOwnVehicle === true ? (
          <div className="w-full mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle type</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            >
              <option value="">Select vehicle type</option>
              {VEHICLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <Button onClick={handleContinue} className="w-full max-w-xs mt-2" disabled={isSaving}>
          {isSaving ? "Saving..." : "Continue"}
        </Button>
      </div>
    </PageLayout>
  );
};

export default VehicleCheck;
