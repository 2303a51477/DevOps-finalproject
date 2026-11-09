import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Award, 
  CheckCircle2, 
  Layers, 
  FileText, 
  Video, 
  Play, 
  ShieldCheck, 
  Building2, 
  GraduationCap, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/courseService';
import { enrollmentService } from '../services/enrollmentService';
import { LoadingSpinner } from '../components/common/Modal';

export const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCourseAndEnrollment() {
      setLoading(true);
      try {
        const cData = await courseService.getCourseById(id);
        setCourse(cData);

        if (isAuthenticated) {
          const enrollments = await enrollmentService.getEnrollments({ course_id: id });
          const userEnrollment = enrollments.find(e => e.course_id === Number(id));
          if (userEnrollment) {
            setEnrollment(userEnrollment);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load course details');
      } finally {
        setLoading(false);
      }
    }
    loadCourseAndEnrollment();
  }, [id, isAuthenticated]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    setEnrolling(true);
    try {
      const newEnrollment = await enrollmentService.enrollCourse(course.id);
      setEnrollment(newEnrollment);
      navigate(`/learn/${course.id}`);
    } catch (err) {
      alert('Enrollment error: ' + err.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving accredited syllabus..." />;
  }

  if (error || !course) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">Course Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'The requested curriculum does not exist.'}</p>
        <Link to="/courses" className="mt-4 inline-block px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold">
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Course Hero Banner */}
      <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-xl relative text-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 sm:p-12 items-center">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
                {course.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-slate-300 border border-white/10">
                {course.difficulty} Level
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Accredited
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {course.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              {course.description}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>Provider: <strong>{course.provider?.organization || course.provider?.name || 'Academy'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>{course.duration_hours} Estimated Hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-400" />
                <span>Passing Grade: {course.passing_percentage}%</span>
              </div>
            </div>
          </div>

          {/* Quick Action Card on Right */}
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase font-bold text-sky-300 tracking-wider">Credential Status</p>
              <h3 className="text-lg font-bold text-white mt-1">Official Digital Certificate</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Passing all {course.modules?.length || 0} modules and the final exam grants an immutable verification ID and downloadable PDF.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              {enrollment ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Your Learning Progress:</span>
                    <span className="font-bold text-sky-300">{enrollment.progress_percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-sky-400 rounded-full transition-all duration-500"
                      style={{ width: `${enrollment.progress_percentage}%` }}
                    />
                  </div>
                  <button
                    onClick={() => navigate(`/learn/${course.id}`)}
                    className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Continue Course Room</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all"
                >
                  {enrolling ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enroll Now Free</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Syllabus Modules & Assessment Criteria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Syllabus Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Curriculum Syllabus & Content</h2>
                <p className="text-xs text-slate-500">{course.modules?.length || 0} modules designed for master-level competency</p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700">
                Structured Learning
              </span>
            </div>

            {(!course.modules || course.modules.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">Modules syllabus in finalization.</p>
            ) : (
              <div className="space-y-3">
                {course.modules.map((mod, idx) => (
                  <div
                    key={mod.id}
                    className="p-4 rounded-xl border border-slate-200/70 hover:border-sky-300 bg-white transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {mod.order_index || idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{mod.title}</h4>
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {mod.reading_time_mins} mins
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mod.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-600">
                            {mod.content_type === 'video' ? <Video className="w-2.5 h-2.5 text-sky-600" /> : <FileText className="w-2.5 h-2.5 text-sky-600" />}
                            {mod.content_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Accreditation & Assessment Rules */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>Assessment & Certification Rules</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="font-semibold text-slate-800">1. Syllabus Completion</p>
                <p className="text-slate-500 mt-0.5">Learners must complete 100% of all curriculum modules before examination access is unlocked.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="font-semibold text-slate-800">2. Passing Score Threshold</p>
                <p className="text-slate-500 mt-0.5">Scoring at least <strong className="text-slate-900">{course.passing_percentage}%</strong> on the timed technical quiz qualifies for instant credential issuance.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="font-semibold text-slate-800">3. Cryptographic Verification</p>
                <p className="text-slate-500 mt-0.5">Earned credentials receive a unique Verification ID and QR code verifiable by employers anytime without sign-in.</p>
              </div>
            </div>

            <div className="pt-2">
              {enrollment ? (
                <button
                  onClick={() => navigate(`/learn/${course.id}`)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  Go to Learning Room
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
                >
                  Enroll in Curriculum
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
