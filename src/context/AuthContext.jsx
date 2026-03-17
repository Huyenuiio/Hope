import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from token on app mount
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Called after Google OAuth redirect with ?token=...
  const loginWithToken = useCallback((token) => {
    localStorage.setItem('token', token);
    loadUser();
  }, [loadUser]);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore backend errors during logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  }, []);

  // Redirect to Google OAuth
  const loginWithGoogle = useCallback(() => {
    window.location.href = authAPI.googleLoginUrl;
  }, []);

  // Normal login (For Admin/Support roles)
  const loginWithEmail = useCallback(async (credentials) => {
    try {
      const { data } = await authAPI.login(credentials);
      if (data.token) {
        localStorage.setItem('token', data.token);
        await loadUser();
      }
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Đăng nhập thất bại' };
    }
  }, [loadUser]);

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated,
    loginWithGoogle,
    loginWithToken,
    loginWithEmail,
    logout,
    updateUser,
    isFreelancer: user?.role === 'freelancer',
    isClient: user?.role === 'client',
    isAdmin: user?.role === 'superadmin' || user?.role === 'moderator' || user?.role === 'support',
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export default AuthContext;
