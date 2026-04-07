import apiClient from './api-client';
import { saveAuthToken, clearAuthToken } from './cookie-utils';

// Collection names (no longer needed for direct access, but kept for reference)
const COLLECTIONS = {
  DRIVERS: 'drivers',
  FOUNTAIN_APPLICANTS: 'fountain_applicants',
  ONBOARDING: 'onboarding',
  AVAILABILITY: 'availability',
  VERIFICATION: 'verification',
  REPORTS: 'reports',
  FEE_STRUCTURES: 'fee_structures',
  FACILITIES: 'facilities'
};

// Authentication Services
export const authServices = {
  // Check if email exists in Fountain applicants
  async checkFountainApplicant(email) {
    try {
      const result = await apiClient.post('/auth/check-email', { email });
      return result;
    } catch (error) {
      console.error('Error checking Fountain applicant:', error);
      return { exists: false, error: error.message };
    }
  },

  // Verify phone number against Fountain data
  async verifyPhoneNumber(email, phone) {
    try {
      const result = await apiClient.post('/auth/verify-phone', { email, phone });

      if (result.success && result.token) {
        // Store email in localStorage BEFORE sign-in
        localStorage.setItem('driver_email', email);
        // Save token to cookie for session persistence
        saveAuthToken(result.token);

        return {
          success: true,
          applicant: result.applicant,
          token: result.token,
        };
      }

      return {
        success: false,
        message: result.message || "Verification failed",
      };
    } catch (error) {
      console.error('Error verifying phone number:', error);
      return {
        success: false,
        message: error.message || 'Unable to verify phone number.',
      };
    }
  },

  // Sign out
  async signOut() {
    try {
      // Clear authentication token from cookies
      clearAuthToken();
      // Clear local storage
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      clearAuthToken();
      return false;
    }
  },

  hasSessionCookie() {
    // getAuthToken is called inside this in cookie-utils
    return localStorage.getItem('auth_token') !== null || document.cookie.includes('auth_token');
  },
};

// Driver Data Services
export const driverServices = {
  // Update driver personal details
  async updatePersonalDetails(email, details) {
    try {
      await apiClient.put('/drivers/personal-details', details);
      return true;
    } catch (error) {
      console.error('❌ Error updating personal details:', error);
      throw error;
    }
  },

  // Save availability data
  async saveAvailability(email, availability) {
    try {
      await apiClient.post('/drivers/availability', { availability });
      return true;
    } catch (error) {
      console.error('Error saving availability:', error);
      throw error;
    }
  },

  // Save verification data
  async saveVerification(email, verificationData) {
    try {
      await apiClient.post('/drivers/verification', verificationData);
      return true;
    } catch (error) {
      console.error('❌ Error saving verification:', error);
      throw error;
    }
  },

  // Get driver data
  async getDriverData(email) {
    try {
      const result = await apiClient.get('/drivers/me');
      return result.driver;
    } catch (error) {
      console.error('Error getting driver data:', error);
      return null;
    }
  },

  // Get availability data
  async getAvailability(email) {
    try {
      const result = await apiClient.get('/drivers/me');
      return { availability: result.driver?.availability };
    } catch (error) {
      console.error('Error getting availability:', error);
      return null;
    }
  },

  // Get verification data
  async getVerification(email) {
    try {
      const result = await apiClient.get('/drivers/me');
      return result.driver?.verification;
    } catch (error) {
      console.error('Error getting verification:', error);
      return null;
    }
  },

  // Complete onboarding
  async completeOnboarding(email) {
    try {
      await apiClient.post('/drivers/complete-onboarding');
      return true;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return false;
    }
  },

  // Update onboarding progress
  async updateOnboardingProgress(email, step, data) {
    try {
      await apiClient.post('/drivers/progress', { step, data });
      return true;
    } catch (error) {
      console.error('Error updating onboarding progress:', error);
      return false;
    }
  },

  // Check if email exists (used in some places)
  async checkEmailExists(email) {
    try {
      const result = await authServices.checkFountainApplicant(email);
      return result.exists;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  },

  // Generate onboarding report
  async generateReport(email) {
    try {
      // This is a placeholder as report generation logic might need more work on backend
      return { success: true, reportId: `MOCK_REPORT_${Date.now()}` };
    } catch (error) {
      console.error('Error generating report:', error);
      return { success: false, message: error.message };
    }
  },
};

// Acknowledgement Services
export const acknowledgementServices = {
  async acknowledgeFeeStructure() {
    try {
      await apiClient.post('/drivers/acknowledge/feeStructure');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  async acknowledgeLiabilities() {
    try {
      await apiClient.post('/drivers/acknowledge/liabilities');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  async acknowledgeCancellationPolicy() {
    try {
      await apiClient.post('/drivers/acknowledge/cancellationPolicy');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  async acknowledgePaymentCycleSchedule() {
    try {
      await apiClient.post('/drivers/acknowledge/paymentCycleSchedule');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

// Fee Structure Services
export const feeStructureServices = {
  async getFeeStructuresByCity(city) {
    try {
      // For now, return null or implement on backend
      return null;
    } catch (error) {
      return null;
    }
  },
};

// Facility Services
export const facilityServices = {
  async getFacilitiesByCity(city) {
    try {
      return [];
    } catch (error) {
      return [];
    }
  },
};
