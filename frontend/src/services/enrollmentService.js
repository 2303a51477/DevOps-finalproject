import apiRequest from './api';

export const enrollmentService = {
  async getEnrollments(params = {}) {
    const query = new URLSearchParams();
    if (params.course_id) query.append('course_id', params.course_id);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/enrollments${qs}`);
  },

  async getEnrollmentById(id) {
    return apiRequest(`/enrollments/${id}`);
  },

  async enrollCourse(courseId) {
    return apiRequest('/enrollments', {
      method: 'POST',
      body: { course_id: courseId },
    });
  },

  async updateProgress(enrollmentId, moduleId, completed = true) {
    return apiRequest(`/enrollments/${enrollmentId}/progress`, {
      method: 'PUT',
      body: { module_id: moduleId, completed },
    });
  }
};

export default enrollmentService;
