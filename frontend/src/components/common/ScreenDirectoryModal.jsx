import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  ExternalLink, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText, 
  Award, 
  ShieldCheck, 
  ClipboardList, 
  BarChart3, 
  UserCheck, 
  Settings, 
  Play, 
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { Modal } from './Modal';

export const SCREEN_LIST = [
  { id: 1, title: '1. Public Landing Page', path: '/', badge: 'Core Hub', icon: Compass, role: 'Public', desc: 'Hero, real-time live search, statistics, workflow diagram & catalog preview' },
  { id: 2, title: '2. User Registration Page', path: '/register', badge: 'Auth', icon: Users, role: 'Public', desc: 'Role tabs (Learner, Provider, Verifier), input validation & auto-login' },
  { id: 3, title: '3. Login & Demo Fast-Sign-In', path: '/login', badge: 'Auth', icon: UserCheck, role: 'Public', desc: 'One-click sign-in buttons for Admin, Provider, Learner, and Verifier' },
  { id: 4, title: '4. System Admin Dashboard', path: '/admin/dashboard', badge: 'Core Hub', icon: LayoutDashboard, role: 'Admin', desc: 'Platform metrics, certificate issuance charts & pending course queue' },
  { id: 5, title: '5. User Access Management', path: '/admin/users', badge: 'Admin', icon: Users, role: 'Admin', desc: 'Directory, role filtering, active toggles & edit permissions modal' },
  { id: 6, title: '6. Course Provider Dashboard', path: '/provider/dashboard', badge: 'Core Hub', icon: LayoutDashboard, role: 'Provider', desc: 'Curriculum portfolio, active learners, completions & quick actions' },
  { id: 7, title: '7. Course Creation & Syllabus Studio', path: '/provider/courses', badge: 'Provider', icon: BookOpen, role: 'Provider', desc: 'Course authoring, syllabus modules, content URLs & passing thresholds' },
  { id: 8, title: '8. Accredited Course Catalog', path: '/courses', badge: 'Core Hub', icon: Layers, role: 'Public', desc: 'Search catalog, category filters, difficulty pills & Java/C/C++ courses' },
  { id: 9, title: '9. Course Syllabus & Details', path: '/courses/1', badge: 'Curriculum', icon: BookOpen, role: 'Public', desc: 'Curriculum overview, module breakdown, accreditation seal & enroll action' },
  { id: 10, title: '10. Learner Academic Dashboard', path: '/learner/dashboard', badge: 'Core Hub', icon: LayoutDashboard, role: 'Learner', desc: 'Enrolled course progress bars, earned certificates gallery & resume buttons' },
  { id: 11, title: '11. Learning Room & Progress Page', path: '/learn/1', badge: 'Core Hub', icon: Play, role: 'Learner', desc: 'Module reader, completion checkboxes, live % recalculation & exam unlock' },
  { id: 12, title: '12. Interactive Certification Exam', path: '/assessments/1', badge: 'Core Hub', icon: Award, role: 'Learner', desc: 'Timed quiz, multiple-choice radio questions, auto-grader & instant certificate' },
  { id: 13, title: '13. Certificate Ledger & Registry', path: '/certificates/manage', badge: 'Registry', icon: Award, role: 'Provider / Admin', desc: 'Issued credentials ledger, manual issuance modal & revocation with audit reason' },
  { id: 14, title: '14. Public Credential Verification', path: '/verify/VFY-8A7B6C5D4E3F', badge: 'Core Hub', icon: ShieldCheck, role: 'Public (Zero-Login)', desc: 'Valid/revoked status badges, certificate preview, QR code & PDF download' },
  { id: 15, title: '15. Verification Requests Portal', path: '/verifications/requests', badge: 'Audit', icon: ClipboardList, role: 'Verifier', desc: 'Employer background check submission form & historical audit log' },
  { id: 16, title: '16. Mandatory Reports & Telemetry', path: '/reports', badge: 'Core Hub', icon: BarChart3, role: 'All Roles', desc: '4 Mandatory Reports (A, B, C, D) with Chart.js, CSV export & print/PDF' },
  { id: 17, title: '17. User Profile & Security', path: '/profile', badge: 'Account', icon: UserCheck, role: 'Authenticated', desc: 'User details, organizational affiliation & salted bcrypt password changes' },
  { id: 18, title: '18. System Configurations & Settings', path: '/admin/settings', badge: 'Admin', icon: Settings, role: 'Admin', desc: 'Branding title, passing score %, auto-issue toggles & security seal settings' },
];

export const ScreenDirectoryModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Application Screens Directory (18 Functional Screens)"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Click any screen below to jump directly to it for instant evaluation and demonstration:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-2">
          {SCREEN_LIST.map((screen) => {
            const Icon = screen.icon;
            const isCore = screen.badge === 'Core Hub';
            return (
              <Link
                key={screen.id}
                to={screen.path}
                onClick={onClose}
                className={`p-3.5 rounded-xl border text-left transition-all hover:shadow-md flex items-start gap-3 group ${
                  isCore
                    ? 'border-sky-300 bg-sky-50/40 hover:bg-sky-50'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  isCore ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                      {screen.title}
                    </h4>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                      isCore ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {screen.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{screen.desc}</p>
                  <p className="text-[10px] text-sky-700 font-mono mt-1 flex items-center gap-1 font-semibold">
                    <span>{screen.path}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default ScreenDirectoryModal;
