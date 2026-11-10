import apiRequest from './api';

export const reportService = {
  async getCertificateIssuanceReport(statusFilter = '') {
    const qs = statusFilter ? `?status_filter=${statusFilter}` : '';
    return apiRequest(`/reports/certificate-issuance${qs}`);
  },

  async getCourseCompletionReport(category = '') {
    const qs = category ? `?category=${category}` : '';
    return apiRequest(`/reports/course-completion${qs}`);
  },

  async getVerificationRequestsReport(statusFilter = '') {
    const qs = statusFilter ? `?status_filter=${statusFilter}` : '';
    return apiRequest(`/reports/verification-requests${qs}`);
  },

  async getLearnerProgressReport(courseId = '') {
    const qs = courseId ? `?course_id=${courseId}` : '';
    return apiRequest(`/reports/learner-progress${qs}`);
  },

  getCsvExportUrl(reportType) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    return `${apiBase}/reports/export/csv/${reportType}`;
  },

  async downloadReportCsv(reportType, filename) {
    const blob = await apiRequest(`/reports/export/csv/${reportType}`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${reportType}_report.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};

export default reportService;

