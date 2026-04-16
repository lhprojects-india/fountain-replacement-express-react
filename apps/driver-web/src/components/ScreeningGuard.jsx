import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ApplicationProvider } from "../context/ApplicationContext";
import GlobalLoadingScreen from "./GlobalLoadingScreen";

const ALLOWED_STAGES = new Set(["screening", "acknowledgements"]);

const ScreeningGuard = () => {
  const { application, isLoading } = useAuth();
  const currentStage = application?.currentStage;
  const location = useLocation();

  useEffect(() => {
    // Protect against accidental tab close/reload during screening forms.
    if (!location.pathname.startsWith("/screening")) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = "Are you sure? Your progress will be saved.";
      return event.returnValue;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [location.pathname]);

  useEffect(() => {
    // Lightweight in-app navigation confirm for links inside screening routes.
    if (!location.pathname.startsWith("/screening")) return undefined;
    const onDocumentClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (href.startsWith("/screening")) return;
      const ok = window.confirm("Are you sure you want to leave screening? Your progress will be saved.");
      if (!ok) {
        event.preventDefault();
      }
    };
    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [location.pathname]);

  if (isLoading) {
    return <GlobalLoadingScreen message="Loading screening..." />;
  }

  if (!ALLOWED_STAGES.has(currentStage)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ApplicationProvider>
      <Outlet />
    </ApplicationProvider>
  );
};

export default ScreeningGuard;
