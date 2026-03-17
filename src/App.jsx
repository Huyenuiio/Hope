import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import EmployerDashboard from './pages/EmployerDashboard';
import JobSearchPage from './pages/JobSearchPage';
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AuthCallback from './pages/auth/AuthCallback';
import ProfileEditPage from './pages/ProfileEditPage';
import ProfileViewPage from './pages/ProfileViewPage';
import MessagesPage from './pages/MessagesPage';
import PortfolioPage from './pages/PortfolioPage';
import NotificationsPage from './pages/NotificationsPage';
import MeetingsPage from './pages/MeetingsPage';
import SettingsPage from './pages/SettingsPage';

// Protected route: requires authentication
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard
    if (['superadmin', 'moderator', 'support'].includes(user?.role)) return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === 'client') return <Navigate to="/employer" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Admin protected route: requires admin or moderator role
function AdminRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Check JWT admin role
  const isAdminByRole = isAuthenticated && ['superadmin', 'moderator', 'support'].includes(user?.role);

  if (!isAdminByRole) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/jobs" element={<JobSearchPage />} />

        {/* OAuth callback */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected routes — require login */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <JobSeekerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/employer" element={
          <ProtectedRoute>
            <EmployerDashboard />
          </ProtectedRoute>
        } />

        {/* Phase 4+5 — New Pages */}
        <Route path="/profile/edit" element={
          <ProtectedRoute>
            <ProfileEditPage />
          </ProtectedRoute>
        } />
        <Route path="/profile/:id" element={<ProfileViewPage />} />
        <Route path="/messages" element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        } />
        <Route path="/portfolio" element={
          <ProtectedRoute>
            <PortfolioPage />
          </ProtectedRoute>
        } />
        <Route path="/portfolio/:userId" element={<PortfolioPage />} />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        } />
        <Route path="/meetings" element={
          <ProtectedRoute>
            <MeetingsPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


