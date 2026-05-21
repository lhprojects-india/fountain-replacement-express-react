import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GlobalLoadingScreen from "./GlobalLoadingScreen";

const QuestionnaireGuard = ({ children }) => {
  const { application, isLoading } = useAuth();

  if (isLoading) {
    return <GlobalLoadingScreen message="Loading…" />;
  }

  if (!["questionnaire", "decision_pending"].includes(application?.currentStage)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default QuestionnaireGuard;
