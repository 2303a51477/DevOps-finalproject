import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  ArrowLeft, 
  Clock, 
  Award, 
  FileText, 
  Video, 
  ExternalLink, 
  Sparkles,
  Play,
  ArrowRight
} from 'lucide-react';
import { courseService } from '../services/courseService';
import { enrollmentService } from '../services/enrollmentService';
import { assessmentService } from '../services/assessmentService';
import { LoadingSpinner } from '../components/common/Modal';

export const LearningProgress = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadLearningRoom() {
      setLoading(true);
      try {
        const [cData, enrollments, assessments] = await Promise.all([
          courseService.getCourseById(courseId),
          enrollmentService.getEnrollments({ course_id: courseId }),
          assessmentService.getAssessments(courseId)
        ]);

        setCourse(cData);

        const currentEnrollment = enrollments.find(e => e.course_id === Number(courseId));
        if (!currentEnrollment) {
          // If not enrolled yet, auto-enroll
          const newEnroll = await enrollmentService.enrollCourse(Number(courseId));
          setEnrollment(newEnroll);
        } else {
          setEnrollment(currentEnrollment);
        }

        if (assessments && assessments.length > 0) {
          setAssessment(assessments[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLearningRoom();
  }, [courseId]);

  const handleToggleModuleComplete = async (moduleId) => {
    if (!enrollment) return;
    setUpdating(true);
    try {
      let completedList = [];
      try {
        completedList = JSON.parse(enrollment.completed_modules || '[]');
      } catch {
        completedList = [];
      }

      const isCompleted = completedList.includes(moduleId);
      const updated = await enrollmentService.updateProgress(enrollment.id, moduleId, !isCompleted);
      setEnrollment(updated);
    } catch (err) {
      alert('Error updating progress: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Opening Learning Workspace..." />;
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-semibold text-slate-700">Course could not be loaded</p>
        <Link to="/courses" className="mt-2 text-xs text-sky-600 underline">Return to Courses</Link>
      </div>
    );
  }

  let completedModuleIds = [];
  try {
    completedModuleIds = JSON.parse(enrollment?.completed_modules || '[]');
  } catch {
    completedModuleIds = [];
  }

  const activeModule = course.modules?.[activeModuleIndex] || null;
  const isCurrentModuleCompleted = activeModule ? completedModuleIds.includes(activeModule.id) : false;
  const isCurriculumCompleted = enrollment?.progress_percentage >= 100.0;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            to="/learner/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Learner Dashboard</span>
          </Link>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{course.title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Provider: {course.provider?.organization || course.provider?.name || 'Academy'} • {course.modules?.length || 0} Modules
          </p>
        </div>

        {/* Overall Progress Counter */}
        <div className="w-full md:w-64 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Curriculum Progress</span>
            <span className="font-bold text-sky-600">{enrollment?.progress_percentage || 0}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-sky-600 rounded-full transition-all duration-500"
              style={{ width: `${enrollment?.progress_percentage || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Module Content Reader / Player */}
        <div className="lg:col-span-2 space-y-6">
          {activeModule ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-sky-50 text-sky-700">
                  Module {activeModule.order_index || activeModuleIndex + 1} of {course.modules?.length}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {activeModule.reading_time_mins} minutes reading
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {activeModule.title}
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {activeModule.description}
                </p>
              </div>

              {/* Resource Content Placeholder / Viewer */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>Curriculum Study Materials & Documentation</span>
                </div>

                <div className="prose prose-sm text-xs text-slate-600 max-w-none leading-relaxed space-y-3">
                  <p>
                    In this module, you will master the foundational theories, hands-on architectural patterns, and production guidelines required for real-world deployment. Review all syllabus documentation thoroughly prior to attempting the end-of-course certification examination.
                  </p>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-700">
                    <p className="font-semibold text-slate-900 mb-1">Key Learning Objectives:</p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li>Understand core primitives, operational semantics, and fault-tolerant mechanisms.</li>
                      <li>Review security boundaries, cryptographic verification hashes, and access controls.</li>
                      <li>Complete practical lab exercises and verify configuration parameters.</li>
                    </ul>
                  </div>
                </div>

                {activeModule.content_url && (
                  <div className="pt-2">
                    <a
                      href={activeModule.content_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-sky-700 hover:border-sky-300 hover:bg-sky-50 shadow-sm transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                      <span>Open External Reference Material & Labs</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons: Mark Complete & Next */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => handleToggleModuleComplete(activeModule.id)}
                  disabled={updating}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
                    isCurrentModuleCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-sky-600 hover:bg-sky-700 text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isCurrentModuleCompleted ? 'Completed (Click to undo)' : 'Mark Module as Complete'}
                  </span>
                </button>

                {activeModuleIndex < (course.modules?.length || 0) - 1 ? (
                  <button
                    onClick={() => setActiveModuleIndex(activeModuleIndex + 1)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Next Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 font-medium">Final Module of Syllabus</span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-xs text-slate-500">No modules present in this course.</p>
            </div>
          )}

          {/* Assessment Unlock Callout Banner */}
          {isCurriculumCompleted && assessment && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold">100% Curriculum Fulfilled!</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    You have unlocked the official certification examination ({assessment.passing_score}% required to pass).
                  </p>
                </div>
              </div>

              <Link
                to={`/assessments/${assessment.id}`}
                className="px-5 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition-colors shrink-0 shadow-md flex items-center gap-2"
              >
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Take Certification Exam</span>
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Syllabus Checklist Navigation & Exam Card */}
        <div className="space-y-6">
          {/* Syllabus Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Course Modules Checklist</h3>
            <div className="space-y-2">
              {course.modules?.map((mod, idx) => {
                const isCompleted = completedModuleIds.includes(mod.id);
                const isActive = activeModuleIndex === idx;

                return (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModuleIndex(idx)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-3 ${
                      isActive
                        ? 'border-sky-500 bg-sky-50/50 shadow-sm'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className={`font-semibold line-clamp-1 ${isActive ? 'text-sky-900' : 'text-slate-800'}`}>
                        {mod.order_index || idx + 1}. {mod.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {mod.reading_time_mins} mins • {mod.content_type}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Certification Exam Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Official Certification</h4>
                <p className="text-[11px] text-slate-500">Graded Technical Assessment</p>
              </div>
            </div>

            {assessment ? (
              <div className="space-y-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">{assessment.title}</p>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Passing Grade:</span>
                  <span className="font-bold text-slate-800">{assessment.passing_score}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Time Limit:</span>
                  <span className="font-semibold text-slate-800">{assessment.time_limit_mins} Minutes</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Questions:</span>
                  <span className="font-semibold text-slate-800">{assessment.question_count || 4} Technical Items</span>
                </div>

                <div className="pt-3">
                  {isCurriculumCompleted ? (
                    <Link
                      to={`/assessments/${assessment.id}`}
                      className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Launch Assessment</span>
                    </Link>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500 text-[11px] text-center border border-slate-200">
                      Locked: Complete 100% of modules to unlock examination
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Assessment in preparation by course provider.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningProgress;

