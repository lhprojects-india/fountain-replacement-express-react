import { useLocation } from "react-router-dom";

// Define the routes that should show progress bar (from confirm-details to liabilities)
const PROGRESS_ROUTES = [
  '/confirm-details',            // Step 1
  '/introduction',               // Step 2
  '/about',                      // Step 3
  '/role',                       // Step 4
  '/availability',               // Step 5
  '/facility-locations',         // Step 6
  '/blocks-classification',      // Step 7
  '/fee-structure',              // Step 8
  '/how-route-works',            // Step 9
  '/cancellation-policy',        // Step 10
  '/smoking-fitness-check',      // Step 11
  '/liabilities',                // Step 12
];

const ProgressBar = ({ routes = PROGRESS_ROUTES, label = "Onboarding Progress" }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const currentStepIndex = routes.findIndex(route => route === currentPath);
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const totalSteps = routes.length;
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full px-4 pb-2">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-shadeBlue/60">
            {label}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-brand-shadeBlue">
              {currentStep}/{totalSteps}
            </span>
            <span className="text-xs font-medium text-brand-shadeBlue/60">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
        </div>

        <div className="relative w-full h-2 bg-white/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-teal transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
