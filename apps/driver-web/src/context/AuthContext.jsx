import { createContext, useContext, useState, useEffect } from "react";
import {
  useToast,
  getAuthToken,
  saveAuthToken,
  clearAuthToken,
  saveLocalDriverData,
  getLocalDriverData,
  PRODUCT_DISPLAY_NAME,
} from "@lh/shared";
import { authServices, driverServices } from "../lib/api-services";
import { publicServices } from "../lib/public-services";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [application, setApplication] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = getAuthToken();
      const { email: storedEmail } = getLocalDriverData();

      if (token && storedEmail) {
        try {
          let userData = null;

          // Prefer new Day-1 session endpoint for OTP auth.
          try {
            const sessionResult = await publicServices.getDriverSession();
            userData = sessionResult?.application
              ? { email: sessionResult.application.email, application: sessionResult.application }
              : null;
          } catch (sessionError) {
            userData = await driverServices.getDriverData(storedEmail);
          }

          if (userData) {
            setCurrentUser({
              email: storedEmail,
              ...userData,
            });
            try {
              const appResult = await publicServices.getDriverApplication();
              setApplication(appResult?.application || null);
            } catch (appError) {
              setApplication(null);
            }
            setIsAuthenticated(true);
          } else {
            // Token might be invalid or user not found
            clearAuthToken();
            setIsAuthenticated(false);
          }
        } catch (error) {
          clearAuthToken();
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const requestCode = async (email) => {
    setIsLoading(true);
    const normalizedEmail = (email || "").trim().toLowerCase();
    try {
      const result = await publicServices.requestVerificationCode(normalizedEmail);
      saveLocalDriverData({ email: normalizedEmail });
      setCurrentUser((prev) => ({ ...prev, email: normalizedEmail }));
      setApplication(null);
      setIsLoading(false);
      return result;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const verifyCode = async (email, code) => {
    setIsLoading(true);
    const normalizedEmail = (email || "").trim().toLowerCase();
    try {
      const result = await publicServices.verifyCode(normalizedEmail, code);
      if (result?.token) {
        saveAuthToken(result.token);
      }
      saveLocalDriverData({ email: normalizedEmail });
      setCurrentUser({
        email: normalizedEmail,
        application: result?.application ?? null,
      });
      try {
        const appResult = await publicServices.getDriverApplication();
        setApplication(appResult?.application || null);
      } catch (appError) {
        setApplication(result?.application ?? null);
      }
      setIsAuthenticated(true);
      setIsLoading(false);
      return result;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const getSession = async () => {
    const result = await publicServices.getDriverSession();
    if (result?.application) {
      setCurrentUser((prev) => ({
        ...prev,
        email: result.application.email || prev?.email,
        application: result.application,
      }));
      try {
        const appResult = await publicServices.getDriverApplication();
        setApplication(appResult?.application || null);
      } catch (appError) {
        setApplication(result.application);
      }
      setIsAuthenticated(true);
    }
    return result;
  };

  const loadDriverApplication = async () => {
    const result = await publicServices.getDriverApplication();
    setApplication(result?.application || null);
    return result;
  };

  // Update user data
  const updateUserData = async (data) => {
    if (!isAuthenticated) return false;

    try {
      const success = await driverServices.updatePersonalDetails(currentUser.email, data);
      if (success) {
        setCurrentUser(prev => ({ ...prev, ...data }));
        if (data.step) {
          await driverServices.updateOnboardingProgress(currentUser.email, data.step, data);
        }
        return true;
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Unable to save your information.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Save availability data
  const saveAvailability = async (availability) => {
    if (!isAuthenticated) return false;

    try {
      const success = await driverServices.saveAvailability(currentUser.email, availability);
      if (success) {
        setCurrentUser(prev => ({ ...prev, availability }));
        return true;
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Unable to save availability.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Save verification data
  const saveVerificationData = async (verificationData) => {
    if (!isAuthenticated) return false;

    try {
      const success = await driverServices.saveVerification(currentUser.email, verificationData);
      if (success) {
        setCurrentUser(prev => ({ ...prev, ...verificationData }));
        return true;
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Unable to save verification data.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    if (!isAuthenticated) return false;

    try {
      const success = await driverServices.completeOnboarding(currentUser.email);
      if (success) {
        setCurrentUser(prev => ({
          ...prev,
          onboardingStatus: 'completed',
        }));
        toast({
          title: "Onboarding completed",
          description: `Welcome to the ${PRODUCT_DISPLAY_NAME} driver team!`,
        });
        return true;
      }
    } catch (error) {
      toast({
        title: "Completion failed",
        description: "Unable to complete onboarding.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Sign out
  const signOut = async () => {
    await authServices.signOut();
    setCurrentUser(null);
    setApplication(null);
    setIsAuthenticated(false);
    toast({
      title: "Signed out successfully",
    });
    return true;
  };

  const value = {
    currentUser,
    application,
    isAuthenticated,
    isLoading,
    requestCode,
    verifyCode,
    getSession,
    loadDriverApplication,
    updateUserData,
    saveAvailability,
    saveVerificationData,
    completeOnboarding,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
