import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';

// 18 Pages
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import AdminSettings from './pages/AdminSettings';
import CourseProviderDashboard from './pages/CourseProviderDashboard';
import CourseManagement from './pages/CourseManagement';
import CourseListing from './pages/CourseListing';
import CourseDetails from './pages/CourseDetails';
import LearnerDashboard from './pages/LearnerDashboard';
import LearningProgress from './pages/LearningProgress';
import AssessmentPage from './pages/AssessmentPage';
import CertificateManagement from './pages/CertificateManagement';
import CertificateVerification from './pages/CertificateVerification';
import VerificationRequests from './pages/VerificationRequests';
import ReportsAndAnalytics from './pages/ReportsAndAnalytics';
import UserProfile from './pages/UserProfile';

function MainLayout() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Pages where sidebar is hidden for maximum immersion or public branding
  const isPublicStandalone = ['/', '/login', '/register'].includes(location.pathname);
  const showSidebar = isAuthenticated && !isPublicStandalone;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex w-full">
        {showSidebar && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <main className={`flex-1 transition-all duration-200 ${showSidebar ? 'lg:pl-64' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              {/* 1. Public Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* 2. Registration Page */}
              <Route path="/register" element={<RegisterPage />} />

              {/* 3. Login Page */}
              <Route path="/login" element={<LoginPage />} />

              {/* 4. Admin Dashboard */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* 5. User Management */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />

              {/* 6. Course Provider Dashboard */}
              <Route
                path="/provider/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['provider', 'admin']}>
                    <CourseProviderDashboard />
                  </ProtectedRoute>
                }
              />

              {/* 7. Course Creation and Management */}
              <Route
                path="/provider/courses"
                element={
                  <ProtectedRoute allowedRoles={['provider', 'admin']}>
                    <CourseManagement />
                  </ProtectedRoute>
                }
              />

              {/* 8. Course Listing */}
              <Route path="/courses" element={<CourseListing />} />

              {/* 9. Course Details */}
              <Route path="/courses/:id" element={<CourseDetails />} />

              {/* 10. Learner Dashboard */}
              <Route
                path="/learner/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['learner', 'admin', 'provider']}>
                    <LearnerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* 11. Learning Progress Page */}
              <Route
                path="/learn/:courseId"
                element={
                  <ProtectedRoute allowedRoles={['learner', 'admin', 'provider']}>
                    <LearningProgress />
                  </ProtectedRoute>
                }
              />

              {/* 12. Assessment Page */}
              <Route
                path="/assessments/:assessmentId"
                element={
                  <ProtectedRoute allowedRoles={['learner', 'admin', 'provider']}>
                    <AssessmentPage />
                  </ProtectedRoute>
                }
              />

              {/* 13. Certificate Management */}
              <Route
                path="/certificates/manage"
                element={
                  <ProtectedRoute allowedRoles={['learner', 'provider', 'admin']}>
                    <CertificateManagement />
                  </ProtectedRoute>
                }
              />

              {/* 14. Certificate Verification Page (Public & Authenticated) */}
              <Route path="/verify" element={<CertificateVerification />} />
              <Route path="/verify/:verificationId" element={<CertificateVerification />} />

              {/* 15. Verification Requests Page */}
              <Route path="/verifications/requests" element={<VerificationRequests />} />

              {/* 16. Reports and Analytics */}
              <Route path="/reports" element={<ReportsAndAnalytics />} />

              {/* 17. User Profile */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />

              {/* 18. Admin Settings */}
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

export function App() {
  return (
    <Router>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;
