import api from './api';

export const reportService = {
  async getAllReports() {
    const response = await api.get('/signalements');
    return response.data;
  },

  async getReportById(id) {
    const response = await api.get(`/signalements/${id}`);
    return response.data;
  },

  async createReport(reportData) {
    const response = await api.post('/signalements', reportData);
    return response.data;
  },

  async updateReport(id, reportData) {
    const response = await api.put(`/signalements/${id}`, reportData);
    return response.data;
  },

  async deleteReport(id) {
    const response = await api.delete(`/signalements/${id}`);
    return response.data;
  },

  async syncWithFirebase() {
    const response = await api.post('/signalements/sync');
    return response.data;
  },

  getStatistics(reports) {
    const totalReports = reports.length;
    const totalSurface = reports.reduce((sum, r) => sum + (parseFloat(r.surface) || 0), 0);
    const totalBudget = reports.reduce((sum, r) => sum + (parseFloat(r.budget) || 0), 0);
    
    const completedReports = reports.filter(r => r.status === 'completed').length;
    const inProgressReports = reports.filter(r => r.status === 'in_progress').length;
    const newReports = reports.filter(r => r.status === 'new').length;
    
    const progressPercentage = totalReports > 0 
      ? ((completedReports / totalReports) * 100).toFixed(1)
      : 0;

    return {
      totalReports,
      totalSurface: totalSurface.toFixed(2),
      totalBudget: totalBudget.toFixed(2),
      completedReports,
      inProgressReports,
      newReports,
      progressPercentage,
    };
  },
};
