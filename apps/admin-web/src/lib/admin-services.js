import { apiClient } from "@lh/shared";

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
      console.error('Error getting all applications:', error);
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
      console.error('Error updating application status:', error);
      return false;
    }
  },

  // Delete application
  async deleteApplication(email) {
    try {
      await apiClient.delete(`/admin/application/${email}`);
      return true;
    } catch (error) {
      console.error('Error deleting application:', error);
      return false;
    }
  },

  // Get all admins
  async getAllAdmins() {
    try {
      const result = await apiClient.get('/admin/admins');
      return result.admins || [];
    } catch (error) {
      console.error('Error getting all admins:', error);
      return [];
    }
  },

  // Set admin
  async setAdmin(email, role, name) {
    try {
      await apiClient.post('/admin/set-admin', { email, role, name });
      return true;
    } catch (error) {
      console.error('Error setting admin:', error);
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
      console.error('Error getting application stats:', error);
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
      console.error('Error getting all fee structures:', error);
      return {};
    }
  },

  async setFeeStructure(city, data) {
    try {
      await apiClient.put('/admin/fee-structures', { ...data, city });
      return true;
    } catch (error) {
      console.error('Error saving fee structure:', error);
      return false;
    }
  },

  async deleteFeeStructure(cityName) {
    try {
      await apiClient.delete(`/admin/fee-structures/${encodeURIComponent(cityName)}`);
      return true;
    } catch (error) {
      console.error('Error deleting fee structure:', error);
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
      console.error('Error getting all facilities:', error);
      return {};
    }
  },
};
