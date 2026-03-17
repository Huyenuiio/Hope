import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginWithEmail } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await loginWithEmail({ email: form.email, password: form.password });
    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4 font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      {/* Top bar */}
      <div className="relative z-10 w-full max-w-md flex justify-between items-center mb-8">
        <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2">
          <span className="material-icons text-base">arrow_back</span>
          {t('admin.login.backToSite')}
        </Link>
        <LanguageSwitcher variant="compact" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 border border-primary/30 rounded-2xl mb-4">
            <span className="material-icons text-primary text-3xl">admin_panel_settings</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Ho<span className="bg-primary text-white rounded px-1.5 py-0.5 text-2xl ml-0.5">pe</span>
          </h1>
          <h2 className="text-xl font-semibold text-slate-200 mt-3">{t('admin.login.title')}</h2>
          <p className="text-slate-400 text-sm mt-1">{t('admin.login.subtitle')}</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email / Tên đăng nhập
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <span className="material-icons text-lg">person</span>
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="superadmin@hope.com"
                  className="w-full bg-white/10 border border-white/20 text-white rounded-xl py-3 pl-10 pr-4 text-sm placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('admin.login.password')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <span className="material-icons text-lg">lock</span>
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={t('admin.login.passwordPlaceholder')}
                  className="w-full bg-white/10 border border-white/20 text-white rounded-xl py-3 pl-10 pr-10 text-sm placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white transition-colors"
                >
                  <span className="material-icons text-lg">{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                <span className="material-icons text-base">error_outline</span>
                {error}
              </div>
            )}

            {/* Hint */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-xs text-slate-400">
              <span className="text-primary font-bold">Lưu ý:</span> Module đăng nhập này được kết nối trực tiếp với Database. Khóa Anti-Bruteforce IP sẽ kích hoạt nếu nhập sai 5 lần chặn 15 phút.
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <span className="material-icons text-lg animate-spin">refresh</span>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span className="material-icons text-lg">login</span>
                  {t('admin.login.signIn')}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Secure login note */}
        <div className="text-center mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
          <span className="material-icons text-sm">shield</span>
          {t('admin.login.secureLogin')}
        </div>
      </div>
    </div>
  );
}
