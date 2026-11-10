import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  ArrowRight, 
  BookOpen, 
  Users, 
  TrendingUp, 
  GraduationCap, 
  Building2, 
  FileCheck,
  ChevronRight,
  ExternalLink,
  Compass
} from 'lucide-react';
import { courseService } from '../services/courseService';
import { ScreenDirectoryModal } from '../components/common/ScreenDirectoryModal';

export const LandingPage = () => {
  const [verificationInput, setVerificationInput] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screensModalOpen, setScreensModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadFeaturedCourses() {
      try {
        const data = await courseService.getCourses({ limit: 6 });
        setCourses(data.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadFeaturedCourses();
  }, []);

  const handleVerify = (e) => {
    e.preventDefault();
    if (verificationInput.trim()) {
      navigate(`/verify/${verificationInput.trim()}`);
    }
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-slate-50 pt-16 pb-24 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-semibold mb-6">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Next-Generation Tamper-Proof Digital Credential Registry</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Accredited Online Course Certification & Instant <span className="text-sky-600">Credential Verification</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Empowering higher education institutions, corporate academies, and learners with cryptographic credential issuance, automated assessments, and instant employer verification.
          </p>

          {/* Central Live Verification Search Box */}
          <div className="mt-10 max-w-2xl mx-auto">
            <div className="bg-white p-2.5 rounded-2xl shadow-xl shadow-sky-500/10 border border-slate-200">
              <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={verificationInput}
                    onChange={(e) => setVerificationInput(e.target.value)}
                    placeholder="Enter Certificate ID (e.g. CERT-2026-98124) or Verification Hash..."
                    className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 sm:bg-transparent rounded-xl focus:outline-none text-slate-900 placeholder:text-slate-400 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md shadow-sky-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Credential</span>
                </button>
              </form>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500">
              <span>Try demo hashes:</span>
              <button 
                onClick={() => navigate('/verify/VFY-8A7B6C5D4E3F')}
                className="font-mono text-sky-600 hover:underline font-semibold"
              >
                VFY-8A7B6C5D4E3F (Valid)
              </button>
              <span>•</span>
              <button 
                onClick={() => navigate('/verify/VFY-9REVOKED001')}
                className="font-mono text-rose-600 hover:underline font-semibold"
              >
                VFY-9REVOKED001 (Revoked)
              </button>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/courses"
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Accredited Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setScreensModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md shadow-sky-600/20 hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>18 Screens Directory</span>
            </button>
            <Link
              to="/verifications/requests"
              className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-sm transition-all flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Employer Verification Portal</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Real-time Platform Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <Award className="w-6 h-6" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">4,850+</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Verified Credentials Issued</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">99.98%</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Verification Accuracy</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">320+</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Enterprise Employers</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">&lt; 1.2s</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Average Verification Latency</div>
          </div>
        </div>
      </section>

      {/* How It Works Diagram */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-2">Architectural Workflow</h2>
          <h3 className="text-3xl font-bold text-slate-900 tracking-tight">How Credential Verification Works</h3>
          <p className="mt-2 text-sm text-slate-600">A seamless, tamper-proof pipeline connecting educators, students, and hiring managers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 relative">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm mb-4">1</div>
            <h4 className="text-base font-bold text-slate-900 mb-1">Course & Curriculum</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Certified course providers create accredited syllabus modules, learning objectives, and rigorous technical assessments.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 relative">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm mb-4">2</div>
            <h4 className="text-base font-bold text-slate-900 mb-1">Learn & Master</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Learners study course materials, track module completion in real time, and sit for interactive timed examinations.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 relative">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm mb-4">3</div>
            <h4 className="text-base font-bold text-slate-900 mb-1">Automated Issuance</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Upon fulfilling passing criteria, the platform automatically generates cryptographic certificates with embedded QR codes & PDF export.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 relative">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm mb-4">4</div>
            <h4 className="text-base font-bold text-slate-900 mb-1">Instant Verification</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Employers scan the QR code or query the Verification ID without login to validate validity, grades, and audit status.</p>
          </div>
        </div>
      </section>

      {/* Featured Courses Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-1">Accredited Catalog</h2>
            <h3 className="text-2xl font-bold text-slate-900">Featured Certification Programs</h3>
          </div>
          <Link
            to="/courses"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>View All Courses</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
              <div className="h-44 bg-slate-100 relative overflow-hidden">
                <img
                  src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-white/90 backdrop-blur text-slate-800 shadow-sm">
                  {course.category}
                </span>
                <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-sky-600 text-white shadow-sm">
                  {course.difficulty}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 line-clamp-1 mb-2">{course.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {course.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {course.duration_hours} Hours • {course.passing_percentage}% Passing
                  </span>
                  <Link
                    to={`/courses/${course.id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>View Syllabus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Role Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 to-sky-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-3xl">
            <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-400/30">
              Role-Based Architecture
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold mt-4 tracking-tight">
              Tailored Portals for Every Stakeholder in the Education Ecosystem
            </h3>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Explore purpose-built dashboards designed specifically for Administrators, Accredited Course Providers, Active Learners, and Corporate Verifiers.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-colors">
              <h4 className="font-bold text-sm text-sky-300">Admin Governance</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">System analytics, course approvals, user roles management, and audit logs.</p>
              <Link to="/login" className="inline-flex items-center gap-1 text-xs text-white font-semibold mt-4 hover:underline">
                Explore Admin <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-colors">
              <h4 className="font-bold text-sm text-sky-300">Course Providers</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">Curriculum authoring, assessments, learner tracking, and manual/auto credential issuance.</p>
              <Link to="/login" className="inline-flex items-center gap-1 text-xs text-white font-semibold mt-4 hover:underline">
                Explore Provider <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-colors">
              <h4 className="font-bold text-sm text-sky-300">Learners & Scholars</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">Enroll in courses, study materials, take quizzes, and download PDF certificates.</p>
              <Link to="/login" className="inline-flex items-center gap-1 text-xs text-white font-semibold mt-4 hover:underline">
                Explore Learner <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-colors">
              <h4 className="font-bold text-sm text-sky-300">Corporate Verifiers</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">Instant verification by hash or QR code, request formal background checks, and view history.</p>
              <Link to="/verify" className="inline-flex items-center gap-1 text-xs text-white font-semibold mt-4 hover:underline">
                Verify Now <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ScreenDirectoryModal
        isOpen={screensModalOpen}
        onClose={() => setScreensModalOpen(false)}
      />
    </div>
  );
};

export default LandingPage;

