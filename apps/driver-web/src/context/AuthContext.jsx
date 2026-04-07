import { createContext, useContext, useState, useEffect } from "react";
import {
  useToast,
  getAuthToken,
  clearAuthToken,
  saveLocalDriverData,
  getLocalDriverData,
} from "@lh/shared";
import { authServices, driverServices } from "../lib/firebase-services";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
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
          // Attempt to fetch driver data using the token
          const userData = await driverServices.getDriverData(storedEmail);
          
          if (userData) {
            setCurrentUser({
              email: storedEmail,
              ...userData,
            });
            setIsAuthenticated(true);
          } else {
            // Token might be invalid or user not found
            clearAuthToken();
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Failed to restore session:", error);
          clearAuthToken();
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  // Check if email exists in Fountain applicants
  const checkEmail = async (email) => {
    setIsLoading(true);
    try {
      const result = await authServices.checkFountainApplicant(email);
      if (result.exists) {
        // Store email and fountain applicant data
        const userData = {
          email,
          fountainData: {
            phone: result.phone,
            name: result.name,
            applicantId: result.applicantId,
            city: result.city,
            country: result.country,
            funnelId: result.funnelId,
          }
        };
        setCurrentUser(userData);

        // Persist to localStorage
        saveLocalDriverData({
          email,
          fountainData: userData.fountainData
        });

        toast({
          title: "Email verified",
          description: "Please enter your registered mobile number to continue.",
        });
        setIsLoading(false);
        return { success: true, data: result };
      } else {
        toast({
          title: "Email not found",
          description: "No application found with this email. Please apply on Fountain first.",
          variant: "destructive",
        });
        setIsLoading(false);
        return { success: false };
      }
    } catch (error) {
      console.error("Email check failed", error);
      toast({
        title: "Verification failed",
        description: "Unable to verify email. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return { success: false };
    }
  };

  // Verify phone number
  const verifyPhone = async (phone) => {
    let emailToUse = currentUser?.email || getLocalDriverData().email;

    if (!emailToUse) {
      toast({
        title: "No email found",
        description: "Please restart the authentication process.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    try {
      const result = await authServices.verifyPhoneNumber(emailToUse, phone);
      if (result.success) {
        // Update local state with applicant data and token is already saved in cookie
        setCurrentUser(prev => ({
          ...prev,
          email: emailToUse,
          fountainData: result.applicant,
          phoneVerified: true,
        }));
        
        setIsAuthenticated(true);
        toast({
          title: "Verification successful",
          description: "Welcome to Laundryheap driver onboarding!",
        });
        setIsLoading(false);
        return true;
      } else {
        toast({
          title: "Verification failed",
          description: result.message || "Mobile number does not match our records.",
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error("Phone verification failed", error);
      toast({
        title: "Verification failed",
        description: "Unable to verify mobile number. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
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
      console.error("Error updating user data:", error);
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
      console.error("Error saving availability:", error);
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
      console.error("Error saving verification data:", error);
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
          description: "Welcome to the Laundryheap driver team!",
        });
        return true;
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
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
    setIsAuthenticated(false);
    toast({
      title: "Signed out successfully",
    });
    return true;
  };

  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    checkEmail,
    verifyPhone,
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
