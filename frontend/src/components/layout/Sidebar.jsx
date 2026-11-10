import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  PlusCircle, 
  Award, 
  ShieldCheck, 
  FileText, 
  BarChart3, 
  Settings, 
  UserCheck, 
  LogOut,
  GraduationCap,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isProvider, isLearner, isVerifier, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-sky-50 text-sky-700 shadow-sm border border-sky-100 font-bold'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="space-y-6 overflow-y-auto">
          {/* User Profile Card */}
          <div className="bg-gradient-to-br from-slate-50 to-sky-50/50 p-3.5 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.organization || user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-white text-sky-700 border border-sky-200">
                  {user?.role} Portal
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Sections */}
          <nav className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Menu Navigation
            </p>

            {/* ADMIN NAV ITEMS */}
            {isAdmin && (
              <>
                <NavLink to="/admin/dashboard" className={navItemClass} onClick={onClose}>
                  <LayoutDashboard className="w-4 h-4 text-sky-600" />
                  <span>Admin Dashboard</span>
                </NavLink>

                <NavLink to="/admin/users" className={navItemClass} onClick={onClose}>
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>User Management</span>
                </NavLink>

                <NavLink to="/provider/courses" className={navItemClass} onClick={onClose}>
                  <BookOpen className="w-4 h-4 text-sky-600" />
                  <span>Course Management</span>
                </NavLink>

                <NavLink to="/certificates/manage" className={navItemClass} onClick={onClose}>
                  <Award className="w-4 h-4 text-sky-600" />
                  <span>Certificate Registry</span>
                </NavLink>

                <NavLink to="/verifications/requests" className={navItemClass} onClick={onClose}>
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Verification Requests</span>
                </NavLink>

                <NavLink to="/reports" className={navItemClass} onClick={onClose}>
                  <BarChart3 className="w-4 h-4 text-sky-600" />
                  <span>Mandatory Reports</span>
                </NavLink>

                <NavLink to="/admin/settings" className={navItemClass} onClick={onClose}>
                  <Settings className="w-4 h-4 text-sky-600" />
                  <span>System Settings</span>
                </NavLink>
              </>
            )}

            {/* COURSE PROVIDER NAV ITEMS */}
            {isProvider && (
              <>
                <NavLink to="/provider/dashboard" className={navItemClass} onClick={onClose}>
                  <LayoutDashboard className="w-4 h-4 text-sky-600" />
                  <span>Provider Dashboard</span>
                </NavLink>

                <NavLink to="/provider/courses" className={navItemClass} onClick={onClose}>
                  <BookOpen className="w-4 h-4 text-sky-600" />
                  <span>Course Management</span>
                </NavLink>

                <NavLink to="/certificates/manage" className={navItemClass} onClick={onClose}>
                  <Award className="w-4 h-4 text-sky-600" />
                  <span>Issue Certificates</span>
                </NavLink>

                <NavLink to="/reports" className={navItemClass} onClick={onClose}>
                  <BarChart3 className="w-4 h-4 text-sky-600" />
                  <span>Course & Learner Reports</span>
                </NavLink>
              </>
            )}

            {/* LEARNER NAV ITEMS */}
            {isLearner && (
              <>
                <NavLink to="/learner/dashboard" className={navItemClass} onClick={onClose}>
                  <LayoutDashboard className="w-4 h-4 text-sky-600" />
                  <span>My Learning Dashboard</span>
                </NavLink>

                <NavLink to="/courses" className={navItemClass} onClick={onClose}>
                  <BookOpen className="w-4 h-4 text-sky-600" />
                  <span>Browse Courses</span>
                </NavLink>

                <NavLink to="/certificates/manage" className={navItemClass} onClick={onClose}>
                  <Award className="w-4 h-4 text-sky-600" />
                  <span>My Certificates</span>
                </NavLink>

                <NavLink to="/verify" className={navItemClass} onClick={onClose}>
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Credential Verification</span>
                </NavLink>
              </>
            )}

            {/* VERIFIER / EMPLOYER NAV ITEMS */}
            {isVerifier && (
              <>
                <NavLink to="/verify" className={navItemClass} onClick={onClose}>
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Verify Credentials</span>
                </NavLink>

                <NavLink to="/verifications/requests" className={navItemClass} onClick={onClose}>
                  <ClipboardList className="w-4 h-4 text-sky-600" />
                  <span>Verification Requests</span>
                </NavLink>

                <NavLink to="/reports" className={navItemClass} onClick={onClose}>
                  <BarChart3 className="w-4 h-4 text-sky-600" />
                  <span>Verification Audit Reports</span>
                </NavLink>
              </>
            )}

            <div className="pt-3 border-t border-slate-100">
              <NavLink to="/courses" className={navItemClass} onClick={onClose}>
                <GraduationCap className="w-4 h-4 text-slate-500" />
                <span>All Accredited Courses</span>
              </NavLink>
              <NavLink to="/profile" className={navItemClass} onClick={onClose}>
                <UserCheck className="w-4 h-4 text-slate-500" />
                <span>My Profile</span>
              </NavLink>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

