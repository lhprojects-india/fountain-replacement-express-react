import axios from "axios";
import { getAuthToken } from "@lh/shared";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const base = () => API_URL.replace(/\/$/, "");

/**
 * Unauthenticated calls for public apply flow.
 */
export const publicServices = {
  async getJobBySlug(slug) {
    const { data } = await axios.get(
      `${base()}/public/jobs/${encodeURIComponent(slug)}`
    );
    return data;
  },

  async submitApplication(payload) {
    const { data } = await axios.post(`${base()}/public/applications`, payload);
    return data;
  },

  async requestVerificationCode(email) {
    const { data } = await axios.post(`${base()}/auth/driver/request-code`, { email });
    return data;
  },

  async verifyCode(email, code) {
    const { data } = await axios.post(`${base()}/auth/driver/verify-code`, { email, code });
    return data;
  },

  async getDriverSession() {
    const token = getAuthToken();
    const { data } = await axios.get(`${base()}/auth/driver/session`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async getDriverApplication() {
    const token = getAuthToken();
    const { data } = await axios.get(`${base()}/driver/application`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async getDriverApplicationTimeline() {
    const token = getAuthToken();
    const { data } = await axios.get(`${base()}/driver/application/timeline`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async getDriverApplicationStageInfo() {
    const token = getAuthToken();
    const { data } = await axios.get(`${base()}/driver/application/stage-info`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async withdrawDriverApplication(reason = "") {
    const token = getAuthToken();
    const { data } = await axios.post(
      `${base()}/driver/application/withdraw`,
      { reason },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return data;
  },

  async getScreeningProgress() {
    const token = getAuthToken();
    const { data } = await axios.get(`${base()}/driver/application/screening`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async completeScreening() {
    const token = getAuthToken();
    const { data } = await axios.post(
      `${base()}/driver/application/screening/complete`,
      {},
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return data;
  },

  async submitVehicleCheck(payload) {
    const token = getAuthToken();
    const { data } = await axios.post(
      `${base()}/driver/application/screening/vehicle-check`,
      payload,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return data;
  },

  async updateApplicationProfile(payload) {
    const token = getAuthToken();
    const { data } = await axios.put(`${base()}/driver/application/profile`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async markDriverProgress(step, data = {}) {
    const token = getAuthToken();
    const { data: response } = await axios.post(
      `${base()}/drivers/progress`,
      { step, data },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return response;
  },

  async saveDriverAvailability(availability) {
    const token = getAuthToken();
    const { data } = await axios.post(
      `${base()}/drivers/availability`,
      { availability },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return data;
  },

  async updateDriverPersonalDetails(payload) {
    const token = getAuthToken();
    const { data } = await axios.put(`${base()}/drivers/personal-details`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async acknowledgePolicy(policyKey) {
    const token = getAuthToken();
    const { data } = await axios.post(
      `${base()}/drivers/acknowledge/${encodeURIComponent(policyKey)}`,
      {},
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return data;
  },

  async getApplicationFeeStructure() {
    const token = getAuthToken();
    const { data } = await axios.get(`${base()}/driver/application/fee-structure`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async getApplicationCityConfig() {
    const token = getAuthToken();
    const { data } = await axios.get(`${base()}/driver/application/city-config`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async resendContract() {
    const token = getAuthToken();
    const { data } = await axios.post(
      `${base()}/driver/application/contract/resend`,
      {},
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return data;
  },

  async getDriverDocuments() {
    const token = getAuthToken();
    const { data } = await axios.get(`${base()}/driver/documents`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async requestDocumentUploadUrl(payload) {
    const token = getAuthToken();
    const { data } = await axios.post(`${base()}/driver/documents/upload-url`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async confirmDocumentUpload(documentId, durationSec = null) {
    const token = getAuthToken();
    const { data } = await axios.post(
      `${base()}/driver/documents/confirm`,
      { documentId, durationSec },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return data;
  },

  async deleteDriverDocument(documentId) {
    const token = getAuthToken();
    const { data } = await axios.delete(`${base()}/driver/documents/${encodeURIComponent(documentId)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async getDriverDocumentDownloadUrl(documentId) {
    const token = getAuthToken();
    const { data } = await axios.get(
      `${base()}/driver/documents/${encodeURIComponent(documentId)}/download`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return data;
  },

  async submitDriverDocuments() {
    const token = getAuthToken();
    const { data } = await axios.post(
      `${base()}/driver/documents/submit`,
      {},
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    return data;
  },

  async requestDocumentReuploadUrl(documentId, payload) {
    const token = getAuthToken();
    const { data } = await axios.post(
      `${base()}/driver/documents/${encodeURIComponent(documentId)}/reupload`,
      payload,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    return data;
  },

  async getPaymentSchema() {
    const token = getAuthToken();
    const { data } = await axios.get(`${base()}/driver/payment/schema`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async getPaymentDetails() {
    const token = getAuthToken();
    const { data } = await axios.get(`${base()}/driver/payment`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async submitPaymentDetails(details) {
    const token = getAuthToken();
    const { data } = await axios.post(
      `${base()}/driver/payment`,
      { details },
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    return data;
  },

  async getDriverQuestionnaire() {
    const token = getAuthToken();
    const { data } = await axios.get(`${base()}/driver/questionnaire`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async submitDriverQuestionnaire(questionnaireId, answers) {
    const token = getAuthToken();
    const { data } = await axios.post(
      `${base()}/driver/questionnaire/submit`,
      { questionnaireId, answers },
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    return data;
  },

  async getDriverQuestionnaireResult() {
    const token = getAuthToken();
    const { data } = await axios.get(`${base()}/driver/questionnaire/result`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },
};
