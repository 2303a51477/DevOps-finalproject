import apiRequest from './api';

export const assessmentService = {
  async getAssessments(courseId) {
    const qs = courseId ? `?course_id=${courseId}` : '';
    return apiRequest(`/assessments${qs}`);
  },

  async getAssessmentById(id) {
    return apiRequest(`/assessments/${id}`);
  },

  async createAssessment(assessmentData) {
    return apiRequest('/assessments', {
      method: 'POST',
      body: assessmentData,
    });
  },

  async submitAssessment(assessmentId, answers) {
    return apiRequest(`/assessments/${assessmentId}/submit`, {
      method: 'POST',
      body: { answers },
    });
  }
};

export default assessmentService;
