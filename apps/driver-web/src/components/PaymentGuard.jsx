import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GlobalLoadingScreen from "./GlobalLoadingScreen";

const PaymentGuard = ({ children }) => {
  const { application, isLoading } = useAuth();

  if (isLoading) {
    return <GlobalLoadingScreen message="Loading…" />;
  }

  if (application?.currentStage !== "payment_details_pending") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PaymentGuard;
