import apiRequest from './api';

export const certificateService = {
  async getCertificates(params = {}) {
    const query = new URLSearchParams();
    if (params.status_filter) query.append('status_filter', params.status_filter);
    if (params.course_id) query.append('course_id', params.course_id);
    if (params.learner_id) query.append('learner_id', params.learner_id);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/certificates${qs}`);
  },

  async getCertificateById(id) {
    return apiRequest(`/certificates/${id}`);
  },

  async issueCertificate(learnerId, courseId, score = 100.0) {
    return apiRequest('/certificates/issue', {
      method: 'POST',
      body: { learner_id: learnerId, course_id: courseId, score },
    });
  },

  async revokeCertificate(id, revocationReason) {
    return apiRequest(`/certificates/${id}/revoke`, {
      method: 'PUT',
      body: { revocation_reason: revocationReason },
    });
  },

  getDownloadUrl(id) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    return `${apiBase}/certificates/${id}/download`;
  },

  async downloadPdf(id, filename = 'Certificate.pdf') {
    const blob = await apiRequest(`/certificates/${id}/download`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};

export default certificateService;
