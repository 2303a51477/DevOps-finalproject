import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Percent, 
  FileText, 
  Video, 
  Sparkles,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/courseService';
import { Badge } from '../components/common/Badge';
import { Modal, LoadingSpinner } from '../components/common/Modal';

export const CourseManagement = () => {
  const { user, isAdmin, isProvider } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourseForModules, setSelectedCourseForModules] = useState(null);
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New Course Form State
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'Cloud & DevOps',
    difficulty: 'Intermediate',
    duration_hours: 20,
    passing_percentage: 75.0,
    thumbnail_url: '',
  });

  // New Module Form State
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    content_type: 'document',
    content_url: '',
    reading_time_mins: 20,
    order_index: 1,
  });

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await courseService.getCourses({
        status_filter: 'all',
        provider_id: !isAdmin ? user?.id : undefined,
        search: search || undefined
      });
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [user]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await courseService.createCourse({
        ...courseForm,
        duration_hours: Number(courseForm.duration_hours),
        passing_percentage: Number(courseForm.passing_percentage),
      });
      setIsCreateOpen(false);
      setCourseForm({
        title: '',
        description: '',
        category: 'Cloud & DevOps',
        difficulty: 'Intermediate',
        duration_hours: 20,
        passing_percentage: 75.0,
        thumbnail_url: '',
      });
      loadCourses();
    } catch (err) {
      alert('Error creating course: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await courseService.updateCourse(editingCourse.id, {
        title: editingCourse.title,
        description: editingCourse.description,
        category: editingCourse.category,
        difficulty: editingCourse.difficulty,
        duration_hours: Number(editingCourse.duration_hours),
        passing_percentage: Number(editingCourse.passing_percentage),
        thumbnail_url: editingCourse.thumbnail_url,
      });
      setEditingCourse(null);
      loadCourses();
    } catch (err) {
      alert('Error updating course: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course and all associated modules?')) return;
    try {
      await courseService.deleteCourse(id);
      loadCourses();
    } catch (err) {
      alert('Error deleting course: ' + err.message);
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!selectedCourseForModules) return;
    setActionLoading(true);
    try {
      await courseService.addModule(selectedCourseForModules.id, {
        ...moduleForm,
        reading_time_mins: Number(moduleForm.reading_time_mins),
        order_index: Number(moduleForm.order_index),
      });
      setIsAddModuleOpen(false);
      setModuleForm({
        title: '',
        description: '',
        content_type: 'document',
        content_url: '',
        reading_time_mins: 20,
        order_index: 1,
      });
      // Refresh selected course
      const updated = await courseService.getCourseById(selectedCourseForModules.id);
      setSelectedCourseForModules(updated);
      loadCourses();
    } catch (err) {
      alert('Error adding module: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Delete this syllabus module?')) return;
    try {
      await courseService.deleteModule(moduleId);
      const updated = await courseService.getCourseById(selectedCourseForModules.id);
      setSelectedCourseForModules(updated);
      loadCourses();
    } catch (err) {
      alert('Error deleting module: ' + err.message);
    }
  };

  const handleApprove = async (id) => {
    try {
      await courseService.approveCourse(id);
      loadCourses();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await courseService.rejectCourse(id);
      loadCourses();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Course Creation & Syllabus Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Author accredited curriculum, organize syllabus modules, and define passing certification thresholds.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="self-start sm:self-auto px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Course</span>
        </button>
      </div>

      {/* Course Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search courses by title, keywords or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadCourses()}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white text-slate-900"
          />
        </div>
        <button
          onClick={loadCourses}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
        >
          Filter
        </button>
      </div>

      {/* Courses List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading courses syllabus catalog..." />
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No courses match query</p>
            <p className="text-xs text-slate-400 mt-1">Click "New Course" above to create an accredited curriculum</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Course Program</th>
                  <th className="px-6 py-3.5">Category & Difficulty</th>
                  <th className="px-6 py-3.5">Modules & Duration</th>
                  <th className="px-6 py-3.5">Passing Threshold</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&q=80'}
                          alt={course.title}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200"
                        />
                        <div className="max-w-xs">
                          <p className="font-bold text-slate-900 line-clamp-1">{course.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{course.description}</p>
                          <span className="text-[10px] text-sky-600 font-semibold">
                            Provider: {course.provider?.name || 'Academy'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{course.category}</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                        {course.difficulty}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>{course.modules?.length || 0} Modules</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{course.duration_hours} Hours Est.</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <Percent className="w-3.5 h-3.5 text-sky-600" />
                        <span>{course.passing_percentage}% Passing Score</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge status={course.status} size="md" />
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Manage Syllabus Modules Button */}
                        <button
                          onClick={() => setSelectedCourseForModules(course)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors flex items-center gap-1"
                          title="Manage Modules & Content"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Modules ({course.modules?.length || 0})</span>
                        </button>

                        {/* Admin Approval / Rejection Controls */}
                        {isAdmin && course.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(course.id)}
                              className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50"
                              title="Approve Course"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(course.id)}
                              className="p-1 rounded-lg text-rose-600 hover:bg-rose-50"
                              title="Reject Course"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={() => setEditingCourse({ ...course })}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          title="Edit Course Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Accredited Course"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Advanced Cloud Architecture & Kubernetes"
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Learning Outcomes</label>
            <textarea
              rows={3}
              required
              placeholder="Detailed syllabus outline, prerequisites, and learning objectives..."
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={courseForm.category}
                onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="Cloud & DevOps">Cloud & DevOps</option>
                <option value="Web Development">Web Development</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="AI & Data Science">AI & Data Science</option>
                <option value="Blockchain & Security">Blockchain & Security</option>
                <option value="Software Engineering">Software Engineering</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty Level</label>
              <select
                value={courseForm.difficulty}
                onChange={(e) => setCourseForm({ ...courseForm, difficulty: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Hours</label>
              <input
                type="number"
                min={1}
                required
                value={courseForm.duration_hours}
                onChange={(e) => setCourseForm({ ...courseForm, duration_hours: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Passing Percentage (%)</label>
              <input
                type="number"
                min={50}
                max={100}
                required
                value={courseForm.passing_percentage}
                onChange={(e) => setCourseForm({ ...courseForm, passing_percentage: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Thumbnail Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={courseForm.thumbnail_url}
              onChange={(e) => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm"
            >
              {actionLoading ? 'Creating...' : 'Publish Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Course Modal */}
      {editingCourse && (
        <Modal
          isOpen={true}
          onClose={() => setEditingCourse(null)}
          title={`Edit Course: ${editingCourse.title}`}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleUpdateCourse} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title</label>
              <input
                type="text"
                required
                value={editingCourse.title}
                onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                required
                value={editingCourse.description || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={editingCourse.category}
                  onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Passing %</label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={editingCourse.passing_percentage}
                  onChange={(e) => setEditingCourse({ ...editingCourse, passing_percentage: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm"
              >
                {actionLoading ? 'Saving...' : 'Save Updates'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modules Syllabus Studio Drawer/Modal */}
      {selectedCourseForModules && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCourseForModules(null)}
          title={`Syllabus Modules: ${selectedCourseForModules.title}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <p className="text-xs text-slate-500">
                Organize reading materials, video lessons, and practical labs.
              </p>
              <button
                onClick={() => setIsAddModuleOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Module</span>
              </button>
            </div>

            {/* Modules List */}
            {selectedCourseForModules.modules?.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-600">No syllabus modules added yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "Add Module" to author course content</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {selectedCourseForModules.modules?.map((mod, index) => (
                  <div
                    key={mod.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 hover:border-sky-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 font-bold flex items-center justify-center text-xs">
                        {mod.order_index || index + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{mod.title}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{mod.description}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                          <span className="capitalize font-semibold text-sky-600">{mod.content_type}</span>
                          <span>•</span>
                          <span>{mod.reading_time_mins} Mins Duration</span>
                          {mod.content_url && (
                            <>
                              <span>•</span>
                              <a
                                href={mod.content_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-500 hover:text-sky-600 underline flex items-center gap-0.5"
                              >
                                Resource Link <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteModule(mod.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add Module Modal */}
      {isAddModuleOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddModuleOpen(false)}
          title="Add Syllabus Learning Module"
        >
          <form onSubmit={handleAddModule} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Module Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Module 1: Container Orchestration Principles"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Module Summary</label>
              <textarea
                rows={2}
                required
                placeholder="Key concepts, topics discussed, and practical exercises..."
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Content Type</label>
                <select
                  value={moduleForm.content_type}
                  onChange={(e) => setModuleForm({ ...moduleForm, content_type: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
                >
                  <option value="document">Document / Reading</option>
                  <option value="video">Video Lecture</option>
                  <option value="interactive">Interactive Lab</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Reading (Mins)</label>
                <input
                  type="number"
                  min={5}
                  value={moduleForm.reading_time_mins}
                  onChange={(e) => setModuleForm({ ...moduleForm, reading_time_mins: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resource URL (Video / Docs)</label>
              <input
                type="url"
                placeholder="https://..."
                value={moduleForm.content_url}
                onChange={(e) => setModuleForm({ ...moduleForm, content_url: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddModuleOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm"
              >
                {actionLoading ? 'Adding...' : 'Add to Syllabus'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CourseManagement;

