import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import GlobalCallHandler from './components/GlobalCallHandler';
import MessagingWidget from './components/MessagingWidget';

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
import HelpPage from './pages/HelpPage';

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

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user?.role)) {
      // Redirect to appropriate dashboard
      if (['superadmin', 'moderator', 'support'].includes(user?.role)) return <Navigate to="/admin/dashboard" replace />;
      if (user?.role === 'client') return <Navigate to="/employer" replace />;
      return <Navigate to="/dashboard" replace />;
    }
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
        {/* ... existing routes ... */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/jobs" element={<JobSearchPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<ProtectedRoute requiredRole="freelancer"><JobSeekerDashboard /></ProtectedRoute>} />
        <Route path="/employer" element={<ProtectedRoute requiredRole="client"><EmployerDashboard /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute requiredRole={['freelancer', 'client']}><ProfileEditPage /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProfileViewPage />} />
        <Route path="/messages" element={<ProtectedRoute requiredRole={['freelancer', 'client']}><MessagesPage /></ProtectedRoute>} />
        <Route path="/portfolio" element={<ProtectedRoute requiredRole="freelancer"><PortfolioPage /></ProtectedRoute>} />
        <Route path="/portfolio/:userId" element={<PortfolioPage />} />
        <Route path="/notifications" element={<ProtectedRoute requiredRole={['freelancer', 'client']}><NotificationsPage /></ProtectedRoute>} />
        <Route path="/meetings" element={<ProtectedRoute requiredRole={['freelancer', 'client']}><MeetingsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute requiredRole={['freelancer', 'client']}><SettingsPage /></ProtectedRoute>} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <GlobalCallHandler />
      <MessagingWidget />
      <Toaster position="top-center" reverseOrder={false} />
    </BrowserRouter>
  );
}

export default App;


