import { Navigate } from "react-router-dom";
import { getAuthToken } from "@lh/shared";
import { useAuth } from "../context/AuthContext";
import GlobalLoadingScreen from "./GlobalLoadingScreen";

const ProtectedRoute = ({ children }) => {
  const { isLoading, isAuthenticated } = useAuth();
  const token = getAuthToken();

  if (isLoading) {
    return <GlobalLoadingScreen message="Loading your session..." />;
  }

  if (!isAuthenticated || !token) {
    return <Navigate to="/login?expired=1" replace />;
  }

  return children;
};

export default ProtectedRoute;
