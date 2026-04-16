import { Link, useNavigate } from "react-router-dom";
import { Button, PageLayout } from "@lh/shared";
import { useApplication } from "../context/ApplicationContext";

const SCREENING_STEP_ORDER = [
  { key: "confirm_details", route: "/screening/confirm-details", label: "Confirm details" },
  { key: "vehicle_check", route: "/screening/vehicle-check", label: "Vehicle check" },
  { key: "introduction", route: "/screening/introduction", label: "Introduction" },
  { key: "about", route: "/screening/about", label: "About" },
  { key: "role", route: "/screening/role", label: "Role" },
  { key: "availability", route: "/screening/availability", label: "Availability" },
  { key: "facility_locations", route: "/screening/facility-locations", label: "Facility locations" },
  {
    key: "blocks_classification",
    route: "/screening/blocks-classification",
    label: "Blocks classification",
  },
  { key: "fee_structure", route: "/screening/fee-structure", label: "Fee structure" },
  {
    key: "payment_cycle_schedule",
    route: "/screening/payment-cycle-schedule",
    label: "Payment cycle schedule",
  },
  { key: "how_route_works", route: "/screening/how-route-works", label: "How route works" },
  { key: "cancellation_policy", route: "/screening/cancellation-policy", label: "Cancellation policy" },
  {
    key: "smoking_fitness_check",
    route: "/screening/smoking-fitness-check",
    label: "Smoking and fitness check",
  },
  { key: "liabilities", route: "/screening/liabilities", label: "Liabilities" },
];

const ScreeningLanding = () => {
  const navigate = useNavigate();
  const { screeningProgress, isLoadingScreening } = useApplication();

  const stepLookup = new Map((screeningProgress?.steps || []).map((step) => [step.stepName, step.isConfirmed]));
  const nextStep = SCREENING_STEP_ORDER.find((step) => !stepLookup.get(step.key)) || SCREENING_STEP_ORDER[0];
  const summary = screeningProgress?.summary;

  return (
    <PageLayout title="Screening">
      <div className="max-w-3xl mx-auto space-y-6">
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-semibold text-brand-shadeBlue">Screening checklist</h1>
          <p className="text-gray-600 mt-2">
            Complete the required screening steps to move to the next stage.
          </p>
          <p className="text-sm text-gray-500 mt-3">
            {isLoadingScreening
              ? "Loading progress..."
              : `${summary?.completedSteps || 0} of ${summary?.totalSteps || SCREENING_STEP_ORDER.length} completed`}
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <ul className="space-y-2">
            {SCREENING_STEP_ORDER.map((step) => {
              const done = Boolean(stepLookup.get(step.key));
              return (
                <li key={step.key} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-800">{step.label}</span>
                  <span className={done ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                    {done ? "Completed" : "Pending"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="flex items-center gap-3">
          <Button onClick={() => navigate(nextStep.route)}>Continue</Button>
          <Link className="text-sm text-brand-blue hover:underline" to="/dashboard">
            Back to Dashboard
          </Link>
        </section>
      </div>
    </PageLayout>
  );
};

export default ScreeningLanding;
