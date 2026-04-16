import { lazy, Suspense, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminHome = lazy(() => import("./pages/AdminHome"));
const ApplicationPipeline = lazy(() => import("./components/admin/ApplicationPipeline"));
const JobManager = lazy(() => import("./components/admin/JobManager"));
const CallQueue = lazy(() => import("./components/admin/CallQueue"));
const AnalyticsDashboard = lazy(() => import("./components/admin/AnalyticsDashboard"));
const CityManager = lazy(() => import("./components/admin/CityManager"));
const EmailTemplateManager = lazy(() => import("./components/admin/EmailTemplateManager"));
const QuestionnaireBuilder = lazy(() => import("./components/admin/QuestionnaireBuilder"));
const FeeStructureManager = lazy(() => import("./components/admin/FeeStructureManager"));
const FacilityManager = lazy(() => import("./components/admin/FacilityManager"));
const AdminManager = lazy(() => import("./components/admin/AdminManager"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
import { Toaster } from "@lh/shared";
import "./index.css";

function AdminRoutes() {
  const { isAuthenticated, isAuthorized, isLoading } = useAdminAuth();
  const isAllowed = isAuthenticated && isAuthorized;

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route
        path="/"
        element={
          isAllowed ? (
            <AdminShell />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/pipeline"
        element={isAllowed ? <AdminShell /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/jobs"
        element={isAllowed ? <AdminShell /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/calls"
        element={isAllowed ? <AdminShell /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/analytics"
        element={isAllowed ? <AdminShell /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/settings/:section"
        element={isAllowed ? <AdminShell /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AdminShell() {
  return (
    <ShellRouter />
  );
}

function ShellRouter() {
  const { pathname: path } = useLocation();
  const [counts, setCounts] = useState({ pipeline: 0, calls: 0 });

  let content = <AdminHome onCounts={setCounts} />;
  if (path === "/pipeline") content = <ApplicationPipeline />;
  if (path === "/jobs") content = <JobManager />;
  if (path === "/calls") content = <CallQueue />;
  if (path === "/analytics") content = <AnalyticsDashboard />;
  if (path === "/settings/regions") content = <CityManager />;
  if (path === "/settings/cities") content = <CityManager />;
  if (path === "/settings/templates") content = <EmailTemplateManager />;
  if (path === "/settings/questionnaires") content = <QuestionnaireBuilder />;
  if (path === "/settings/fees") content = <FeeStructureManager />;
  if (path === "/settings/facilities") content = <FacilityManager />;
  if (path === "/settings/team") content = <AdminManager />;

  return <AdminLayout counts={counts}>{content}</AdminLayout>;
}

function App() {
  return (
    <AdminAuthProvider>
      <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">Loading...</div>}>
        <AdminRoutes />
      </Suspense>
      <Toaster />
    </AdminAuthProvider>
  );
}

export default App;
