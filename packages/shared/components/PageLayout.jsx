import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import LaundryheapLogo from "../assets/logo";
import { ProductBrandHeading } from "./ProductBrandHeading";
import ProgressBar from "./ui/progress-bar";

// Routes that should show the progress bar (from confirm-details to liabilities)
const PROGRESS_BAR_ROUTES = [
  '/confirm-details',
  '/introduction',
  '/about',
  '/role',
  '/availability',
  '/facility-locations',
  '/blocks-classification',
  '/fee-structure',
  '/how-route-works',
  '/cancellation-policy',
  '/smoking-fitness-check',
  '/liabilities',
];

// Routes that show the product name in the nav header (not the logo-only welcome page)
const NAV_HEADER_ROUTES = [
  '/verify',
  '/confirm-details',
  '/introduction',
  '/about',
  '/role',
  '/availability',
  '/facility-locations',
  '/blocks-classification',
  '/fee-structure',
  '/how-route-works',
  '/cancellation-policy',
  '/smoking-fitness-check',
  '/liabilities',
  '/acknowledgements-summary',
  '/thank-you',
];

function PageLayout({
  children,
  title,
  subtitle,
  compact = false,
  routes = PROGRESS_BAR_ROUTES,
  basePath = "/",
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isScreeningFlow = basePath === "/screening";

  const navRoutes = isScreeningFlow
    ? ["/screening", ...routes]
    : NAV_HEADER_ROUTES;
  const progressRoutes = routes;

  const showProgressBar = progressRoutes.includes(location.pathname) && !isAdminPage;
  const showNavHeader = navRoutes.includes(location.pathname) && !isAdminPage;

  return (
    <div className="laundryheap-page min-h-screen flex flex-col">
      {showNavHeader ? (
        <div className="w-full flex items-center justify-between px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-white/40 transition-colors text-brand-shadeBlue"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <ProductBrandHeading
            className="items-center text-center max-w-[min(100%,14rem)]"
            mainClassName="text-base font-semibold text-brand-shadeBlue"
            bylineClassName="text-xs font-medium text-brand-shadeBlue/80 mt-0.5"
          />
          <div className="w-9" />
        </div>
      ) : (
        <LaundryheapLogo />
      )}

      {showProgressBar && (
        <ProgressBar routes={progressRoutes} label={isScreeningFlow ? "Screening Progress" : "Onboarding Progress"} />
      )}
      
      {title && (
        <h1 className={`text-center text-lg md:text-xl mt-2 md:mt-6 mb-4 md:mb-8 font-semibold text-brand-shadeBlue animate-slide-up ${compact ? "text-2xl md:text-3xl" : ""}`}>
          {title}
        </h1>
      )}
      
      {subtitle && (
        <h2 className="text-center text-base md:text-lg mt-2 md:mt-6 mb-4 md:mb-8 font-medium text-brand-shadeBlue animate-slide-up">
          {subtitle}
        </h2>
      )}
      
      <div className="flex-1 w-full flex flex-col items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
}

export default PageLayout;
