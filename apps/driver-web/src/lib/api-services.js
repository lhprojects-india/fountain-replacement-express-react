import { apiClient, clearAuthToken } from "@lh/shared";

export const authServices = {
  async signOut() {
    try {
      clearAuthToken();
      localStorage.clear();
      return true;
    } catch (error) {
      clearAuthToken();
      return false;
    }
  },
};

export const driverServices = {
  async updatePersonalDetails(_email, details) {
    await apiClient.put("/drivers/personal-details", details);
    return true;
  },
  async saveAvailability(_email, availability) {
    await apiClient.post("/drivers/availability", { availability });
    return true;
  },
  async saveVerification(_email, verificationData) {
    await apiClient.post("/drivers/verification", verificationData);
    return true;
  },
  async getDriverData(_email) {
    const result = await apiClient.get("/drivers/me");
    return result.driver;
  },
  async completeOnboarding(_email) {
    await apiClient.post("/drivers/complete-onboarding");
    return true;
  },
  async updateOnboardingProgress(_email, step, data) {
    await apiClient.post("/drivers/progress", { step, data });
    return true;
  },
};

export const acknowledgementServices = {
  async acknowledgeFeeStructure() {
    await apiClient.post("/drivers/acknowledge/feeStructure");
    return { success: true };
  },
  async acknowledgeLiabilities() {
    await apiClient.post("/drivers/acknowledge/liabilities");
    return { success: true };
  },
  async acknowledgeCancellationPolicy() {
    await apiClient.post("/drivers/acknowledge/cancellationPolicy");
    return { success: true };
  },
  async acknowledgePaymentCycleSchedule() {
    await apiClient.post("/drivers/acknowledge/paymentCycleSchedule");
    return { success: true };
  },
};

export const feeStructureServices = {
  async getFeeStructuresByCity(_city) {
    const result = await apiClient.get("/driver/application/fee-structure");
    const structure = result?.feeStructure;
    if (!structure) return null;

    return {
      city: structure.city,
      currency: result?.currencySymbol || "£",
      blocks: structure.blocks || [],
      averageHourlyEarnings: structure.perHour || "",
      averagePerTaskEarnings: structure.perTask || "",
    };
  },
};

export const facilityServices = {
  async getFacilitiesByCity(city) {
    const params = city ? `?city=${encodeURIComponent(city)}` : "";
    const result = await apiClient.get(`/drivers/facilities${params}`);
    return result.facilities || [];
  },
};
