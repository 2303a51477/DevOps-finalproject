import apiRequest from './api';

export const authService = {
  async register(data) {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: data,
    });
    if (res.access_token) {
      localStorage.setItem('access_token', res.access_token);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  },

  async login(email, password) {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (res.access_token) {
      localStorage.setItem('access_token', res.access_token);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  },

  async getMe() {
    return apiRequest('/auth/me');
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  }
};

export default authService;
