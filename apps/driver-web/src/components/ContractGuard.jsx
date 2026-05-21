import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GlobalLoadingScreen from "./GlobalLoadingScreen";

const ContractGuard = ({ children }) => {
  const { application, isLoading } = useAuth();

  if (isLoading) {
    return <GlobalLoadingScreen message="Loading…" />;
  }

  if (application?.currentStage !== "contract_sent") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ContractGuard;
