import { lazy, Suspense } from "react";
import { Toaster, TooltipProvider } from "@lh/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ScreeningGuard from "./components/ScreeningGuard";
import DocumentsGuard from "./components/DocumentsGuard";
import PaymentGuard from "./components/PaymentGuard";
import QuestionnaireGuard from "./components/QuestionnaireGuard";
import GlobalLoadingScreen from "./components/GlobalLoadingScreen";
import OfflineBanner from "./components/OfflineBanner";

// Lazy load all route components for code splitting
// Driver Pages
const ConfirmDetails = lazy(() => import("./pages/ConfirmDetails"));
const VehicleCheck = lazy(() => import("./pages/VehicleCheck"));
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
const JobApplication = lazy(() => import("./pages/JobApplication"));
const DriverLogin = lazy(() => import("./pages/DriverLogin"));
const DriverDashboard = lazy(() => import("./pages/DriverDashboard"));
const ScreeningLanding = lazy(() => import("./pages/ScreeningLanding"));
const DocumentUpload = lazy(() => import("./pages/DocumentUpload"));
const PaymentDetails = lazy(() => import("./pages/PaymentDetails"));
const QuestionnairePage = lazy(() => import("./pages/QuestionnairePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 300_000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <OfflineBanner />
            <Toaster />
            <Suspense fallback={
              <GlobalLoadingScreen message="Preparing your dashboard..." />
            }>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/apply/:slug" element={<JobApplication />} />
                <Route path="/login" element={<DriverLogin />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DriverDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/screening"
                  element={
                    <ProtectedRoute>
                      <ScreeningGuard />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<ScreeningLanding />} />
                  <Route path="confirm-details" element={<ConfirmDetails />} />
                  <Route path="vehicle-check" element={<VehicleCheck />} />
                  <Route path="introduction" element={<Introduction />} />
                  <Route path="about" element={<About />} />
                  <Route path="role" element={<Role />} />
                  <Route path="availability" element={<Availability />} />
                  <Route path="facility-locations" element={<FacilityLocations />} />
                  <Route path="blocks-classification" element={<BlocksClassification />} />
                  <Route path="fee-structure" element={<FeeStructure />} />
                  <Route path="payment-cycle-schedule" element={<PaymentCycleSchedule />} />
                  <Route path="how-route-works" element={<HowRouteWorks />} />
                  <Route path="cancellation-policy" element={<CancellationPolicy />} />
                  <Route path="smoking-fitness-check" element={<SmokingFitnessCheck />} />
                  <Route path="liabilities" element={<Liabilities />} />
                  <Route path="summary" element={<AcknowledgementsSummary />} />
                </Route>
                <Route
                  path="/documents"
                  element={
                    <ProtectedRoute>
                      <DocumentsGuard>
                        <DocumentUpload />
                      </DocumentsGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment"
                  element={
                    <ProtectedRoute>
                      <PaymentGuard>
                        <PaymentDetails />
                      </PaymentGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/questionnaire"
                  element={
                    <ProtectedRoute>
                      <QuestionnaireGuard>
                        <QuestionnairePage />
                      </QuestionnaireGuard>
                    </ProtectedRoute>
                  }
                />

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
