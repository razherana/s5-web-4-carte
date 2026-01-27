import api from './api';

export const userService = {
  async getAllUsers() {
    const response = await api.get('/users');
    return response.data;
  },

  async getUserById(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async createUser(userData) {
    const response = await api.post('/users', userData);
    return response.data;
  },

  async updateUser(id, userData) {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  async unblockUser(id) {
    const response = await api.post(`/users/${id}/unblock`);
    return response.data;
  },

  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
