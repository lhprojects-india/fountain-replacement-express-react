import { useNavigate } from "react-router-dom";
import { PageLayout } from "@lh/shared";
import { Button } from "@lh/shared";
import { useAuth } from "../context/AuthContext";
import { useOptionalApplication } from "../context/ApplicationContext";
import { SCREENING_STEP_PATHS } from "../lib/screening-navigation";

const Introduction = () => {
  const navigate = useNavigate();
  const appContext = useOptionalApplication();
  const { currentUser, updateUserData } = useAuth();
  const application = appContext?.application;

  const applicantName =
    [application?.firstName, application?.lastName].filter(Boolean).join(" ").trim() ||
    currentUser?.name ||
    "";
  const title = applicantName ? `Hi ${applicantName}!` : "Hi there!";

  const handleContinue = async () => {
    if (appContext) {
      await appContext.markStepCompleted("introduction");
      navigate("/screening/about");
    } else {
      await updateUserData({ step: "introduction" });
      navigate("/about");
    }
  };

  return (
    <PageLayout className="flex flex-col items-center space-y-4"
      routes={appContext ? SCREENING_STEP_PATHS : undefined}
      basePath={appContext ? "/screening" : "/"}
      title={title}
      subtitle="Welcome to your screening flow. This stage prepares your application for review through key policy and role checkpoints."
    >
      <div className="w-full flex flex-col items-center space-y-4">
        <div className="text-center text-l my-2 max-w-xs animate-fade-in">
          <p className="font-semibold mb-2">Things Covered:</p>
          <ul className="list-disc list-inside text-left">
            <li>About the Company</li>
            <li>Role Explanation</li>
            <li>Availability and Facility Locations</li>
            <li>Blocks Classification and Fee Structure</li>
            <li>Cancellation policy</li>
            <li>Liability Policy</li>
            <li>How this connects to your next pipeline stage</li>
          </ul>
        </div>
        <Button 
          onClick={handleContinue}
          className="w-full max-w-xs"
        >
          Continue
        </Button>
      </div>
    </PageLayout>
  );
};

export default Introduction;
