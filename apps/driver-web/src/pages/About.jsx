
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@lh/shared";
import { Button } from "@lh/shared";
import { useAuth } from "../context/AuthContext";
import { useOptionalApplication } from "../context/ApplicationContext";
import { SCREENING_STEP_PATHS } from "../lib/screening-navigation";

const About = () => {
  const navigate = useNavigate();
  const appContext = useOptionalApplication();
  const { updateUserData } = useAuth();

  const handleContinue = async () => {
    if (appContext) {
      await appContext.markStepCompleted("about");
      navigate("/screening/role");
    } else {
      await updateUserData({ step: "about" });
      navigate("/role");
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
        <h2 className="text-2xl font-bold mb-4 text-brand-shadeBlue animate-slide-down">
          About Laundryheap
        </h2>
        
      
        <div className="space-y-4 max-w-md text-sm text-gray-600 leading-relaxed animate-fade-in">
          <p>
          Operating across 14 countries and 23 cities, we’ve achieved over 150,000 app downloads and successfully completed more than 2 million orders.
          </p>
          <p>   
Laundryheap is the world’s fastest laundry and dry-cleaning service, offering next-day delivery. Through our 24/7 app and website, customers can enjoy a seamless laundry experience anytime, anywhere.
          </p>
          <p>
We deliver peace of mind with continuous service and dedicated customer support. Our professional drivers collect laundry directly from customers’ doorsteps and transport it to our trusted partner laundry facilities, ensuring efficient turnaround and delivery within 24 hours.
          </p>
        </div>
        
        <Button 
          onClick={handleContinue}
          className="w-full max-w-xs mt-6 md:mt-12"
        >
          Acknowledged
        </Button>
      </div>
    </PageLayout>
  );
};

export default About;
