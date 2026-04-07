import { lazy, Suspense } from "react";
import { Toaster, TooltipProvider } from "@lh/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Lazy load all route components for code splitting
// Driver Pages
const Welcome = lazy(() => import("./pages/Welcome"));
const Verify = lazy(() => import("./pages/Verify"));
const ConfirmDetails = lazy(() => import("./pages/ConfirmDetails"));
const Introduction = lazy(() => import("./pages/Introduction"));
const About = lazy(() => import("./pages/About"));
const Role = lazy(() => import("./pages/Role"));
const Availability = lazy(() => import("./pages/Availability"));
const FacilityLocations = lazy(() => import("./pages/FacilityLocations"));
const Liabilities = lazy(() => import("./pages/Liabilities"));
const SmokingFitnessCheck = lazy(() => import("./pages/SmokingFitnessCheck"));
const BlocksClassification = lazy(() => import("./pages/BlocksClassification"));
const HowRouteWorks = lazy(() => import("./pages/HowRouteWorks"));
const CancellationPolicy = lazy(() => import("./pages/CancellationPolicy"));
const FeeStructure = lazy(() => import("./pages/FeeStructure"));
const PaymentCycleSchedule = lazy(() => import("./pages/PaymentCycleSchedule"));
const AcknowledgementsSummary = lazy(() => import("./pages/AcknowledgementsSummary"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <Toaster />
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
              </div>
            }>
              <Routes>
                {/* Driver Onboarding Routes */}
                <Route path="/" element={<Welcome />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/confirm-details" element={<ConfirmDetails />} />
                <Route path="/introduction" element={<Introduction />} />
                <Route path="/about" element={<About />} />
                <Route path="/role" element={<Role />} />
                <Route path="/availability" element={<Availability />} />
                <Route path="/facility-locations" element={<FacilityLocations />} />
                <Route path="/liabilities" element={<Liabilities />} />
                <Route path="/smoking-fitness-check" element={<SmokingFitnessCheck />} />
                <Route path="/blocks-classification" element={<BlocksClassification />} />
                <Route path="/fee-structure" element={<FeeStructure />} />
                <Route path="/payment-cycle-schedule" element={<PaymentCycleSchedule />} />
                <Route path="/how-route-works" element={<HowRouteWorks />} />
                <Route path="/cancellation-policy" element={<CancellationPolicy />} />
                <Route path="/acknowledgements-summary" element={<AcknowledgementsSummary />} />
                <Route path="/thank-you" element={<ThankYou />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
