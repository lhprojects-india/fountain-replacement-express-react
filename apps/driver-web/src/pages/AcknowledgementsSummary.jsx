import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageLayout } from "@lh/shared";
import { Button } from "@lh/shared";
import { useToast } from "@lh/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@lh/shared";
import { CheckCircle2, CircleX } from "lucide-react";
import { useOptionalApplication } from "../context/ApplicationContext";
import { SCREENING_STEP_PATHS } from "../lib/screening-navigation";
import { publicServices } from "../lib/public-services";

/** Matches backend `getScreeningProgress` step keys; used when API returns `stepName` without `label`. */
const SCREENING_SUMMARY_LABELS = {
  confirm_details: "Personal Details Confirmed",
  vehicle_check: "Vehicle Confirmed",
  introduction: "Introduction Reviewed",
  about: "Company Overview Reviewed",
  role: "Role Understanding Confirmed",
  availability: "Availability Set",
  facility_locations: "Facility Locations Selected",
  blocks_classification: "Blocks Classification Reviewed",
  fee_structure: "Fee Structure Acknowledged",
  payment_cycle_schedule: "Payment Cycle Reviewed",
  routes_policy: "Route Policy Reviewed",
  cancellation_policy: "Cancellation Policy Acknowledged",
  smoking_fitness_check: "Health & Fitness Check Complete",
  liabilities: "Liabilities Acknowledged",
};

