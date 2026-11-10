import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../common/Modal';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If unauthorized for this specific role route, redirect to their own role dashboard
    const roleFallback = {
      admin: '/admin/dashboard',
      provider: '/provider/dashboard',
      learner: '/learner/dashboard',
      verifier: '/verify',
    };
    return <Navigate to={roleFallback[user?.role] || '/'} replace />;
  }

  return children;
};

export default ProtectedRoute;

