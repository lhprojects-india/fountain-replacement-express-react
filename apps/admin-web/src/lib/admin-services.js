import { apiClient, getAuthToken } from "@lh/shared";
const REJECTION_REASONS = [
  "does_not_meet_requirements",
  "failed_screening",
  "documents_invalid",
  "failed_questionnaire",
  "failed_first_block",
  "no_response",
  "duplicate_application",
  "other",
];

// Admin Services
export const adminServices = {
  // Get all applications (show all fountain_applicants)
  async getAllApplications() {
    try {
      const result = await apiClient.get('/admin/dashboard');
      const { applications } = result;

      return (applications || []).map(app => ({
        ...app,
        createdAt: app.createdAt ? new Date(app.createdAt) : new Date(),
        updatedAt: app.updatedAt ? new Date(app.updatedAt) : new Date(),
      }));
    } catch (error) {
      return [];
    }
  },

  // Update application status
  async updateApplicationStatus(email, status, adminNotes = '') {
    try {
      await apiClient.put('/admin/update-status', {
        email,
        status,
        adminNotes,
      });
      return true;
    } catch (error) {
      return false;
    }
  },

  // Delete application
  async deleteApplication(email) {
    try {
      await apiClient.delete(`/admin/application/${email}`);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Get all admins
  async getAllAdmins() {
    try {
      const result = await apiClient.get('/admin/admins');
      return result.admins || [];
    } catch (error) {
      return [];
    }
  },

  // Set admin
  async setAdmin(email, role, name) {
    try {
      await apiClient.post('/admin/set-admin', { email, role, name });
      return true;
    } catch (error) {
      return false;
    }
  },

  // Application statistics
  async getApplicationStats() {
    try {
      const applications = await this.getAllApplications();

      const stats = {
        total: applications.length,
        pending: applications.filter(app => !app.status || app.status === 'pending').length,
        onHold: applications.filter(app => app.status === 'on_hold').length,
        approved: applications.filter(app => app.status === 'approved').length,
        hired: applications.filter(app => app.status === 'hired').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
        completed: applications.filter(app => app.onboardingStatus === 'completed').length,
        inProgress: applications.filter(app => app.onboardingStatus === 'started').length,
      };

      return stats;
    } catch (error) {
      return { total: 0, pending: 0, onHold: 0, approved: 0, hired: 0, rejected: 0, completed: 0, inProgress: 0 };
    }
  },
  
  // Backward compatibility mock for getAdminByEmail (used in AuthContext/AdminAuthContext)
  async getAdminByEmail(email) {
    try {
      const admins = await this.getAllAdmins();
      return admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    } catch (error) {
      return null;
    }
  },

  async getAllFeeStructures() {
    try {
      const result = await apiClient.get('/admin/fee-structures');
      const list = result.feeStructures || [];
      // UI expects an object keyed by city
      return list.reduce((acc, row) => {
        const cityKey = row.city || row.City;
        if (!cityKey) return acc;
        acc[cityKey] = {
          ...row,
          city: cityKey,
        };
        return acc;
      }, {});
    } catch (error) {
      return {};
    }
  },

  async setFeeStructure(city, data) {
    try {
      await apiClient.put('/admin/fee-structures', { ...data, city });
      return true;
    } catch (error) {
      return false;
    }
  },

  async deleteFeeStructure(cityName) {
    try {
      await apiClient.delete(`/admin/fee-structures/${encodeURIComponent(cityName)}`);
      return true;
    } catch (error) {
      return false;
    }
  },

  async getAllFacilities() {
    try {
      const result = await apiClient.get('/admin/facilities');
      const list = result.facilities || [];
      // UI expects an object keyed by city -> array of facilities
      return list.reduce((acc, row) => {
        const cityKey = row.city || row.City || 'Unknown';
        if (!acc[cityKey]) acc[cityKey] = [];
        acc[cityKey].push(row);
        return acc;
      }, {});
    } catch (error) {
      return {};
    }
  },

  async setFacility(data) {
    try {
      await apiClient.put('/admin/facilities', data);
      return true;
    } catch (error) {
      return false;
    }
  },

  async deleteFacility(facilityCode) {
    try {
      await apiClient.delete(`/admin/facilities/${encodeURIComponent(facilityCode)}`);
      return true;
    } catch (error) {
      return false;
    }
  },

  async getAllCities() {
    const result = await apiClient.get('/cities');
    return result.cities || [];
  },

  async createCity(data) {
    const result = await apiClient.post('/cities', data);
    return result.city;
  },

  async updateCity(id, data) {
    const result = await apiClient.put(`/cities/${id}`, data);
    return result.city;
  },

  async deleteCity(id) {
    const result = await apiClient.delete(`/cities/${id}`);
    return result.city;
  },

  async getAllContractTemplates() {
    const result = await apiClient.get('/contract-templates');
    return result.templates || [];
  },

  async getContractTemplatesByCity(cityId) {
    const result = await apiClient.get(`/contract-templates/city/${cityId}`);
    return result.templates || [];
  },

  async createContractTemplate(data) {
    const result = await apiClient.post('/contract-templates', data);
    return result.template;
  },

  async updateContractTemplate(id, data) {
    const result = await apiClient.put(`/contract-templates/${id}`, data);
    return result.template;
  },

  async deleteContractTemplate(id) {
    const result = await apiClient.delete(`/contract-templates/${id}`);
    return result.template;
  },

  async createAndLinkDropboxTemplate(id, { templateTitle, signerRole, templateFile }) {
    const formData = new FormData();
    formData.append("templateTitle", templateTitle);
    if (signerRole) formData.append("signerRole", signerRole);
    formData.append("templateFile", templateFile);
    const result = await apiClient.post(`/contract-templates/${id}/dropbox-sign-template`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return result;
  },

  async getDropboxTemplateEditUrl(id) {
    const result = await apiClient.get(`/contract-templates/${id}/dropbox-sign-template/edit-url`);
    return result;
  },

  async getAllJobs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.cityId != null && filters.cityId !== "") {
      params.set("cityId", String(filters.cityId));
    }
    if (filters.isPublished != null && filters.isPublished !== "") {
      params.set("isPublished", String(filters.isPublished));
    }
    const q = params.toString();
    const result = await apiClient.get(q ? `/jobs?${q}` : "/jobs");
    return result.jobs || [];
  },

  async getJob(id) {
    const result = await apiClient.get(`/jobs/${id}`);
    return result.job;
  },

  async createJob(data) {
    const result = await apiClient.post("/jobs", data);
    return result.job;
  },

  async updateJob(id, data) {
    const result = await apiClient.put(`/jobs/${id}`, data);
    return result.job;
  },

  async publishJob(id) {
    const result = await apiClient.post(`/jobs/${id}/publish`);
    return result.job;
  },

  async unpublishJob(id) {
    const result = await apiClient.post(`/jobs/${id}/unpublish`);
    return result.job;
  },

  async closeJob(id) {
    const result = await apiClient.post(`/jobs/${id}/close`);
    return result.job;
  },

  async deleteJob(id) {
    return apiClient.delete(`/jobs/${id}`);
  },

  async createPublicLink(jobId, data = {}) {
    const result = await apiClient.post(`/jobs/${jobId}/links`, data);
    return result.link;
  },

  async getPublicLinks(jobId) {
    const result = await apiClient.get(`/jobs/${jobId}/links`);
    return result.links || [];
  },

  async deactivatePublicLink(linkId) {
    const result = await apiClient.delete(`/jobs/links/${linkId}`);
    return result.link;
  },

  /** New hiring pipeline applications (paginated). Does not replace legacy dashboard list. */
  async listApplications(filters = {}) {
    const params = new URLSearchParams();
    if (filters.page != null) params.set("page", String(filters.page));
    if (filters.pageSize != null) params.set("pageSize", String(filters.pageSize));
    if (filters.stage) params.set("stage", filters.stage);
    if (filters.cityId != null && filters.cityId !== "") {
      params.set("cityId", String(filters.cityId));
    }
    if (filters.jobId != null && filters.jobId !== "") {
      params.set("jobId", String(filters.jobId));
    }
    if (filters.search) params.set("search", filters.search);
    const q = params.toString();
    const result = await apiClient.get(q ? `/applications?${q}` : "/applications");
    return {
      applications: result.applications || [],
      pagination: result.pagination,
    };
  },

  async getHiringApplication(id) {
    const result = await apiClient.get(`/applications/${id}`);
    return result.application;
  },

  async getHiringApplicationStats() {
    const result = await apiClient.get("/applications/stats");
    return result.stats;
  },

  async getApplications(filters = {}, options = {}) {
    const params = new URLSearchParams();
    const scalarKeys = ["search", "stage", "cityId", "jobId", "dateFrom", "dateTo", "stageEnteredFrom", "stageEnteredTo", "hasDocuments", "page", "pageSize", "sortBy", "sortOrder"];
    scalarKeys.forEach((key) => {
      if (filters[key] != null && filters[key] !== "") params.set(key, String(filters[key]));
    });
    const arrayKeys = ["stages", "cityIds", "jobIds", "vehicleTypes", "contractStatus"];
    arrayKeys.forEach((key) => {
      if (Array.isArray(filters[key]) && filters[key].length > 0) {
        params.set(key, filters[key].join(","));
      }
    });
    const q = params.toString();
    const result = await apiClient.get(q ? `/applications?${q}` : "/applications", options);
    return {
      applications: result.applications || [],
      pagination: result.pagination || { page: 1, pageSize: 25, totalPages: 1, totalCount: 0 },
      filters: result.filters || {},
    };
  },

  async getApplicationDetail(id) {
    const result = await apiClient.get(`/applications/${id}`);
    return result.application;
  },

  async transitionApplication(id, toStage, reason = "") {
    const result = await apiClient.post(`/workflow/applications/${id}/transition`, { toStage, reason });
    const summary = result.applicationSummary || result.application;
    if (!summary) return null;
    return {
      ...summary,
      name: summary.name || `${summary.firstName || ""} ${summary.lastName || ""}`.trim(),
      currentStageLabel:
        summary.currentStageLabel ||
        String(summary.currentStage || "")
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
      timeInCurrentStageMs: summary.currentStageEnteredAt
        ? Math.max(0, Date.now() - new Date(summary.currentStageEnteredAt).getTime())
        : null,
    };
  },

  async getApplicationsByStage(filters = {}, options = {}) {
    const params = new URLSearchParams();
    const scalarKeys = ["search", "stage", "cityId", "jobId", "dateFrom", "dateTo", "stageEnteredFrom", "stageEnteredTo", "hasDocuments"];
    scalarKeys.forEach((key) => {
      if (filters[key] != null && filters[key] !== "") params.set(key, String(filters[key]));
    });
    const arrayKeys = ["stages", "cityIds", "jobIds", "vehicleTypes", "contractStatus"];
    arrayKeys.forEach((key) => {
      if (Array.isArray(filters[key]) && filters[key].length > 0) {
        params.set(key, filters[key].join(","));
      }
    });
    const q = params.toString();
    const result = await apiClient.get(q ? `/applications/by-stage?${q}` : "/applications/by-stage", options);
    return {
      grouped: result.grouped || {},
      filters: result.filters || {},
    };
  },

  async exportApplications(filters = {}, format = "csv") {
    const params = new URLSearchParams();
    params.set("format", format);
    const scalarKeys = ["search", "stage", "cityId", "jobId", "dateFrom", "dateTo", "stageEnteredFrom", "stageEnteredTo", "hasDocuments"];
    scalarKeys.forEach((key) => {
      if (filters[key] != null && filters[key] !== "") params.set(key, String(filters[key]));
    });
    const arrayKeys = ["stages", "cityIds", "jobIds", "vehicleTypes", "contractStatus"];
    arrayKeys.forEach((key) => {
      if (Array.isArray(filters[key]) && filters[key].length > 0) {
        params.set(key, filters[key].join(","));
      }
    });

    const baseURL = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/$/, "");
    const token = getAuthToken();
    const response = await fetch(`${baseURL}/applications/export?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Export failed");
    }
    return response.blob();
  },

  async getAnalyticsFunnel(filters = {}) {
    const params = new URLSearchParams();
    ["cityId", "jobId", "dateFrom", "dateTo"].forEach((key) => {
      if (filters[key] != null && filters[key] !== "") params.set(key, String(filters[key]));
    });
    const q = params.toString();
    const result = await apiClient.get(q ? `/analytics/funnel?${q}` : "/analytics/funnel");
    return { counts: result.counts || {}, conversions: result.conversions || {} };
  },

  async getAnalyticsStageDuration(filters = {}) {
    const params = new URLSearchParams();
    ["cityId", "jobId", "dateFrom", "dateTo"].forEach((key) => {
      if (filters[key] != null && filters[key] !== "") params.set(key, String(filters[key]));
    });
    const q = params.toString();
    const result = await apiClient.get(q ? `/analytics/stage-duration?${q}` : "/analytics/stage-duration");
    return result.durations || {};
  },

  async getAnalyticsVolume(period = "week", filters = {}) {
    const params = new URLSearchParams();
    params.set("period", period);
    ["cityId", "jobId", "dateFrom", "dateTo"].forEach((key) => {
      if (filters[key] != null && filters[key] !== "") params.set(key, String(filters[key]));
    });
    const result = await apiClient.get(`/analytics/volume?${params.toString()}`);
    return { period: result.period || period, data: result.data || [] };
  },

  async getAnalyticsCities(filters = {}) {
    const params = new URLSearchParams();
    ["cityId", "jobId", "dateFrom", "dateTo"].forEach((key) => {
      if (filters[key] != null && filters[key] !== "") params.set(key, String(filters[key]));
    });
    const q = params.toString();
    const result = await apiClient.get(q ? `/analytics/cities?${q}` : "/analytics/cities");
    return result.cities || [];
  },

  async getAnalyticsJobs(filters = {}) {
    const params = new URLSearchParams();
    ["cityId", "jobId", "dateFrom", "dateTo"].forEach((key) => {
      if (filters[key] != null && filters[key] !== "") params.set(key, String(filters[key]));
    });
    const q = params.toString();
    const result = await apiClient.get(q ? `/analytics/jobs?${q}` : "/analytics/jobs");
    return result.jobs || [];
  },

  async getRecentActivity(limit = 20, offset = 0, filters = {}) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    if (filters.cityId) params.set("cityId", String(filters.cityId));
    if (filters.actorEmail) params.set("actorEmail", String(filters.actorEmail));
    const result = await apiClient.get(`/applications/activity?${params.toString()}`);
    return {
      items: result.items || [],
      pagination: result.pagination || { limit, offset, total: 0, hasMore: false },
    };
  },

  async quickSearch(query, limit = 5, options = {}) {
    const q = String(query || "").trim();
    if (!q) return { applications: [], jobs: [], cities: [] };
    const result = await apiClient.get(
      `/applications/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      options
    );
    const [jobs, cities] = await Promise.all([
      this.getAllJobs(),
      this.getAllCities(),
    ]);
    const qLower = q.toLowerCase();
    return {
      applications: result.applications || [],
      jobs: (jobs || []).filter((j) => String(j.title || "").toLowerCase().includes(qLower)).slice(0, limit),
      cities: (cities || []).filter((c) => String(c.city || "").toLowerCase().includes(qLower)).slice(0, limit),
    };
  },

  async getAvailableTransitions(id) {
    const result = await apiClient.get(`/workflow/applications/${id}/available-transitions`);
    return result.transitions || [];
  },

  async getApplicationHistory(id) {
    const result = await apiClient.get(`/workflow/applications/${id}/history`);
    return result.history || [];
  },

  async reopenApplication(id, reason) {
    const result = await apiClient.post(`/workflow/applications/${id}/reopen`, { reason });
    return result.applicationSummary || result.application;
  },

  async updateApplicationNotes(id, notes) {
    const result = await apiClient.put(`/applications/${id}/notes`, { notes });
    return result.application;
  },

  async getApplicationNotes(id) {
    const result = await apiClient.get(`/applications/${id}/notes`);
    return result.notes || [];
  },

  async addApplicationNote(id, content) {
    const result = await apiClient.post(`/applications/${id}/notes`, { content });
    return result.note;
  },

  async bulkTransitionApplications(applicationIds, toStage, reason = "", metadata = {}) {
    const result = await apiClient.post(`/workflow/applications/bulk-transition`, {
      applicationIds,
      toStage,
      reason,
      metadata,
    });
    return result;
  },

  getRejectionReasons() {
    return REJECTION_REASONS;
  },

  async getDocumentRequirements(cityId) {
    const result = await apiClient.get(`/document-requirements/city/${cityId}`);
    return result.requirements || [];
  },

  async createDocumentRequirement(data) {
    const result = await apiClient.post('/document-requirements', data);
    return result.requirement;
  },

  async updateDocumentRequirement(id, data) {
    const result = await apiClient.put(`/document-requirements/${id}`, data);
    return result.requirement;
  },

  async deleteDocumentRequirement(id) {
    const result = await apiClient.delete(`/document-requirements/${id}`);
    return result;
  },

  async seedDocumentDefaults(cityId) {
    const result = await apiClient.post(`/document-requirements/seed/${cityId}`);
    return result;
  },

  async getApplicationDocuments(applicationId) {
    const result = await apiClient.get(`/applications/${applicationId}/documents`);
    return result;
  },

  async getApplicationDocumentDownloadUrl(applicationId, documentId) {
    const result = await apiClient.get(`/applications/${applicationId}/documents/${documentId}/download`);
    return result;
  },

  async getApplicationDocumentSummary(applicationId) {
    const result = await apiClient.get(`/applications/${applicationId}/documents/summary`);
    return result.summary;
  },

  async getApplicationDocumentContext(applicationId, documentId) {
    const result = await apiClient.get(`/applications/${applicationId}/documents/${documentId}/context`);
    return result;
  },

  async reviewApplicationDocument(applicationId, documentId, status, notes = "", checklist = []) {
    const result = await apiClient.put(`/applications/${applicationId}/documents/${documentId}/review`, {
      status,
      notes,
      checklist,
    });
    return result;
  },

  async reviewAllApplicationDocuments(applicationId, decisions) {
    const result = await apiClient.post(`/applications/${applicationId}/documents/review-all`, {
      decisions,
    });
    return result;
  },

  async getApplicationPaymentDetails(applicationId) {
    const result = await apiClient.get(`/applications/${applicationId}/payment`);
    return result.payment;
  },

  async verifyApplicationPaymentDetails(applicationId) {
    const result = await apiClient.post(`/applications/${applicationId}/payment/verify`);
    return result;
  },

  async getCallQueue() {
    const result = await apiClient.get("/applications/call-queue");
    return result.queue || { scheduled: [], unscheduled: [], all: [] };
  },

  async scheduleOnboardingCall(applicationId, scheduledAt) {
    const result = await apiClient.post(`/applications/${applicationId}/call/schedule`, { scheduledAt });
    return result.application;
  },

  async completeOnboardingCall(applicationId, notes = "") {
    const result = await apiClient.post(`/applications/${applicationId}/call/complete`, { notes });
    return result;
  },

  async rescheduleOnboardingCall(applicationId, scheduledAt, reason = "") {
    const result = await apiClient.post(`/applications/${applicationId}/call/reschedule`, { scheduledAt, reason });
    return result.application;
  },

  async markOnboardingCallNoShow(applicationId, payload = {}) {
    const result = await apiClient.post(`/applications/${applicationId}/call/no-show`, payload);
    return result;
  },

  async getBlockQueue(params = {}) {
    const q = new URLSearchParams();
    if (params.cityId != null && params.cityId !== "") q.set("cityId", String(params.cityId));
    const result = await apiClient.get(q.toString() ? `/applications/block-queue?${q.toString()}` : "/applications/block-queue");
    return (
      result.queue || {
        all: [],
        upcoming: [],
        today: [],
        pastDue: [],
        unscheduled: [],
      }
    );
  },

  async assignFirstBlock(applicationId, dateIso, metadata) {
    const result = await apiClient.post(`/applications/${applicationId}/first-block/assign`, {
      date: dateIso,
      metadata: metadata || undefined,
    });
    return result;
  },

  async recordFirstBlockResult(applicationId, result, notes = "") {
    return apiClient.post(`/applications/${applicationId}/first-block/result`, { result, notes });
  },

  async rescheduleFirstBlock(applicationId, dateIso, reason = "") {
    const result = await apiClient.post(`/applications/${applicationId}/first-block/reschedule`, {
      date: dateIso,
      reason,
    });
    return result.application;
  },

  async getQuestionnaires(params = {}) {
    const q = new URLSearchParams();
    if (params.cityId != null && params.cityId !== "") q.set("cityId", String(params.cityId));
    if (params.active != null && params.active !== "") q.set("active", String(params.active));
    const result = await apiClient.get(q.toString() ? `/questionnaires?${q.toString()}` : "/questionnaires");
    return result.questionnaires || [];
  },

  async getQuestionnaire(id) {
    const result = await apiClient.get(`/questionnaires/${id}`);
    return result.questionnaire;
  },

  async createQuestionnaire(payload) {
    const result = await apiClient.post("/questionnaires", payload);
    return result.questionnaire;
  },

  async updateQuestionnaire(id, payload) {
    const result = await apiClient.put(`/questionnaires/${id}`, payload);
    return result.questionnaire;
  },

  async deleteQuestionnaire(id) {
    return apiClient.delete(`/questionnaires/${id}`);
  },

  async getDecisionSummary(applicationId) {
    const result = await apiClient.get(`/applications/${applicationId}/decision-summary`);
    return result.summary;
  },

  async approveApplicationFinal(applicationId, notes = "") {
    const result = await apiClient.post(`/applications/${applicationId}/approve`, { notes });
    return result;
  },

  async rejectApplicationFinal(applicationId, reason, notes = "") {
    const result = await apiClient.post(`/applications/${applicationId}/reject`, { reason, notes });
    return result;
  },

  async sendContract(id) {
    return apiClient.post(`/applications/${id}/contract/send`);
  },

  async getContractStatus(id) {
    return apiClient.get(`/applications/${id}/contract/status`);
  },

  async resendContract(id) {
    return apiClient.post(`/applications/${id}/contract/resend`);
  },

  async cancelContract(id) {
    return apiClient.post(`/applications/${id}/contract/cancel`);
  },

  async markContractSigned(id) {
    return apiClient.post(`/applications/${id}/contract/mark-signed`);
  },

  async pollAllPendingContracts() {
    return apiClient.post('/admin/contract/poll-status');
  },

  async getEmailTemplates() {
    const result = await apiClient.get('/communications/templates');
    return result.templates || [];
  },

  async createEmailTemplate(data) {
    const result = await apiClient.post('/communications/templates', data);
    return result.template;
  },

  async updateEmailTemplate(id, data) {
    const result = await apiClient.put(`/communications/templates/${id}`, data);
    return result.template;
  },

  async deleteEmailTemplate(id) {
    const result = await apiClient.delete(`/communications/templates/${id}`);
    return result.template;
  },

  async previewEmailTemplate(id, variables = {}) {
    const result = await apiClient.post(`/communications/templates/${id}/preview`, { variables });
    return result.rendered;
  },

  async getCommunicationLog(applicationId) {
    const result = await apiClient.get(`/communications/logs/${applicationId}`);
    return result.logs || [];
  },

  async getCommunicationStats(params = {}) {
    const q = new URLSearchParams();
    if (params.dateFrom) q.set("dateFrom", params.dateFrom);
    if (params.dateTo) q.set("dateTo", params.dateTo);
    const result = await apiClient.get(
      q.toString() ? `/communications/stats?${q.toString()}` : "/communications/stats"
    );
    return result.stats;
  },

  async retryCommunicationLog(logId) {
    const result = await apiClient.post(`/communications/logs/${logId}/retry`);
    return result.result;
  },

  async getNotificationMatrix() {
    const result = await apiClient.get('/communications/notifications/matrix');
    return result.matrix || [];
  },

  async testSendTemplate(id, recipient, variables = {}) {
    const result = await apiClient.post(`/communications/templates/${id}/test-send`, {
      recipient,
      variables,
    });
    return result.result;
  },
};
