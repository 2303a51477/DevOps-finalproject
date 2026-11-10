import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Clock, 
  Play, 
  Download, 
  ShieldCheck, 
  ExternalLink,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { enrollmentService } from '../services/enrollmentService';
import { certificateService } from '../services/certificateService';
import { StatsCard } from '../components/common/StatsCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/Modal';

export const LearnerDashboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLearnerData = async () => {
    setLoading(true);
    try {
      const [eData, certData] = await Promise.all([
        enrollmentService.getEnrollments(),
        certificateService.getCertificates()
      ]);
      setEnrollments(eData);
      setCertificates(certData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLearnerData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner text="Loading Your Scholar Progress..." />;
  }

  const inProgress = enrollments.filter(e => e.status === 'in_progress');
  const completed = enrollments.filter(e => e.status === 'completed');

  return (
    <div className="space-y-8">
      {/* Learner Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-900 rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
            Learner Academic Console
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-3">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl">
            Track your course progress, complete technical assessments, and manage your tamper-proof credentials.
          </p>
        </div>

        <Link
          to="/courses"
          className="px-5 py-3 rounded-xl bg-white text-sky-900 font-bold text-xs hover:bg-sky-50 shadow-md transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <BookOpen className="w-4 h-4 text-sky-600" />
          <span>Browse More Courses</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Enrolled Courses"
          value={enrollments.length}
          icon={BookOpen}
          color="sky"
          subtitle="Total programs active"
        />
        <StatsCard
          title="In Progress"
          value={inProgress.length}
          icon={Clock}
          color="amber"
          subtitle="Currently studying"
        />
        <StatsCard
          title="Completed Curricula"
          value={completed.length}
          icon={CheckCircle2}
          color="emerald"
          subtitle="100% syllabus fulfilled"
        />
        <StatsCard
          title="Earned Certificates"
          value={certificates.length}
          icon={Award}
          color="purple"
          subtitle="Signed & Verifiable"
        />
      </div>

      {/* Enrolled Courses Progress */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Active Course Progress</h2>
            <p className="text-xs text-slate-500">Pick up right where you left off</p>
          </div>
          <Link to="/courses" className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1">
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No active enrollments</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Enroll in accredited courses to earn certifications</p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition-colors"
            >
              <span>Explore Catalog</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {enrollments.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 hover:border-sky-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-sky-50 text-sky-700">
                      {item.course?.category || 'General'}
                    </span>
                    <Badge status={item.status} size="sm" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{item.course?.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {item.course?.description}
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                      <span>Curriculum Completion</span>
                      <span className="font-bold text-sky-600">{item.progress_percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-600 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Enrolled: {new Date(item.enrolled_at).toLocaleDateString()}
                    </span>
                    <Link
                      to={`/learn/${item.course_id}`}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{item.progress_percentage >= 100 ? 'Review / Test' : 'Resume Learning'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Earned Certificates Showcase */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Earned Digital Credentials</h2>
            <p className="text-xs text-slate-500">Official, tamper-proof certificates with QR verification</p>
          </div>
          <Link
            to="/certificates/manage"
            className="text-xs font-semibold text-sky-600 hover:text-sky-800"
          >
            Manage All
          </Link>
        </div>

        {certificates.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No certificates earned yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Complete course modules 100% and pass the final assessment to earn your credentials!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-gradient-to-br from-white to-sky-50/30 rounded-2xl border border-sky-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <Badge status={cert.status} size="sm" />
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{cert.course?.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Provider: {cert.provider?.organization || cert.provider?.name || 'Academy'}
                  </p>

                  <div className="mt-3 p-2.5 rounded-xl bg-white border border-slate-200/70 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Certificate ID:</span>
                      <span className="font-mono font-bold text-slate-700">{cert.certificate_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Score:</span>
                      <span className="font-bold text-emerald-600">{cert.score}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Issued:</span>
                      <span className="text-slate-600">{new Date(cert.issue_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Link
                    to={`/verify/${cert.verification_id}`}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>Verify</span>
                  </Link>
                  <button
                    onClick={() => certificateService.downloadPdf(cert.id, `${cert.certificate_id}.pdf`)}
                    className="py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    title="Download Official PDF Certificate"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnerDashboard;

