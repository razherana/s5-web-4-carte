import api from './api';

/**
 * Extract data from the standardized API response format.
 * Backend returns: { status: 'success'|'error', data: {...}|null, error: {...}|null }
 * @param {object} response - Axios response object
 * @returns {object} The data payload from the response
 * @throws {Error} If response indicates an error
 */
const extractResponseData = (response) => {
  const { status, data, error } = response.data;

  if (status === 'error' || error) {
    const errorMessage = error?.message || 'An unexpected error occurred';
    const errorCode = error?.code || 'UNKNOWN_ERROR';
    const err = new Error(errorMessage);
    err.code = errorCode;
    throw err;
  }

  return data;
};

export const reportService = {
  /**
   * Get all signalements/reports
   * Matches backend: GET /api/signalements
   * Response: { status, data: [...signalements], error }
   */
  async getAllReports() {
    const response = await api.get('/signalements');
    return extractResponseData(response);
  },

  /**
   * Get a specific signalement by ID
   * Matches backend: GET /api/signalements/{id}
   * Response: { status, data: { id, user_id, firebase_uid, lat, lng, date_signalement, surface, budget, entreprise_id, synced, user, entreprise }, error }
   */
  async getReportById(id) {
    const response = await api.get(`/signalements/${id}`);
    return extractResponseData(response);
  },

  /**
   * Create a new signalement
   * Matches backend: POST /api/signalements
   * Response: { status, data: { id, user_id, firebase_uid, lat, lng, date_signalement, surface, budget, entreprise_id, synced, user, entreprise }, error }
   */
  async createReport(reportData) {
    const response = await api.post('/signalements', reportData);
    return extractResponseData(response);
  },

  /**
   * Update an existing signalement
   * Matches backend: PUT /api/signalements/{id}
   * Response: { status, data: { id, user_id, firebase_uid, lat, lng, date_signalement, surface, budget, entreprise_id, synced, user, entreprise }, error }
   */
  async updateReport(id, reportData) {
    const response = await api.put(`/signalements/${id}`, reportData);
    return extractResponseData(response);
  },

  /**
   * Delete a signalement
   * Matches backend: DELETE /api/signalements/{id}
   * Response: { status, data: { message }, error }
   */
  async deleteReport(id) {
    const response = await api.delete(`/signalements/${id}`);
    return extractResponseData(response);
  },

  /**
   * Sync signalements with Firebase
   * Matches backend: POST /api/signalements/sync
   * Response: { status, data: { message, results: { created, updated, deleted, errors } }, error }
   */
  async syncWithFirebase() {
    const response = await api.post('/signalements/sync');
    return extractResponseData(response);
  },

  /**
   * Get all entreprises
   * Matches backend: GET /api/entreprises
   */
  async getAllEntreprises() {
    const response = await api.get('/entreprises');
    return extractResponseData(response);
  },

  /**
   * Get status history for a signalement
   * Matches backend: GET /api/signalements/{id}/status-history
   */
  async getStatusHistory(id) {
    const response = await api.get(`/signalements/${id}/status-history`);
    return extractResponseData(response);
  },

  /**
   * Add a status change to a signalement
   * Matches backend: POST /api/signalements/{id}/status-history
   * @param {string|number} id - Signalement ID
   * @param {object} data - { status, changed_at?, notes? }
   */
  async addStatusChange(id, data) {
    const response = await api.post(`/signalements/${id}/status-history`, data);
    return extractResponseData(response);
  },

  /**
   * Get processing time statistics (manager only)
   * Matches backend: GET /api/statistics/processing-times
   * Returns: { average_delays, per_signalement, summary }
   */
  async getProcessingStats() {
    const response = await api.get('/statistics/processing-times');
    return extractResponseData(response);
  },

  /**
   * Calculate statistics from a list of reports
   * Uses the `synced` field (synced | created | updated | deleted)
   * @param {Array} reports - Array of report objects
   * @returns {object} Statistics object
   */
  getStatistics(reports) {
    const totalReports = reports.length;
    const totalSurface = reports.reduce((sum, r) => sum + (parseFloat(r.surface) || 0), 0);
    const totalBudget = reports.reduce((sum, r) => sum + (parseFloat(r.budget) || 0), 0);
    
    const syncedReports = reports.filter(r => r.synced === 'synced' || !r.synced).length;
    const createdReports = reports.filter(r => r.synced === 'created').length;
    const updatedReports = reports.filter(r => r.synced === 'updated').length;
    const deletedReports = reports.filter(r => r.synced === 'deleted').length;
    
    const syncPercentage = totalReports > 0 
      ? ((syncedReports / totalReports) * 100).toFixed(1)
      : 0;

    // Status statistics
    const pendingReports = reports.filter(r => r.status === 'pending' || !r.status).length;
    const inProgressReports = reports.filter(r => r.status === 'in_progress').length;
    const resolvedReports = reports.filter(r => r.status === 'resolved').length;
    const rejectedReports = reports.filter(r => r.status === 'rejected').length;

    // Avancement: pending/rejected=0, in_progress=0.5, resolved=1
    const avancementSum = reports.reduce((sum, r) => {
      const status = r.status || 'pending';
      if (status === 'resolved') return sum + 1;
      if (status === 'in_progress') return sum + 0.5;
      return sum; // pending, rejected = 0
    }, 0);
    const avancement = totalReports > 0
      ? ((avancementSum / totalReports) * 100).toFixed(1)
      : 0;

    return {
      totalReports,
      totalSurface: totalSurface.toFixed(2),
      totalBudget: totalBudget.toFixed(2),
      syncedReports,
      createdReports,
      updatedReports,
      deletedReports,
      syncPercentage,
      pendingReports,
      inProgressReports,
      resolvedReports,
      rejectedReports,
      avancement,
    };
  },
};
