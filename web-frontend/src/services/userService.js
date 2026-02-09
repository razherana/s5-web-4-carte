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

export const userService = {
  /**
   * Get all users
   * Matches backend: GET /api/users
   * Response: { status, data: [...users], error }
   */
  async getAllUsers() {
    const response = await api.get('/users');
    return extractResponseData(response);
  },

  /**
   * Get a specific user by ID
   * Matches backend: GET /api/users/{id}
   * Response: { status, data: { id, firebase_uid, email, role, login_attempts, locked_until, synced }, error }
   */
  async getUserById(id) {
    const response = await api.get(`/users/${id}`);
    return extractResponseData(response);
  },

  /**
   * Create a new user
   * Matches backend: POST /api/users
   * Response: { status, data: { id, firebase_uid, email, role, login_attempts, locked_until, synced }, error }
   */
  async createUser(userData) {
    const response = await api.post('/users', userData);
    return extractResponseData(response);
  },

  /**
   * Update an existing user
   * Matches backend: PUT /api/users/{id}
   * Response: { status, data: { id, firebase_uid, email, role, login_attempts, locked_until, synced }, error }
   */
  async updateUser(id, userData) {
    const response = await api.put(`/users/${id}`, userData);
    return extractResponseData(response);
  },

  /**
   * Unblock a locked user account
   * Matches backend: POST /api/users/{id}/unblock
   * Response: { status, data: { message, user }, error }
   */
  async unblockUser(id) {
    const response = await api.post(`/users/${id}/unblock`);
    return extractResponseData(response);
  },

  /**
   * Block a user account
   * Matches backend: POST /api/users/{id}/block
   * Response: { status, data: { message, user }, error }
   */
  async blockUser(id) {
    const response = await api.post(`/users/${id}/block`);
    return extractResponseData(response);
  },

  /**
   * Delete a user
   * Matches backend: DELETE /api/users/{id}
   * Response: { status, data: { message }, error }
   */
  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`);
    return extractResponseData(response);
  },

  /**
   * Sync users with Firebase
   * Matches backend: POST /api/sync/users
   * Response: { status, data: { message, results: { created, updated, deleted, errors } }, error }
   */
  async syncWithFirebase() {
    const response = await api.post('/sync/users');
    return extractResponseData(response);
  },
};
