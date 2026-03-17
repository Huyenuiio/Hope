import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ===== DATA =====
const stats = [
  { icon: 'person_add', labelKey: 'admin.stats.newUsers', value: '1,284', trend: '+14%', trendUp: true, noteKey: 'admin.stats.vsLast30', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  { icon: 'handshake', labelKey: 'admin.stats.successfulMatches', value: '412', trend: '+8%', trendUp: true, noteKey: 'admin.stats.vsLast30', iconBg: 'bg-green-500/10', iconColor: 'text-green-600' },
  { icon: 'payments', labelKey: 'admin.stats.monthlyRevenue', value: '$52,490', trend: '-2.4%', trendUp: false, noteKey: 'admin.stats.vsLastMonth', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600' },
  { icon: 'gpp_maybe', labelKey: 'admin.stats.securityAlerts', value: '12', badge: '4', badgeKey: 'admin.stats.highRisk', noteKey: 'admin.stats.last24h', iconBg: 'bg-red-500/10', iconColor: 'text-red-500' },
];

const users = [
  { name: 'Sarah Jenkins', email: 'sarah.j@design.co', type: 'Freelancer', status: 'verified', portfolioItems: 12, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANkSXmkeF-_Pkrg-c1bC79eT1gF4RvVsr2F_YYQBf3EpBeBopydfZw7yifoCTjJBXGkKYJYhwiMRxNpX-d1FYYXRpGwyVFkh212t2m19cePsLeA-Hm4shV6Q2DX8ie2rXRlGCJh7XDijukzEMwCh10PN9DvMPe_7h1yLZQV7s1hoYzyQk0NgO3oKOzomDH1G7wL02oKS-NzwlgO7gHyhPivFsmtVEI9lLaPONLuA5OMTz9Dmc7HyoXhJJ691ulBVExM0Z88z8ehc4' },
  { name: 'Mark Rossi', email: 'm.rossi@tech.it', type: 'Freelancer', status: 'pending', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBin6lWFZuZ7v8f_YUPL5PJKJPoeVYvPc9Nv8-lKFY4ST2r64IqOW-gzh9w028QqPYdQ7LLtcRBEyBl4SpuQPOGg11QnEtqFUhxnBAUC2aXGynCUxac-UdgFGF-ePAE8NAEvnQ5kOtwOVfPYee2BfascCodtg1gbK1nz1Q7mpN40JJfLIvFfB7seEzKRRVyOSKeD3tnvL7Ha4iJVQkMgMarGO97O2N7T1UpA57hOL4SrcJN91tkcN652DWevCbON5Q2kQUih8l0_M' },
  { name: 'David Kim', email: 'dk@startup.io', type: 'Client', status: 'verified', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAe3FroO_-MneN3CetjqOxx7LeYYFG4NAz1sEuaVlsFN2B45mc5EUJFfLXblD6eBJ07mcM_zHWUhLnQVM9QMcuvjF8tZ_2vn9ATaLzKWnDOUJdsQe6talk2luYIwKFB-b_aK1ukvI4k47oiuIqrdD1ynANs46fy8s4lenyw7G48PZA9M0Gk7n-pLYfqUHcZt3_DEdQp1ccAzp68Sq8-y8V7lcCMLjPuiOBILuv4hgviQ47y1BazNVDXBECHeVGfhNM_3zAg4sWh6W8' },
];

const skills = [
  { name: 'React Native', pct: 85 },
  { name: 'Python / AI', pct: 72 },
  { name: 'UX Research', pct: 64 },
  { name: 'Cloud Architecture', pct: 58 },
  { name: 'Data Analysis', pct: 45 },
];

const accessLogs = [
  { icon: 'login', name: 'Admin Alex R.', desc: 'Logged in from SF, USA', time: '09:12 AM' },
  { icon: 'edit', name: 'Content Mod Julia', desc: 'Approved 5 portfolios', time: '08:45 AM' },
  { icon: 'settings', name: 'System Root', desc: 'API config updated', time: 'Yesterday' },
];

const getSidebarSections = (role) => {
  const sections = [
    {
      titleKey: null,
      items: [{ id: 'dashboard', icon: 'dashboard', labelKey: 'admin.sidebar.dashboard', active: true, roles: ['superadmin', 'moderator', 'support'] }],
      roles: ['superadmin', 'moderator', 'support']
    },
    {
      titleKey: 'admin.sidebar.management',
      items: [
        { id: 'users', icon: 'group', labelKey: 'admin.sidebar.userManagement', roles: ['superadmin'] },
        { id: 'moderation', icon: 'verified_user', labelKey: 'admin.sidebar.contentModeration', roles: ['superadmin', 'moderator'] },
      ],
      roles: ['superadmin', 'moderator']
    },
    {
      titleKey: 'admin.sidebar.operations',
      items: [
        { id: 'matching', icon: 'handshake', labelKey: 'admin.sidebar.matching', roles: ['superadmin', 'moderator'] },
        { id: 'analytics', icon: 'analytics', labelKey: 'admin.sidebar.analytics', roles: ['superadmin'] },
      ],
      roles: ['superadmin', 'moderator']
    },
    {
      titleKey: 'Hỗ trợ & Tranh chấp',
      items: [
        { id: 'reports', icon: 'report_problem', labelKey: 'Báo cáo vi phạm', roles: ['superadmin', 'support'] },
      ],
      roles: ['superadmin', 'support']
    },
    {
      titleKey: 'admin.sidebar.system',
      items: [{ id: 'security', icon: 'shield_with_heart', labelKey: 'admin.sidebar.securityMonitor', danger: true, roles: ['superadmin'] }],
      roles: ['superadmin']
    },
  ];

  // Lọc theo role hiện tại
  return sections
    .filter(s => s.roles.includes(role))
    .map(s => ({
      ...s,
      items: s.items.filter(item => item.roles.includes(role))
    }));
};

const THREAT_ICON_MAP = {
  'sqli-attempt': { icon: 'report', color: 'border-red-500 bg-red-500/5', iconColor: 'text-red-500' },
  'xss-attempt': { icon: 'code_off', color: 'border-orange-500 bg-orange-500/5', iconColor: 'text-orange-500' },
  'scan': { icon: 'radar', color: 'border-amber-500 bg-amber-500/5', iconColor: 'text-amber-500' },
  'brute-force': { icon: 'warning', color: 'border-amber-500 bg-amber-500/5', iconColor: 'text-amber-500' },
  'suspicious': { icon: 'visibility', color: 'border-yellow-500 bg-yellow-500/5', iconColor: 'text-yellow-500' },
  'blocked': { icon: 'block', color: 'border-red-700 bg-red-700/5', iconColor: 'text-red-700' },
};

// ===== COMPONENTS =====
function StatCard({ icon, labelKey, value, trend, trendUp, noteKey, badge, badgeKey, iconBg, iconColor }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-start mb-4">
        <span className={`p-2 ${iconBg} ${iconColor} rounded-lg material-icons`}>{icon}</span>
        {trend && (
          <span className={`text-xs font-bold flex items-center gap-0.5 ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
            <span className="material-icons text-sm">{trendUp ? 'trending_up' : 'trending_down'}</span>
            {trend}
          </span>
        )}
        {badge && (
          <span className="text-amber-600 text-xs font-bold flex items-center gap-1">
            {badge} {t(badgeKey)}
          </span>
        )}
      </div>
      <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{t(labelKey)}</p>
      <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{value}</h3>
      <p className="text-[10px] text-slate-400 mt-2">{t(noteKey)}</p>
    </div>
  );
}

// ===== MAIN DASHBOARD =====
export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // API state
  const [apiStats, setApiStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [pendingJobs, setPendingJobs] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [skillsData, setSkillsData] = useState([]);
  const [trafficData, setTrafficData] = useState([60, 80, 40, 90, 100, 65, 50, 75]);
  const [loadingData, setLoadingData] = useState(true);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [banModal, setBanModal] = useState(null); // { userId, name }
  const [banDuration, setBanDuration] = useState('7d');
  const [banReason, setBanReason] = useState('');
  const [deleteWarning, setDeleteWarning] = useState(null); // { userId, name }
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [expandedReport, setExpandedReport] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const res = await adminAPI.getReports();
      setReports(res.data.reports || []);
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'reports') fetchReports();
  }, [activeSection, fetchReports]);

  const handleDismissReport = async (reportId) => {
    try {
      await adminAPI.updateReport(reportId, { status: 'dismissed', resolution: 'Không vi phạm' });
      setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: 'dismissed' } : r));
    } catch (err) { console.error(err); }
  };

  const handleResolveReport = async (reportId) => {
    try {
      await adminAPI.updateReport(reportId, { status: 'resolved', resolution: 'Đã xử lý' });
      setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: 'resolved' } : r));
    } catch (err) { console.error(err); }
  };

  const handleBanSubmit = async () => {
    if (!banModal) return;
    try {
      let banData;
      if (banDuration === 'permanent') {
        banData = { isPermanentlyBanned: true, reason: banReason || 'Vi phạm nội quy' };
      } else {
        const days = { '1d': 1, '7d': 7, '30d': 30 }[banDuration] || 7;
        const banUntil = new Date(Date.now() + days * 86400000).toISOString();
        banData = { banUntil, isPermanentlyBanned: false, reason: banReason || 'Vi phạm nội quy' };
      }
      await adminAPI.banUser(banModal.userId, banData);
      setBanModal(null);
      setBanReason('');
    } catch (err) { console.error(err); }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await adminAPI.banUser(userId, { isBanned: false, isPermanentlyBanned: false, banUntil: null, reason: '' });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: false } : u));
    } catch (err) { console.error(err); }
  };


  const fetchDashboardData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [statsRes, usersRes, logsRes, skillsRes, trafficRes, pendingJobsRes] = await Promise.allSettled([
        adminAPI.getStats(),
        adminAPI.getUsers({ limit: 5 }),
        adminAPI.getSecurityLogs({ limit: 5 }),
        adminAPI.getSkillsAnalytics(),
        adminAPI.getTraffic(),
        adminAPI.getPendingJobs(),
      ]);
      if (statsRes.status === 'fulfilled') setApiStats(statsRes.value.data.stats);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.users || []);
      if (logsRes.status === 'fulfilled') setSecurityLogs(logsRes.value.data.logs || []);
      if (skillsRes.status === 'fulfilled') {
        const skills = skillsRes.value.data.skills || [];
        const maxCount = Math.max(...skills.map(s => s.count), 1);
        setSkillsData(skills.slice(0, 5).map(s => ({ name: s._id, pct: Math.round((s.count / maxCount) * 100) })));
      }
      if (trafficRes.status === 'fulfilled') {
        const traffic = trafficRes.value.data.traffic || [];
        if (traffic.length > 0) {
          const maxCount = Math.max(...traffic.map(t => t.count), 1);
          setTrafficData(traffic.map(t => Math.round((t.count / maxCount) * 100)));
        }
      }
      if (pendingJobsRes.status === 'fulfilled') {
        setPendingJobs(pendingJobsRes.value.data.jobs || []);
      }
    } catch (err) {
      console.error('Admin dashboard fetch error:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const handleApprovePortfolio = async (portfolioId) => {
    try {
      await adminAPI.approvePortfolio(portfolioId, { approved: true });
      fetchDashboardData();
    } catch (err) { console.error(err); }
  };

  const handleBanUser = async (userId, isBanned) => {
    try {
      await adminAPI.banUser(userId, { isBanned, banReason: 'Admin action' });
      fetchDashboardData();
    } catch (err) { console.error(err); }
  };

  const handleApproveJob = async (jobId, approved) => {
    try {
      await adminAPI.approveJob(jobId, { approved, reason: approved ? '' : 'Không phù hợp với tiêu chuẩn.' });
      fetchDashboardData();
    } catch (err) { console.error('Error approving job:', err); }
  };

  const handleDeleteUser = async () => {
    if (!deleteWarning || deleteConfirmText !== 'XOA VINH VIEN') return;
    try {
      await adminAPI.deleteUser(deleteWarning.userId);
      setDeleteWarning(null);
      setDeleteConfirmText('');
      fetchDashboardData();
    } catch (err) { console.error(err); }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  // Build stats cards from real data
  const statsCards = [
    { icon: 'person_add', labelKey: 'admin.stats.newUsers', value: apiStats?.newUsers?.toLocaleString() ?? '—', trend: apiStats?.newUsersLast30 ? `+${apiStats.newUsersLast30}` : null, trendUp: true, noteKey: 'admin.stats.vsLast30', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { icon: 'handshake', labelKey: 'admin.stats.successfulMatches', value: apiStats?.successfulMatches?.toLocaleString() ?? '—', trend: null, trendUp: true, noteKey: 'admin.stats.vsLast30', iconBg: 'bg-green-500/10', iconColor: 'text-green-600' },
    { icon: 'work', labelKey: 'admin.stats.monthlyRevenue', value: apiStats?.openJobs?.toLocaleString() ?? '—', trend: null, trendUp: false, noteKey: 'admin.stats.vsLastMonth', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600' },
    { icon: 'gpp_maybe', labelKey: 'admin.stats.securityAlerts', value: apiStats?.threatsToday?.toLocaleString() ?? '—', badge: null, badgeKey: 'admin.stats.highRisk', noteKey: 'admin.stats.last24h', iconBg: 'bg-red-500/10', iconColor: 'text-red-500' },
  ];

  const displaySkills = skillsData.length > 0 ? skillsData : [
    { name: 'React / Next.js', pct: 85 }, { name: 'Python / AI', pct: 72 },
    { name: 'UX Research', pct: 64 }, { name: 'Cloud Architecture', pct: 58 }, { name: 'Data Analysis', pct: 45 },
  ];

  return (
    <div className={`${darkMode ? 'dark' : ''} font-sans`}>
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">

        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-6 py-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile sidebar toggle */}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
              <span className="material-icons">menu</span>
            </button>
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-center">
                <span className="material-icons text-primary text-xl">admin_panel_settings</span>
              </div>
              <span className="text-slate-900 dark:text-white text-lg font-bold hidden sm:block">
                Ho<span className="bg-primary text-white rounded px-1 text-base">pe</span>
                {' '}<span className="text-slate-400 font-normal text-sm">Admin</span>
              </span>
            </div>
            {/* Search */}
            <div className="relative hidden md:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <span className="material-icons text-lg">search</span>
              </span>
              <input
                className="block w-72 p-2 pl-10 text-sm border-none bg-slate-100 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary placeholder-slate-500 text-slate-900 dark:text-white"
                placeholder={t('admin.nav.searchPlaceholder')}
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <span className="material-icons text-lg">{darkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
            {/* Notifications */}
            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative">
              <span className="material-icons">notifications</span>
              <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            {/* Language */}
            <LanguageSwitcher variant="compact" />
            {/* Divider */}
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            {/* User */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name || t('admin.nav.adminName')}</p>
                <p className="text-[10px] text-slate-500 capitalize">{user?.role || 'Admin'}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/20 overflow-hidden border border-primary/30">
                {user?.avatar ? (
                  <img alt="Admin Profile" className="h-full w-full object-cover" src={user.avatar} />
                ) : (
                  <span className="material-icons text-primary flex items-center justify-center h-full text-xl">person</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'flex' : 'hidden'} lg:flex fixed lg:static inset-0 z-40 lg:z-auto w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col`}>
            {/* Mobile close */}
            <div className="lg:hidden flex justify-end p-3 border-b border-slate-200 dark:border-slate-800">
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded text-slate-500 hover:bg-slate-100">
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="flex flex-col py-4 gap-0.5 flex-1 overflow-y-auto">
              {getSidebarSections(user?.role).map(({ titleKey, items }) => (
                <div key={titleKey || 'main'}>
                  {titleKey && (
                    <div className="px-6 pt-4 pb-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(titleKey)}</p>
                    </div>
                  )}
                  {items.map(({ id, icon, labelKey, active, danger }) => (
                    <a
                      key={id}
                      href="#"
                      onClick={(e) => { e.preventDefault(); setActiveSection(id); setSidebarOpen(false); }}
                      className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${activeSection === id
                        ? 'border-l-4 border-primary bg-primary/10 text-primary'
                        : danger
                          ? 'text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                      <span className="material-icons text-[20px]">{icon}</span>
                      <span>{t(labelKey)}</span>
                    </a>
                  ))}
                </div>
              ))}
            </div>

            {/* System Status + Logout */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/20">
                <p className="text-xs font-bold text-primary mb-1">{t('admin.sidebar.systemStatus')}</p>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">{t('admin.sidebar.allOperational')}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <span className="material-icons text-lg">logout</span>
                {t('admin.sidebar.logout')}
              </button>
            </div>
          </aside>
          {/* Sidebar overlay for mobile */}
          {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-100 dark:bg-slate-900">
            {activeSection === 'dashboard' && (
              <>
                {/* Stats Grid */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statsCards.map((stat) => <StatCard key={stat.labelKey} {...stat} />)}
                </section>

                {/* Main Grid */}
                <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Left 2/3 */}
                  <div className="xl:col-span-2 space-y-8">
                    {/* User Management Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
                        <h3 className="font-bold text-slate-900 dark:text-white">{t('admin.users.title')}</h3>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors">
                            {t('admin.users.filter')}
                          </button>
                          <button className="px-3 py-1 text-xs font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors">
                            {t('admin.users.exportCsv')}
                          </button>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                            <tr>
                              <th className="px-6 py-3">{t('admin.users.colUser')}</th>
                              <th className="px-6 py-3">{t('admin.users.colType')}</th>
                              <th className="px-6 py-3">{t('admin.users.colStatus')}</th>
                              <th className="px-6 py-3">{t('admin.users.colPortfolio')}</th>
                              <th className="px-6 py-3 text-right">{t('admin.users.colActions')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {users.length === 0 && !loadingData && (
                              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">{loadingData ? 'Đang tải...' : 'Chưa có dữ liệu người dùng'}</td></tr>
                            )}
                            {users.map((u) => (
                              <tr key={u._id || u.email} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                      {u.avatar ? <img alt={u.name} className="h-full w-full object-cover" src={u.avatar} /> : <span className="material-icons text-slate-400 text-lg flex items-center justify-center h-full">person</span>}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-900 dark:text-white">{u.name}</p>
                                      <p className="text-[10px] text-slate-500">{u.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 capitalize">{u.role}</td>
                                <td className="px-6 py-4">
                                  {u.isVerified ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full"><span className="material-icons text-xs">verified</span>{t('admin.users.verified')}</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full"><span className="material-icons text-xs">pending</span>{t('admin.users.pending')}</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-[10px] text-slate-500">{u.rating ? `⭐ ${u.rating.toFixed(1)}` : t('admin.users.na')}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => handleBanUser(u._id, !u.isBanned)}
                                    className={`text-[10px] font-bold px-2 py-1 rounded ${u.isBanned ? 'text-green-600 bg-green-500/10 hover:bg-green-500/20' : 'text-red-500 bg-red-500/10 hover:bg-red-500/20'} transition-colors`}
                                  >
                                    {u.isBanned ? 'Mở khóa' : 'Khóa'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-center">
                        <button className="text-xs font-bold text-primary hover:underline">{t('admin.users.viewAll')}</button>
                      </div>
                    </div>

                    {/* Security Monitor (SuperAdmin Only) */}
                    {user?.role === 'superadmin' && (
                      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-900 text-white flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="material-icons text-red-400">security</span>
                            <h3 className="font-bold">{t('admin.security.title')}</h3>
                          </div>
                          <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                            {t('admin.security.liveTracking')}
                          </span>
                        </div>
                        <div className="p-6 space-y-6">
                          {/* Threat Log */}
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">{t('admin.security.threatLog')}</h4>
                            <div className="space-y-3">
                              {securityLogs.filter(l => l.threat !== 'none').slice(0, 3).map((log, i) => {
                                const meta = THREAT_ICON_MAP[log.threat] || { icon: 'warning', color: 'border-slate-400 bg-slate-50', iconColor: 'text-slate-500' };
                                return (
                                  <div key={log._id || i} className={`flex items-start gap-4 p-3 ${meta.color} rounded-lg border-l-4`}>
                                    <span className={`material-icons ${meta.iconColor} flex-shrink-0`}>{meta.icon}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-slate-900 dark:text-white capitalize">{log.threat.replace('-', ' ')} detected</p>
                                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">IP: {log.ip} • {log.method} {log.path}</p>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400 flex-shrink-0">
                                      {new Date(log.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                );
                              })}
                              {securityLogs.filter(l => l.threat !== 'none').length === 0 && (
                                <div className="flex items-center gap-3 p-3 border-l-4 border-green-500 bg-green-500/5 rounded-lg">
                                  <span className="material-icons text-green-500">check_circle</span>
                                  <p className="text-xs text-slate-700 dark:text-slate-300">Không phát hiện mối đe dọa gần đây</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Traffic + Nmap */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                            {/* Traffic Chart */}
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">{t('admin.security.systemTraffic')}</h4>
                              <div className="h-32 w-full bg-slate-900 rounded-lg relative overflow-hidden flex items-end px-2 gap-1 pb-2">
                                {trafficData.map((h, i) => (
                                  <div
                                    key={i}
                                    className={`w-full rounded-t-sm ${h >= 95 ? 'bg-red-500/60 animate-pulse' : 'bg-primary/50'}`}
                                    style={{ height: `${Math.max(h, 5)}%` }}
                                  ></div>
                                ))}
                                <div className="absolute top-2 right-2 text-[8px] text-slate-400 uppercase">{t('admin.security.load')}: {trafficData.length > 0 ? Math.max(...trafficData) : 0}%</div>
                              </div>
                            </div>
                            {/* Nmap */}
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">{t('admin.security.nmapScans')}</h4>
                              <div className="space-y-2">
                                <div className="text-[10px] font-mono bg-slate-100 dark:bg-slate-900 p-2 rounded">
                                  <span className="text-primary">$ nmap -sV -T4 internal-net</span><br />
                                  <span className="text-green-600">Scan complete: 0 vulnerabilities found.</span>
                                </div>
                                <div className="text-[10px] font-mono bg-slate-100 dark:bg-slate-900 p-2 rounded">
                                  <span className="text-primary">$ nmap --script vuln edge-server-01</span><br />
                                  <span className="text-red-500">Warning: CVE-2023-XXXX detected. Patch required.</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right 1/3 */}
                  <div className="space-y-8">
                    {/* Top Skills */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-6">{t('admin.skills.title')}</h3>
                      <div className="space-y-4">
                        {displaySkills.map(({ name, pct }) => (
                          <div key={name}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{name}</span>
                              <span className="text-slate-500">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                              <div className="bg-primary h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className="w-full mt-6 py-2 text-xs font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors">
                        {t('admin.skills.viewFullMap')}
                      </button>
                    </div>

                    {/* Matching Efficiency */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-6">{t('admin.matching.title')}</h3>
                      <div className="flex flex-col items-center">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
                            <circle className="text-slate-100 dark:text-slate-700" cx="65" cy="65" fill="transparent" r="58" stroke="currentColor" strokeWidth="10" />
                            <circle className="text-green-500" cx="65" cy="65" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364.4" strokeDashoffset="91.1" strokeWidth="10" strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">75%</span>
                            <span className="text-[10px] text-slate-500">{t('admin.matching.matchRate')}</span>
                          </div>
                        </div>
                        <div className="mt-6 w-full space-y-3">
                          {[
                            { color: 'bg-green-500', label: t('admin.matching.organic'), value: '284' },
                            { color: 'bg-primary', label: t('admin.matching.aiSuggested'), value: '128' },
                          ].map(({ color, label, value }) => (
                            <div key={label} className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${color}`}></span>
                                <span className="text-slate-700 dark:text-slate-300">{label}</span>
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Access Logs (SuperAdmin Only) */}
                    {user?.role === 'superadmin' && (
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">{t('admin.logs.title')}</h3>
                        <div className="space-y-4">
                          {accessLogs.map(({ icon, name, desc, time }) => (
                            <div key={name} className="flex gap-3">
                              <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <span className="material-icons text-slate-500 text-sm">{icon}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">{name}</p>
                                <p className="text-[10px] text-slate-500 truncate">{desc}</p>
                              </div>
                              <span className="text-[8px] text-slate-400 flex-shrink-0 self-start pt-0.5">{time}</span>
                            </div>
                          ))}
                        </div>
                        <button className="w-full mt-6 py-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors">
                          {t('admin.logs.viewFull')}
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            {activeSection === 'moderation' && (
              <div className="space-y-8">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white">Kiểm duyệt tin tuyển dụng</h3>
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">{pendingJobs.length} tin chờ duyệt</span>
                  </div>
                  <div className="p-6">
                    {pendingJobs.length === 0 ? (
                      <div className="text-center py-12">
                        <span className="material-icons text-4xl text-slate-300 dark:text-slate-600 mb-3">check_circle_outline</span>
                        <p className="text-sm text-slate-500 font-medium">Tuyệt vời! Không có tin tuyển dụng nào đang chờ duyệt.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {pendingJobs.map(job => (
                          <div key={job._id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col sm:flex-row justify-between gap-6 hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-slate-900 dark:text-white text-lg">{job.title}</h4>
                                {job.isFlagged && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><span className="material-icons text-[10px]">flag</span>Bị cắm cờ</span>}
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{job.description}</p>

                              <div className="flex gap-4 mt-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg flex-wrap">
                                <div className="text-[11px]">
                                  <span className="text-slate-400 block mb-0.5">Ngân sách</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300">${job.budget?.min} - ${job.budget?.max}</span>
                                </div>
                                <div className="text-[11px]">
                                  <span className="text-slate-400 block mb-0.5">Khách hàng</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{job.client?.name || 'Ẩn danh'}</span>
                                </div>
                                <div className="text-[11px]">
                                  <span className="text-slate-400 block mb-0.5">Hình thức</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">{job.workType}</span>
                                </div>
                              </div>

                              <div className="flex gap-2 mt-4 flex-wrap">
                                {job.requiredSkills?.map(skill => (
                                  <span key={skill} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] rounded-md font-medium">{skill}</span>
                                ))}
                              </div>
                            </div>

                            <div className="flex sm:flex-col gap-3 shrink-0 sm:w-32">
                              <button onClick={() => handleApproveJob(job._id, true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm shadow-green-500/20">
                                <span className="material-icons text-sm">check</span> Duyệt
                              </button>
                              <button onClick={() => handleApproveJob(job._id, false)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 text-sm font-bold rounded-lg transition-colors">
                                <span className="material-icons text-sm">close</span> Từ chối
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'reports' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quản lý báo cáo nội dung</h2>
                    <p className="text-sm text-slate-500 mt-1">Xem xét các báo cáo từ người dùng và đưa ra quyết định xử lý</p>
                  </div>
                  <button onClick={fetchReports} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
                    <span className="material-icons text-sm">refresh</span> Tải lại
                  </button>
                </div>

                {loadingReports ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-xl animate-pulse border border-slate-200" />)}
                  </div>
                ) : reports.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
                    <span className="material-icons text-5xl text-slate-300 mb-3">inbox</span>
                    <p className="font-bold text-slate-600">Không có báo cáo nào</p>
                    <p className="text-sm text-slate-400 mt-1">Chưa có báo cáo vi phạm từ người dùng</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map(report => (
                      <div key={report._id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                        report.status === 'pending' ? 'border-amber-200' :
                        report.status === 'resolved' ? 'border-green-200' : 'border-slate-200'
                      }`}>
                        <div className="p-5">
                          <div className="flex flex-wrap gap-3 items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {report.reporter?.avatar ? (
                                <img src={report.reporter.avatar} alt={report.reporter.name} className="w-9 h-9 rounded-full object-cover" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
                                  <span className="material-icons text-slate-400 text-base">person</span>
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900 text-sm">Báo cáo từ: {report.reporter?.name || 'Ẩn danh'}</p>
                                <p className="text-[11px] text-slate-500">Đối tượng: <span className="font-semibold text-red-600">{report.accusedUser?.name || '—'}</span> · {new Date(report.createdAt).toLocaleDateString('vi-VN')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                report.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {report.status === 'pending' ? '⏳ Chờ xem xét' : report.status === 'resolved' ? '✅ Đã xử lý' : '🚫 Đã đóng'}
                              </span>
                              <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-1 rounded-full capitalize">{report.type}</span>
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-lg p-3 mb-4">
                            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Lý do báo cáo</p>
                            <p className="text-sm text-slate-700">{report.reason}</p>
                          </div>

                          {report.contentPreview && (
                            <div>
                              <button
                                onClick={() => setExpandedReport(expandedReport === report._id ? null : report._id)}
                                className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline mb-2"
                              >
                                <span className="material-icons text-sm">{expandedReport === report._id ? 'expand_less' : 'expand_more'}</span>
                                {expandedReport === report._id ? 'Ẩn nội dung' : 'Xem nội dung vi phạm'}
                              </button>
                              {expandedReport === report._id && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-slate-700 italic border-l-4 border-l-red-400">
                                  "{report.contentPreview}"
                                </div>
                              )}
                            </div>
                          )}

                          {report.status === 'pending' && (
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                              <button
                                onClick={() => handleDismissReport(report._id)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                              >
                                <span className="material-icons text-sm">do_not_disturb</span>Đóng báo cáo
                              </button>
                              <button
                                onClick={() => handleResolveReport(report._id)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
                              >
                                <span className="material-icons text-sm">check_circle</span>Đánh dấu đã xử lý
                              </button>
                              {report.accusedUser && (
                                <>
                                  <button
                                    onClick={() => setBanModal({ userId: report.accusedUser._id, name: report.accusedUser.name })}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors"
                                  >
                                    <span className="material-icons text-sm">lock</span>Khóa tài khoản
                                  </button>
                                  <button
                                    onClick={() => setDeleteWarning({ userId: report.accusedUser._id, name: report.accusedUser.name })}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                                  >
                                    <span className="material-icons text-sm">delete_forever</span>Xóa tài khoản
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ban Modal */}
                {banModal && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setBanModal(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="material-icons text-orange-500">lock</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">Khóa tài khoản</h3>
                          <p className="text-xs text-slate-500">{banModal.name}</p>
                        </div>
                      </div>
                      <div className="p-5 space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Thời hạn khóa</label>
                          <div className="grid grid-cols-2 gap-2">
                            {[{v:'1d',l:'1 ngày'},{v:'7d',l:'7 ngày'},{v:'30d',l:'30 ngày'},{v:'permanent',l:'Vĩnh viễn'}].map(opt => (
                              <button
                                key={opt.v}
                                onClick={() => setBanDuration(opt.v)}
                                className={`p-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                                  banDuration === opt.v
                                    ? opt.v === 'permanent' ? 'border-red-500 bg-red-50 text-red-700' : 'border-primary bg-primary/5 text-primary'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                              >{opt.l}</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Lý do (tuỳ chọn)</label>
                          <input
                            type="text"
                            value={banReason}
                            onChange={e => setBanReason(e.target.value)}
                            placeholder="Nhập lý do khóa tài khoản..."
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                        {banDuration === 'permanent' && (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
                            <span className="material-icons text-red-500 text-base mt-0.5">warning</span>
                            <p className="text-xs text-red-700 font-medium">Tài khoản sẽ bị khóa vĩnh viễn. Người dùng không thể đăng nhập cho đến khi admin mở khóa thủ công.</p>
                          </div>
                        )}
                        <div className="flex gap-3 pt-2">
                          <button onClick={() => setBanModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">Hủy</button>
                          <button onClick={handleBanSubmit} className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${
                            banDuration === 'permanent' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'
                          }`}>Xác nhận khóa</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete User Warning Modal */}
                {deleteWarning && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setDeleteWarning(null); setDeleteConfirmText(''); }}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                      <div className="bg-red-600 p-5 text-white flex items-center gap-3 rounded-t-2xl">
                        <span className="material-icons text-3xl">dangerous</span>
                        <div>
                          <h3 className="font-bold text-lg">⚠️ CẢNH BÁO NGHIÊM TRỌNG</h3>
                          <p className="text-sm text-red-200">Hành động này KHÔNG THỂ hoàn tác</p>
                        </div>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-sm text-red-800 font-semibold mb-2">Bạn sắp xóa vĩnh viễn tài khoản của:</p>
                          <p className="font-bold text-red-900 text-lg">{deleteWarning.name}</p>
                          <ul className="mt-3 space-y-1 text-xs text-red-700">
                            <li>• Toàn bộ dữ liệu, bình luận, hồ sơ sẽ bị xóa</li>
                            <li>• Không thể khôi phục sau khi xóa</li>
                            <li>• Người dùng sẽ mất truy cập vĩnh viễn</li>
                          </ul>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            Gõ <span className="font-mono bg-slate-100 px-1 rounded">XOA VINH VIEN</span> để xác nhận:
                          </label>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={e => setDeleteConfirmText(e.target.value)}
                            placeholder="XOA VINH VIEN"
                            className="w-full px-3 py-2.5 border-2 border-red-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none font-mono"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setDeleteWarning(null); setDeleteConfirmText(''); }}
                            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >Hủy (An toàn)</button>
                          <button
                            onClick={handleDeleteUser}
                            disabled={deleteConfirmText !== 'XOA VINH VIEN'}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >Xóa vĩnh viễn</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeSection !== 'dashboard' && activeSection !== 'moderation' && activeSection !== 'reports' && (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <span className="material-icons text-6xl text-slate-300 dark:text-slate-600 mb-4">construction</span>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Tính năng đang xây dựng</h3>
                <p className="text-sm text-slate-500 mt-2">Phần này ({activeSection}) sẽ sớm được hoàn thiện.</p>
                <button onClick={() => setActiveSection('dashboard')} className="mt-6 px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors">
                  Quay lại Dashboard
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
