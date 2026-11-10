import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Award, Mail, Lock, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      const role = res.user.role;
      if (from) {
        navigate(from, { replace: true });
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'provider') {
        navigate('/provider/dashboard');
      } else if (role === 'learner') {
        navigate('/learner/dashboard');
      } else {
        navigate('/verify');
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Please verify email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    // Auto-submit after setting state
    setTimeout(async () => {
      setError('');
      setLoading(true);
      try {
        const res = await login(demoEmail, demoPassword);
        const role = res.user.role;
        if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'provider') navigate('/provider/dashboard');
        else if (role === 'learner') navigate('/learner/dashboard');
        else navigate('/verify');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">CredentialVerify</span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="mt-1 text-xs text-slate-500">Sign in to your authenticated credential account</p>
        </div>

        {/* Demo Fast Login Pills */}
        <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-800 mb-2.5 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>One-Click Academic Demo Sign-In</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@credentialverify.com', 'password123')}
              className="px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium text-left transition-colors"
            >
              <span className="block font-bold">Admin Portal</span>
              <span className="text-[10px] text-purple-600 opacity-80">Full governance</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('provider@cloudacademy.com', 'password123')}
              className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-left transition-colors"
            >
              <span className="block font-bold">Course Provider</span>
              <span className="text-[10px] text-blue-600 opacity-80">Courses & Certs</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('learner@stanford.edu', 'password123')}
              className="px-2.5 py-1.5 rounded-lg border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-medium text-left transition-colors"
            >
              <span className="block font-bold">Learner Portal</span>
              <span className="text-[10px] text-cyan-600 opacity-80">Alex Mercer</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('recruiter@techcorp.com', 'password123')}
              className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-left transition-colors"
            >
              <span className="block font-bold">Corporate Verifier</span>
              <span className="text-[10px] text-indigo-600 opacity-80">TechCorp HR</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <span className="text-[11px] text-sky-600 hover:underline cursor-pointer">Forgot password?</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-sky-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-sky-600 hover:underline">
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

