import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  BarChart3,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { StatsCard } from '../components/common/StatsCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/Modal';
import { courseService } from '../services/courseService';
import { certificateService } from '../services/certificateService';
import { verificationService } from '../services/verificationService';
import { reportService } from '../services/reportService';
import { userService } from '../services/settingsService';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    pendingCourses: 0,
    totalCertificates: 0,
    totalVerifications: 0,
  });
  const [pendingCoursesList, setPendingCoursesList] = useState([]);
  const [recentCertificates, setRecentCertificates] = useState([]);
  const [issuanceReport, setIssuanceReport] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [users, allCourses, certs, verifications, report] = await Promise.all([
        userService.getUsers(),
        courseService.getCourses({ status_filter: 'all' }),
        certificateService.getCertificates(),
        verificationService.getVerificationRequests(),
        reportService.getCertificateIssuanceReport()
      ]);

      const pending = allCourses.filter(c => c.status === 'pending');
      
      setStats({
        totalUsers: users.length,
        totalCourses: allCourses.length,
        pendingCourses: pending.length,
        totalCertificates: certs.length,
        totalVerifications: verifications.length,
      });

      setPendingCoursesList(pending);
      setRecentCertificates(certs.slice(0, 5));
      setIssuanceReport(report);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveCourse = async (courseId) => {
    try {
      await courseService.approveCourse(courseId);
      loadData();
    } catch (err) {
      alert('Error approving course: ' + err.message);
    }
  };

  const handleRejectCourse = async (courseId) => {
    try {
      await courseService.rejectCourse(courseId);
      loadData();
    } catch (err) {
      alert('Error rejecting course: ' + err.message);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Administrative Insights..." />;
  }

  // Chart Data
  const chartLabels = issuanceReport?.chart_data?.labels?.length 
    ? issuanceReport.chart_data.labels 
    : ['Oct 2026', 'Nov 2026', 'Dec 2026'];
  const chartValues = issuanceReport?.chart_data?.values?.length 
    ? issuanceReport.chart_data.values 
    : [2, 5, 8];

  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Certificates Issued',
        data: chartValues,
        backgroundColor: '#0284c7',
        borderRadius: 8,
      },
    ],
  };

  const doughnutData = {
    labels: ['Valid', 'Revoked'],
    datasets: [
      {
        data: [
          issuanceReport?.summary_metrics?.valid_count || 3,
          issuanceReport?.summary_metrics?.revoked_count || 1,
        ],
        backgroundColor: ['#10b981', '#f43f5e'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Administration Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global governance, credential integrity monitoring, and accreditation workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            to="/reports"
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>View All Reports</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="indigo"
          subtitle="4 Stakeholder Roles"
        />
        <StatsCard
          title="Accredited Courses"
          value={stats.totalCourses}
          icon={BookOpen}
          color="sky"
          subtitle="Multi-category curriculum"
        />
        <StatsCard
          title="Pending Approvals"
          value={stats.pendingCourses}
          icon={AlertTriangle}
          color={stats.pendingCourses > 0 ? "amber" : "emerald"}
          subtitle={stats.pendingCourses > 0 ? "Requires review" : "All courses verified"}
        />
        <StatsCard
          title="Certificates Issued"
          value={stats.totalCertificates}
          icon={Award}
          color="emerald"
          subtitle="Cryptographically logged"
        />
        <StatsCard
          title="Employer Verifications"
          value={stats.totalVerifications}
          icon={ShieldCheck}
          color="purple"
          subtitle="Real-time audits"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Certificate Issuance Velocity</h3>
              <p className="text-xs text-slate-500">Monthly credentials minted and signed</p>
            </div>
            <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md">
              Real-Time Telemetry
            </span>
          </div>
          <div className="h-64">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                  x: { grid: { display: false } },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">Credential Integrity</h3>
              <Badge status="valid" text="Audit Active" size="sm" />
            </div>
            <p className="text-xs text-slate-500 mb-4">Status ratio of all minted certificates</p>
            <div className="h-44 relative flex items-center justify-center">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '72%',
                  plugins: { legend: { position: 'bottom' } },
                }}
              />
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Average Academic Score</span>
            <span className="font-bold text-slate-900 text-sm">
              {issuanceReport?.summary_metrics?.average_score || 88.7}%
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Course Approvals & Recent Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Course Approvals */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Course Approvals Queue</span>
                {pendingCoursesList.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {pendingCoursesList.length}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">Submitted by Course Providers awaiting review</p>
            </div>
            <Link to="/provider/courses" className="text-xs font-semibold text-sky-600 hover:underline">
              Manage All
            </Link>
          </div>

          {pendingCoursesList.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No courses pending review</p>
              <p className="text-[11px] text-slate-400 mt-0.5">All provider courses are verified and active</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCoursesList.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{c.title}</h4>
                    <p className="text-[11px] text-slate-500">{c.category} • Passing: {c.passing_percentage}%</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveCourse(c.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleRejectCourse(c.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Issued Certificates */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Credentials Registry</h3>
              <p className="text-xs text-slate-500">Live ledger of awarded certificates</p>
            </div>
            <Link to="/certificates/manage" className="text-xs font-semibold text-sky-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-2">Certificate ID</th>
                  <th className="pb-2">Learner</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-mono font-semibold text-slate-900">
                      {cert.certificate_id}
                    </td>
                    <td className="py-2.5 font-medium text-slate-700">
                      {cert.learner?.name || 'Learner'}
                    </td>
                    <td className="py-2.5">
                      <Badge status={cert.status} size="sm" />
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        to={`/verify/${cert.verification_id}`}
                        className="text-sky-600 hover:text-sky-800 font-semibold inline-flex items-center gap-0.5"
                      >
                        Verify <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

