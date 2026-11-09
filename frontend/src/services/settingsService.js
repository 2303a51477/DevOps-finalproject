import apiRequest from './api';

export const settingsService = {
  async getSettings() {
    return apiRequest('/settings');
  },

  async updateSetting(key, value, description = '') {
    return apiRequest(`/settings/${key}`, {
      method: 'PUT',
      body: { value, description },
    });
  }
};

export const userService = {
  async getUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.role) query.append('role', params.role);
    if (params.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/users${qs}`);
  },

  async getUserById(id) {
    return apiRequest(`/users/${id}`);
  },

  async updateUser(id, data) {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  async deleteUser(id) {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  }
};
