import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

/**
 * Google OAuth callback page
 * URL: /auth/callback?token=...
 * Backend redirects here after successful Google login
 */
export default function AuthCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken, user } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate(`/?auth_error=${error}`);
      return;
    }

    if (token) {
      loginWithToken(token);
    } else {
      navigate('/');
    }
  }, [searchParams, loginWithToken, navigate]);

  // After user is loaded, redirect to appropriate dashboard
  useEffect(() => {
    if (!user) return;

    // First-time login: role not set yet, go to role selection
    if (!user.role || user.role === 'freelancer') {
      navigate('/dashboard');
    } else if (user.role === 'client') {
      navigate('/employer');
    } else if (user.role === 'admin' || user.role === 'moderator') {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center gap-4 max-w-sm w-full mx-4">
        {/* Animated spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Đang đăng nhập...</h2>
          <p className="text-sm text-slate-500">Vui lòng đợi trong giây lát</p>
        </div>
        {/* Brand */}
        <div className="text-2xl font-bold text-slate-800">
          Ho<span className="bg-primary text-white rounded px-1 text-xl">pe</span>
        </div>
      </div>
    </div>
  );
}
