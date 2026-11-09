import apiRequest from './api';

export const courseService = {
  async getCourses(params = {}) {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.difficulty) query.append('difficulty', params.difficulty);
    if (params.status_filter) query.append('status_filter', params.status_filter);
    if (params.search) query.append('search', params.search);
    if (params.provider_id) query.append('provider_id', params.provider_id);
    
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/courses${qs}`);
  },

  async getCourseById(id) {
    return apiRequest(`/courses/${id}`);
  },

  async createCourse(courseData) {
    return apiRequest('/courses', {
      method: 'POST',
      body: courseData,
    });
  },

  async updateCourse(id, courseData) {
    return apiRequest(`/courses/${id}`, {
      method: 'PUT',
      body: courseData,
    });
  },

  async deleteCourse(id) {
    return apiRequest(`/courses/${id}`, {
      method: 'DELETE',
    });
  },

  async approveCourse(id) {
    return apiRequest(`/courses/${id}/approve`, {
      method: 'PUT',
    });
  },

  async rejectCourse(id) {
    return apiRequest(`/courses/${id}/reject`, {
      method: 'PUT',
    });
  },

  async addModule(courseId, moduleData) {
    return apiRequest(`/courses/${courseId}/modules`, {
      method: 'POST',
      body: moduleData,
    });
  },

  async deleteModule(moduleId) {
    return apiRequest(`/courses/modules/${moduleId}`, {
      method: 'DELETE',
    });
  }
};

export default courseService;
