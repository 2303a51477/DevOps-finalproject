import apiRequest from './api';

export const verificationService = {
  async verifyCredential(verificationId) {
    return apiRequest(`/verify/${encodeURIComponent(verificationId.trim())}`);
  },

  async submitVerificationRequest(data) {
    return apiRequest('/verification-requests', {
      method: 'POST',
      body: data,
    });
  },

  async getVerificationRequests(params = {}) {
    const query = new URLSearchParams();
    if (params.status_filter) query.append('status_filter', params.status_filter);
    if (params.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/verification-requests${qs}`);
  }
};

export default verificationService;

