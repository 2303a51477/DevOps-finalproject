import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Award, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  FileText,
  BarChart2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/courseService';
import { enrollmentService } from '../services/enrollmentService';
import { certificateService } from '../services/certificateService';
import { StatsCard } from '../components/common/StatsCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/Modal';

export const CourseProviderDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProviderData = async () => {
    setLoading(true);
    try {
      const [cData, eData, certData] = await Promise.all([
        courseService.getCourses({ provider_id: user?.id, status_filter: 'all' }),
        enrollmentService.getEnrollments(),
        certificateService.getCertificates()
      ]);
      setCourses(cData);
      setEnrollments(eData);
      setCertificates(certData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviderData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner text="Loading Provider Academy Metrics..." />;
  }

  const completedCount = enrollments.filter(e => e.status === 'completed').length;
  const inProgressCount = enrollments.filter(e => e.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-700 to-sky-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
            Provider Management Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-3">
            {user?.organization || 'Accredited Academy'} Portal
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl">
            Author accredited curriculum, manage interactive technical assessments, track enrolled student progress, and monitor cryptographic credential issuance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/provider/courses"
            className="px-4 py-2.5 rounded-xl bg-white text-sky-800 font-bold text-xs hover:bg-sky-50 shadow-md transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-sky-600" />
            <span>Create New Course</span>
          </Link>
          <Link
            to="/certificates/manage"
            className="px-4 py-2.5 rounded-xl bg-sky-800/80 hover:bg-sky-800 text-white border border-white/20 font-semibold text-xs transition-all flex items-center gap-2"
          >
            <Award className="w-4 h-4 text-sky-300" />
            <span>Issue Certificate</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="My Published Courses"
          value={courses.length}
          icon={BookOpen}
          color="sky"
          subtitle="Curriculum programs"
        />
        <StatsCard
          title="Active Enrolled Learners"
          value={enrollments.length}
          icon={Users}
          color="indigo"
          subtitle={`${inProgressCount} currently active`}
        />
        <StatsCard
          title="Course Completions"
          value={completedCount}
          icon={CheckCircle2}
          color="emerald"
          subtitle={`${((completedCount / (enrollments.length || 1)) * 100).toFixed(0)}% completion rate`}
        />
        <StatsCard
          title="Credentials Awarded"
          value={certificates.length}
          icon={Award}
          color="purple"
          subtitle="Tamper-proof certificates"
        />
      </div>

      {/* Active Courses Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Curriculum Portfolio</h2>
            <p className="text-xs text-slate-500">Manage modules, syllabus, and assessments</p>
          </div>
          <Link
            to="/provider/courses"
            className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
          >
            <span>Course Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No courses created yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Start designing your first certified educational program</p>
            <Link
              to="/provider/courses"
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Course</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-slate-200/80 p-4 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-sky-50 text-sky-700">
                      {course.category}
                    </span>
                    <Badge status={course.status} size="sm" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mt-1">{course.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{course.modules?.length || 0} Modules</span>
                  <span>{course.duration_hours} Hours</span>
                  <Link
                    to="/provider/courses"
                    className="font-bold text-sky-600 hover:text-sky-800"
                  >
                    Edit Syllabus →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseProviderDashboard;

