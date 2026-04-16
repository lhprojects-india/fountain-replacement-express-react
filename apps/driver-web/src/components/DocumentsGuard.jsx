import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DocumentsGuard = ({ children }) => {
  const { application, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!["documents_pending", "documents_under_review"].includes(application?.currentStage)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default DocumentsGuard;
