import api from './api';

/**
 * Extract data from the standardized API response format.
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

export const syncService = {
  /**
   * Sync all data (users + signalements + entreprises) with Firebase
   * Matches backend: POST /api/sync/all
   */
  async syncAll() {
    const response = await api.post('/sync/all');
    return extractResponseData(response);
  },

  /**
   * Sync reports with Firebase
   * Matches backend: POST /api/signalements/sync
   */
  async syncReports() {
    const response = await api.post('/signalements/sync');
    return extractResponseData(response);
  },

  /**
   * Sync users with Firebase
   * Matches backend: POST /api/sync/users
   */
  async syncUsers() {
    const response = await api.post('/sync/users');
    return extractResponseData(response);
  },

  /**
   * Pull data from Firebase to local database
   * Matches backend: POST /api/sync/pull
   */
  async pullFromFirebase() {
    const response = await api.post('/sync/pull');
    return extractResponseData(response);
  },
};
