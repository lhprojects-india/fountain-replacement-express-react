import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ShieldCheck, Zap, Info } from "lucide-react";
import { PageLayout } from "@lh/shared";
import { Button } from "@lh/shared";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@lh/shared";
import { getNextRoute } from "@lh/shared";

const Welcome = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { checkEmail, isLoading, currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && isAuthenticated && currentUser) {
      if (currentUser.onboardingStatus === 'completed') {
        return;
      }

      const hasActualProgress =
        currentUser.progress_confirm_details?.confirmed === true ||
        currentUser.progress_verify?.confirmed === true ||
        currentUser.phoneVerified === true ||
        currentUser.detailsConfirmed === true ||
        currentUser.lastRoute;

      if (!hasActualProgress) {
        return;
      }

      const nextRoute = getNextRoute(currentUser);
      if (nextRoute !== '/' && nextRoute !== '/verify') {
        navigate(nextRoute, { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your registered email address.",
        variant: "destructive",
      });
      return;
    }

    if (localStorage.getItem('mock_onboarding_completed') === 'true') {
      localStorage.removeItem('mock_onboarding_completed');
    }

    const result = await checkEmail(email);
    if (result.success) {
      navigate("/verify");
    }
  };

  return (
    <PageLayout title="">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6 pb-6">
        {/* Welcome heading with yellow left-border accent */}
        <div className="border-l-4 border-brand-yellow pl-4">
          <h1 className="text-2xl font-bold text-brand-shadeBlue leading-tight">
            Welcome to the{" "}
            <span className="text-brand-blue">Laundryheap</span> Team
          </h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Ready to hit the road? Let's get your onboarding finished so you can start earning.
          </p>
        </div>

        {/* Email input card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                Registered Email
              </label>
              <div className="relative">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@laundryheap.com"
                  type="email"
                  required
                  className="w-full px-4 py-3 pr-10 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-shadeTeal focus:border-brand-shadeTeal transition-all duration-200 text-sm"
                />
                <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Info box */}
            <div className="info-box">
              <Info size={16} className="flex-shrink-0 mt-0.5 text-brand-blue" />
              <span>
                Please enter your registered email address provided with your Fountain application.
              </span>
            </div>

            <Button
              type="submit"
              className="w-full mt-1"
              showArrow={true}
            >
              {isLoading ? "Checking..." : "Continue"}
            </Button>
          </form>
        </div>

        {/* Secure Verification + Fast Approval badges */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <ShieldCheck size={20} className="text-brand-shadeTeal flex-shrink-0" />
            <span className="text-xs font-semibold text-brand-shadeBlue">Secure Verification</span>
          </div>
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <Zap size={20} className="text-brand-shadeYellow flex-shrink-0" />
            <span className="text-xs font-semibold text-brand-shadeBlue">Fast Approval</span>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Welcome;