const AcknowledgementsSummary = () => {
  const navigate = useNavigate();
  const appContext = useOptionalApplication();
  const { currentUser, isLoading, loadDriverApplication } = useAuth();
  const { toast } = useToast();

  const [isCompleting, setIsCompleting] = useState(false);

  const fallbackSteps = useMemo(
    () => [
      { name: "confirm_details", label: "Personal Details Confirmed", completed: Boolean(currentUser?.detailsConfirmed), route: "/confirm-details" },
      { name: "vehicle_check", label: "Vehicle Confirmed", completed: Boolean(currentUser?.progress_vehicle_check?.confirmed), route: "/vehicle-check" },
      { name: "introduction", label: "Introduction Reviewed", completed: Boolean(currentUser?.introductionAcknowledged), route: "/introduction" },
      { name: "about", label: "Company Overview Reviewed", completed: Boolean(currentUser?.aboutAcknowledged), route: "/about" },
      { name: "role", label: "Role Understanding Confirmed", completed: Boolean(currentUser?.roleAcknowledged), route: "/role" },
      { name: "availability", label: "Availability Set", completed: Boolean(currentUser?.progress_availability?.confirmed), route: "/availability" },
      { name: "facility_locations", label: "Facility Locations Selected", completed: Boolean(currentUser?.facilityLocationsAcknowledged), route: "/facility-locations" },
      { name: "blocks_classification", label: "Blocks Classification Reviewed", completed: Boolean(currentUser?.blocksClassificationAcknowledged), route: "/blocks-classification" },
      { name: "fee_structure", label: "Fee Structure Acknowledged", completed: Boolean(currentUser?.feeStructureAcknowledged || currentUser?.acknowledgedFeeStructure), route: "/fee-structure" },
      { name: "payment_cycle_schedule", label: "Payment Cycle Reviewed", completed: Boolean(currentUser?.paymentCycleScheduleAcknowledged), route: "/payment-cycle-schedule" },
      { name: "routes_policy", label: "Route Policy Reviewed", completed: Boolean(currentUser?.routesPolicyAcknowledged), route: "/how-route-works" },
      { name: "cancellation_policy", label: "Cancellation Policy Acknowledged", completed: Boolean(currentUser?.cancellationPolicyAcknowledged || currentUser?.acknowledgedCancellationPolicy), route: "/cancellation-policy" },
      { name: "smoking_fitness_check", label: "Health & Fitness Check Complete", completed: Boolean(currentUser?.progress_smoking_fitness_check?.confirmed), route: "/smoking-fitness-check" },
      { name: "liabilities", label: "Liabilities Acknowledged", completed: Boolean(currentUser?.acknowledgedLiabilities || currentUser?.liabilitiesAcknowledged), route: "/liabilities" },
    ],
    [currentUser]
  );

  const screeningSteps = (appContext?.screeningProgress?.steps || [])
    .map((s) => {
      const name = s?.name ?? s?.stepName;
      if (!name) return null;
      const completed = Boolean(s.completed ?? s.isConfirmed);
      const segment = name === "routes_policy" ? "how-route-works" : String(name).replace(/_/g, "-");
      return {
        ...s,
        name,
        completed,
        label: s.label ?? SCREENING_SUMMARY_LABELS[name],
        route: `/screening/${segment}`,
      };
    })
    .filter(Boolean);
  const steps = screeningSteps.length ? screeningSteps : fallbackSteps;
  const completedCount = steps.filter((s) => s.completed).length;
  const allAcknowledged = steps.length > 0 && completedCount === steps.length;

  const handleReviewPolicy = (route) => {
    navigate(`${route}${route.includes("?") ? "&" : "?"}from=summary`);
  };

  const handleFinish = async () => {
    if (!allAcknowledged) {
      const firstIncomplete = steps.find((s) => !s.completed);
      if (firstIncomplete) {
        toast({
          title: "Incomplete steps found",
          description: `Please complete "${firstIncomplete.label || firstIncomplete.name}" first.`,
          variant: "destructive",
        });
      }
      return;
    }

    setIsCompleting(true);
    try {
      const result = await publicServices.completeScreening();
      if (result?.complete) {
        await Promise.allSettled([loadDriverApplication(), appContext?.refreshProgress?.()]);
        toast({
          title: "Screening completed",
          description: "Your application is being reviewed.",
        });
        navigate("/dashboard");
        return;
      }

      const missing = result?.missingSteps || [];
      toast({
        title: "Missing steps",
        description: missing.length ? `Please complete: ${missing.join(", ")}` : "Please complete all steps.",
        variant: "destructive",
      });
      if (missing.length) {
        const first = steps.find((s) => s.name === missing[0] || s.route.includes(missing[0].replace(/_/g, "-")));
        if (first) {
          const el = document.getElementById(`screening-step-${first.name}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    } catch (error) {
      toast({
        title: "Completion Failed",
        description: "Unable to complete screening. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <PageLayout compact title="" routes={appContext ? SCREENING_STEP_PATHS : undefined} basePath={appContext ? "/screening" : "/"}>
      <div className="w-full flex flex-col items-center px-4">
        <div className="w-full max-w-3xl space-y-6 animate-fade-in">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-brand-shadeBlue">
              Screening Summary
            </h2>
            <p className="text-base text-muted-foreground mb-6">
              Review each step below. You can click any item to revisit and update it.
            </p>
          </div>

          <Card className="!bg-gray-50/50 border-gray-300">
            <CardHeader>
              <CardTitle>Screening Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step) => {
                  const isCompleted = Boolean(step.completed);
                  return (
                    <div
                      key={step.name}
                      id={`screening-step-${step.name}`}
                      className={`flex items-center justify-between p-4 border rounded-lg ${isCompleted ? 'bg-transparent border-brand-teal' : 'bg-transparent border-gray-300'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-brand-shadeTeal" />
                        ) : (
                          <CircleX className="h-5 w-5 text-brand-shadePink" />
                        )}
                        <span className={`font-medium ${isCompleted ? 'text-brand-shadeTeal' : 'text-gray-700'}`}>
                          {step.label || step.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleReviewPolicy(step.route)}
                        className="ml-4 text-brand-blue hover:underline text-sm"
                      >
                        {isCompleted ? "Review" : "Complete"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Completed: {completedCount} of {steps.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col items-center space-y-4 pt-4">
            <Button
              onClick={handleFinish}
              className="w-full max-w-xs"
              disabled={isCompleting || isLoading || !allAcknowledged}
            >
              {isCompleting || isLoading ? "Completing..." : "Complete Screening"}
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AcknowledgementsSummary;

