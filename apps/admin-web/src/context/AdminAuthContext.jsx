import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { useToast, apiClient, saveAuthToken, clearAuthToken, getAuthToken } from "@lh/shared";

const AdminAuthContext = createContext(undefined);

export function AdminAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminRole, setAdminRole] = useState(null);
  const { toast } = useToast();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  // Restore session
  useEffect(() => {
    const restoreSession = async () => {
      const token = getAuthToken();

      if (token && isAdminRoute) {
        try {
          const result = await apiClient.get('/admin/me');
          if (result.success && result.admin) {
            setCurrentUser(result.admin);
            setAdminRole(result.admin.role);
            setIsAuthenticated(true);
            setIsAuthorized(true);
          }
        } catch (error) {
          console.error("Failed to restore admin session:", error);
          clearAuthToken();
        }
      }
      setIsLoading(false);
    };

    if (isAdminRoute) {
      restoreSession();
    } else {
      setIsLoading(false);
    }
  }, [isAdminRoute]);

  // Sign in with Google via Firebase
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await apiClient.post('/auth/admin-google-login', { idToken });

      if (response.success && response.token) {
        saveAuthToken(response.token);
        setCurrentUser(response.admin);
        setAdminRole(response.admin.role);
        setIsAuthenticated(true);
        setIsAuthorized(true);

        toast({
          title: "Welcome to Admin Panel",
          description: `Signed in as ${response.admin.email}`,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error signing in with Google:', error);

      let description = "An unexpected error occurred. Please try again.";
      if (error.code === "auth/popup-closed-by-user") {
        description = "Sign-in popup was closed. Please try again.";
      } else if (error.code === "ERR_NETWORK") {
        description = "Backend is unreachable. Start backend server on http://localhost:5001 and try again.";
      } else if (error.message) {
        description = error.message;
      }

      toast({
        title: "Sign in failed",
        description,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore firebase signout errors
    }
    clearAuthToken();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsAuthorized(false);
    setAdminRole(null);
    toast({
      title: "Signed out successfully",
    });
    return true;
  };

  const value = {
    currentUser,
    isAuthenticated,
    isAuthorized,
    isLoading,
    adminRole,
    signInWithGoogle,
    signOut,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
