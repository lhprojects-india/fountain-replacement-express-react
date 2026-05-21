import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GlobalLoadingScreen from "./GlobalLoadingScreen";

const DocumentsGuard = ({ children }) => {
  const { application, isLoading } = useAuth();

  if (isLoading) {
    return <GlobalLoadingScreen message="Loading…" />;
  }

  if (!["documents_pending", "documents_under_review"].includes(application?.currentStage)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default DocumentsGuard;
