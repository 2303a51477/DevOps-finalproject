import React from 'react';
import { Link } from 'react-router-dom';
import { Award, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 mt-auto py-10 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight">
                Online Course Certification & Credential Verification Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Standardized credential issuance, tamper-evident digital certificate registry, and automated multi-stakeholder verification for universities, corporate training institutes, and enterprise employers.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium pt-2">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> ISO/IEC 17024 Compliant
              </span>
              <span className="flex items-center gap-1 text-sky-600">
                <ShieldCheck className="w-3.5 h-3.5" /> 256-bit Cryptographic Hashes
              </span>
              <span className="flex items-center gap-1 text-indigo-600">
                <Lock className="w-3.5 h-3.5" /> Immutable Audit Logs
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Portal Navigation</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link to="/courses" className="hover:text-sky-600 transition-colors">Course Catalog</Link></li>
              <li><Link to="/verify" className="hover:text-sky-600 transition-colors">Instant Verification</Link></li>
              <li><Link to="/verifications/requests" className="hover:text-sky-600 transition-colors">Employer Requests</Link></li>
              <li><Link to="/login" className="hover:text-sky-600 transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-sky-600 transition-colors">Create Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">System Roles</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link to="/admin/dashboard" className="hover:text-sky-600 transition-colors">Admin Governance</Link></li>
              <li><Link to="/provider/dashboard" className="hover:text-sky-600 transition-colors">Course Providers</Link></li>
              <li><Link to="/learner/dashboard" className="hover:text-sky-600 transition-colors">Learner Portal</Link></li>
              <li><Link to="/reports" className="hover:text-sky-600 transition-colors">Mandatory Reports</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 Online Course Certification and Credential Verification Portal. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>FastAPI Python Backend</span>
            <span>•</span>
            <span>React & Vite Frontend</span>
            <span>•</span>
            <span>MySQL Relational DB</span>
            <span>•</span>
            <span>Docker & Kubernetes Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
