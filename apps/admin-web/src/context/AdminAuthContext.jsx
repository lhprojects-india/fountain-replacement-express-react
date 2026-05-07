import { createContext, useContext, useState, useEffect } from "react";
import { useToast, apiClient, saveAuthToken, clearAuthToken, getAuthToken } from "@lh/shared";

const AdminAuthContext = createContext(undefined);

export function AdminAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminRole, setAdminRole] = useState(null);
  const { toast } = useToast();

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await apiClient.get('/admin/me');
        if (result.success && result.admin) {
          setCurrentUser(result.admin);
          setAdminRole(result.admin.role);
          setIsAuthenticated(true);
          setIsAuthorized(true);
        }
      } catch (error) {
        clearAuthToken();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const signInWithEmailPassword = async (email, password) => {
    try {
      setIsLoading(true);
      const normalized = email?.toLowerCase().trim();
      if (!normalized || !password) {
        toast({
          title: "Missing credentials",
          description: "Enter email and password.",
          variant: "destructive",
        });
        return false;
      }
      const response = await apiClient.post("/auth/admin-login", {
        email: normalized,
        password,
      });
      if (response.success && response.token) {
        saveAuthToken(response.token);
        setCurrentUser(response.admin);
        setAdminRole(response.admin.role);
        setIsAuthenticated(true);
        setIsAuthorized(true);
        toast({
          title: "Signed in",
          description: response.admin.email,
        });
        return true;
      }
      return false;
    } catch (error) {
      const description =
        error?.message || error?.error || "Invalid email or password.";
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
    signInWithEmailPassword,
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
