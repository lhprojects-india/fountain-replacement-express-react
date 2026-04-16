
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageLayout } from "@lh/shared";
import { Button } from "@lh/shared";
import { CheckboxWithLabel } from "@lh/shared";
import { useToast } from "@lh/shared";
import roleExplanationImage from "@lh/shared/assets/driver-role-vertical.png";
import { useOptionalApplication } from "../context/ApplicationContext";
import { SCREENING_STEP_PATHS } from "../lib/screening-navigation";

const Role = () => {
  const navigate = useNavigate();
  const appContext = useOptionalApplication();
  const { currentUser, updateUserData, isLoading } = useAuth();
  const screeningProgress = appContext?.screeningProgress;
  const isLoadingScreening = appContext ? appContext.isLoadingScreening : isLoading;
  const { toast } = useToast();

  const [roleUnderstood, setRoleUnderstood] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing confirmation status
  useEffect(() => {
    const roleStepConfirmed = screeningProgress?.steps?.find((step) => step.stepName === "role")?.isConfirmed;
    if (roleStepConfirmed || currentUser?.roleUnderstood) {
      setRoleUnderstood(true);
    }
  }, [screeningProgress, currentUser?.roleUnderstood]);

  const handleContinue = async () => {
    if (!roleUnderstood) {
      toast({
        title: "Confirmation Required",
        description: "Please acknowledge that you understand your role.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (appContext) {
        await appContext.markStepCompleted("role", { roleUnderstood: true, roleUnderstoodAt: new Date().toISOString() });
        navigate("/screening/availability");
      } else {
        await updateUserData({
          roleUnderstood: true,
          roleUnderstoodAt: new Date().toISOString(),
          step: "role",
        });
        navigate("/availability");
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Unable to save acknowledgment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageLayout
      compact
      title=""
      routes={appContext ? SCREENING_STEP_PATHS : undefined}
      basePath={appContext ? "/screening" : "/"}
    >
      <div className="w-full flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-3 text-brand-shadeBlue animate-slide-down">
          Driver role
        </h2>
        
        <p className="text-sm text-gray-500 mb-6 max-w-md leading-relaxed animate-fade-in">
          As a partner driver for Talentrix by Laundryheap, you will be responsible for completing a series of essential delivery and collection tasks that ensure smooth daily operations and excellent customer experience. Your main responsibilities include:
        </p>
        
        <div className="w-full max-w-md animate-fade-in mb-6">
          <img 
            src={roleExplanationImage} 
            alt="Role explanation diagram" 
            loading="lazy"
            className="w-full h-auto rounded-lg border-2 border-white mb-8"
          />
          
          <div className="px-4 py-2">
            <CheckboxWithLabel
              label="I understand my role"
              checked={roleUnderstood}
              onChange={setRoleUnderstood}
            />
          </div>
        </div>
        
        <Button 
          onClick={handleContinue}
          className="w-full max-w-xs mt-6"
          disabled={isSaving || isLoadingScreening}
        >
          {isSaving ? "Saving..." : "Continue"}
        </Button>
      </div>
    </PageLayout>
  );
};

export default Role;
