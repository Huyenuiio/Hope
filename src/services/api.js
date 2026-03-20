import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — clear token and redirect to home
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ── AUTH ──────────────────────────────────────────────────────────
export const authAPI = {
  getMe: () => api.get('/auth/me'),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  setRole: (role) => api.put('/auth/role', { role }),
  googleLoginUrl: `${API_BASE}/auth/google`,
};

// ── USERS ─────────────────────────────────────────────────────────
export const usersAPI = {
  getFreelancers: (params) => api.get('/users', { params }),
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  connect: (id) => api.post(`/users/${id}/connect`),
  respondConnection: (requestId, action) =>
    api.post(`/users/connect/${requestId}/respond`, { action }),
  disconnect: (id) => api.delete(`/users/connect/${id}`),
  blockUser: (id) => api.post(`/users/${id}/block`),
  unblockUser: (id) => api.delete(`/users/${id}/block`),
  getBlockedUsers: () => api.get('/users/me/blocked'),
};

// ── JOBS ──────────────────────────────────────────────────────────
export const jobsAPI = {
  getJobs: (params) => api.get('/jobs', { params }),
  getMyJobs: () => api.get('/jobs/my-jobs'),
  getRecommended: () => api.get('/jobs/recommended'),
  getJob: (id) => api.get(`/jobs/${id}`),
  createJob: (data) => api.post('/jobs', data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  applyToJob: (id, data) => api.post(`/jobs/${id}/apply`, data),
  getApplications: (jobId) => api.get(`/jobs/${jobId}/applications`),
  acceptApplication: (jobId, appId) => api.put(`/jobs/${jobId}/applications/${appId}/accept`),
  rejectApplication: (jobId, appId) => api.put(`/jobs/${jobId}/applications/${appId}/reject`),
  reactJob: (id, type) => api.post(`/jobs/${id}/react`, { type }),
  commentJob: (id, text, image, mentionUserId, mentionUserName) =>
    api.post(`/jobs/${id}/comment`, { text, image, mentionUserId, mentionUserName }),
  updateComment: (jobId, commentId, data) => api.put(`/jobs/${jobId}/comment/${commentId}`, data),
  deleteComment: (jobId, commentId) => api.delete(`/jobs/${jobId}/comment/${commentId}`),
  reactComment: (jobId, commentId, type) => api.post(`/jobs/${jobId}/comment/${commentId}/react`, { type }),
  replyComment: (jobId, commentId, text, image, mentionUserId, mentionUserName) =>
    api.post(`/jobs/${jobId}/comment/${commentId}/reply`, { text, image, mentionUserId, mentionUserName }),
  updateReply: (jobId, commentId, replyId, data) => api.put(`/jobs/${jobId}/comment/${commentId}/reply/${replyId}`, data),
  deleteReply: (jobId, commentId, replyId) => api.delete(`/jobs/${jobId}/comment/${commentId}/reply/${replyId}`),
  reactReply: (jobId, commentId, replyId, type) => api.post(`/jobs/${jobId}/comment/${commentId}/reply/${replyId}/react`, { type }),
  reportSocial: (data) => api.post('/jobs/report', data),
  shareJob: (id) => api.post(`/jobs/${id}/share`),
  sendJob: (id) => api.post(`/jobs/${id}/send`),
  toggleSavedJob: (id) => api.post(`/users/saved-jobs/${id}`),
  getHistory: () => api.get('/users/me/history'),
  getMarketInsights: () => api.get('/jobs/insights/market'),
};

// ── MESSAGES & NOTIFICATIONS ──────────────────────────────────────
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId, params) => api.get(`/messages/${userId}`, { params }),
  sendMessage: (data) => api.post('/messages', data),
  getNotifications: () => api.get('/messages/notifications/all'),
  markAllRead: () => api.patch('/messages/notifications/read-all'),
};

// ── PORTFOLIO ─────────────────────────────────────────────────────
export const portfolioAPI = {
  getPortfolio: (userId) => api.get(`/portfolio/${userId}`),
  getMyPortfolio: () => api.get('/portfolio/me'),
  createItem: (data) => api.post('/portfolio', data),
  updateItem: (id, data) => api.put(`/portfolio/${id}`, data),
  deleteItem: (id) => api.delete(`/portfolio/${id}`),
  getItem: (id) => api.get(`/portfolio/item/${id}`),
};

// ── REVIEWS ───────────────────────────────────────────────────────
export const reviewsAPI = {
  getReviews: (userId) => api.get(`/reviews/${userId}`),
  createReview: (data) => api.post('/reviews', data),
  respondReview: (id, data) => api.patch(`/reviews/${id}/respond`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};

// ── MEETINGS ──────────────────────────────────────────────────────
export const meetingsAPI = {
  getMeetings: () => api.get('/meetings'),
  getMeeting: (id) => api.get(`/meetings/${id}`),
  createMeeting: (data) => api.post('/meetings', data),
  updateStatus: (id, data) => api.patch(`/meetings/${id}/status`, data),
  cancelMeeting: (id) => api.delete(`/meetings/${id}`),
};

// ── ADMIN ─────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  exportUsers: () => api.get('/admin/users/export', { responseType: 'blob' }),
  banUser: (id, data) => api.post(`/admin/users/${id}/ban`, data),
  verifyUser: (id, data) => api.patch(`/admin/users/${id}/verify`, data),
  setUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  getPendingJobs: () => api.get('/admin/jobs/pending'),
  approveJob: (id, data) => api.patch(`/admin/jobs/${id}/approve`, data),
  getPendingPortfolios: () => api.get('/admin/portfolios/pending'),
  approvePortfolio: (id, data) => api.patch(`/admin/portfolios/${id}/approve`, data),
  getFlaggedReviews: () => api.get('/admin/reviews/flagged'),
  hideReview: (id) => api.patch(`/admin/reviews/${id}/hide`),
  getSecurityLogs: (params) => api.get('/admin/security/logs', { params }),
  getTraffic: () => api.get('/admin/security/traffic'),
  getSkillsAnalytics: () => api.get('/admin/analytics/skills'),
  getGrowthAnalytics: () => api.get('/admin/analytics/growth'),
  getMatches: (jobId) => api.get(`/admin/matching/${jobId}`),
  getReports: () => api.get('/admin/reports'),
  updateReport: (id, data) => api.patch(`/admin/reports/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getHealth: () => api.get('/health'),
};

export default api;
