import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Award, 
  ShieldCheck, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  BookOpen, 
  CheckCircle2, 
  FileText,
  Search,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, isAuthenticated, logout, isAdmin, isProvider, isLearner, isVerifier } = useAuth();
  const navigate = useNavigate();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [verifySearch, setVerifySearch] = useState('');

  const handleQuickVerify = (e) => {
    e.preventDefault();
    if (verifySearch.trim()) {
      navigate(`/verify/${verifySearch.trim()}`);
      setVerifySearch('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Logo & Hamburger */}
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight block leading-tight">
                  Credential<span className="text-sky-600">Verify</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase block">
                  Official Certification Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Quick Verification Search Input */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <form onSubmit={handleQuickVerify} className="w-full relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Verify by Certificate ID or Verification Hash..."
                value={verifySearch}
                onChange={(e) => setVerifySearch(e.target.value)}
                className="w-full pl-9 pr-24 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors"
              >
                Verify
              </button>
            </form>
          </div>

          {/* Right: Nav Links / User Menu */}
          <div className="flex items-center gap-3">
            <Link
              to="/courses"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              Explore Courses
            </Link>

            <Link
              to="/verify"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/60 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>Verify Credential</span>
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:block text-xs">
                    <p className="font-semibold text-slate-800 leading-tight">{user?.name?.split(' ')[0]}</p>
                    <p className="text-[10px] text-slate-500 capitalize leading-none">{user?.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-100 py-1.5 z-50 divide-y divide-slate-100"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-sky-50 text-sky-700 border border-sky-100">
                        {user?.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to={
                          isAdmin ? '/admin/dashboard' :
                          isProvider ? '/provider/dashboard' :
                          isLearner ? '/learner/dashboard' : '/verify'
                        }
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-sky-600"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-400" />
                        Role Dashboard
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-sky-600"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>

                      {(isAdmin || isProvider) && (
                        <Link
                          to="/reports"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-sky-600"
                        >
                          <FileText className="w-4 h-4 text-slate-400" />
                          Analytics & Reports
                        </Link>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm hover:shadow transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
