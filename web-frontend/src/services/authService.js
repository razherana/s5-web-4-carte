import api from './api';

export const authService = {
  async login(email, password) {
    const demoEmail = 'manager@demo.local';
    const demoPassword = 'Manager123!';

    if (email === demoEmail && password === demoPassword) {
      const demoUser = {
        id: 0,
        name: 'Demo Manager',
        email: demoEmail,
        role: 'manager',
      };
      localStorage.setItem('token', 'demo-token');
      localStorage.setItem('user', JSON.stringify(demoUser));
      return { token: 'demo-token', user: demoUser, demo: true };
    }

    const response = await api.post('/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async updateProfile(userData) {
    const response = await api.put('/profile', userData);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  isManager() {
    const user = this.getCurrentUser();
    return user?.role === 'manager' || user?.role === 'admin';
  },
};
