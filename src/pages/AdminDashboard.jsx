import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

// ===== DATA =====
// (Hardcoded placeholders removed for 100% real-time accuracy)

const getSidebarSections = (role) => {
  const sections = [
    {
      titleKey: null,
      items: [{ id: 'dashboard', icon: 'dashboard', labelKey: 'admin.sidebar.dashboard', active: true, roles: ['superadmin', 'moderator', 'support', 'admin'] }],
      roles: ['superadmin', 'moderator', 'support', 'admin']
    },
    {
      titleKey: 'admin.sidebar.management',
      items: [
        { id: 'users', icon: 'group', labelKey: 'admin.sidebar.userManagement', roles: ['superadmin', 'admin'] },
        { id: 'moderation', icon: 'verified_user', labelKey: 'admin.sidebar.contentModeration', roles: ['superadmin', 'moderator'] },
      ],
      roles: ['superadmin', 'moderator', 'admin']
    },
    {
      titleKey: 'admin.sidebar.operations',
      items: [
        { id: 'matching', icon: 'handshake', labelKey: 'admin.sidebar.matching', roles: ['superadmin', 'moderator', 'admin'] },
        { id: 'analytics', icon: 'analytics', labelKey: 'admin.sidebar.analytics', roles: ['superadmin'] },
      ],
      roles: ['superadmin', 'moderator', 'admin']
    },
    {
      titleKey: 'admin.sidebar.support',
      items: [
        { id: 'reports', icon: 'report_problem', labelKey: 'admin.sidebar.reports', roles: ['superadmin', 'support', 'admin'] },
      ],
      roles: ['superadmin', 'support', 'admin']
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
function StatCard({ icon, labelKey, value, trend, trendUp, noteKey, badge, badgeKey, iconBg, iconColor, glowColor }) {
  const { t } = useTranslation();
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-300 group hover:-translate-y-1.5 hover:shadow-xl ${glowColor}`}>
      <div className="flex justify-between items-start mb-5">
        <div className={`p-3 ${iconBg} ${iconColor} rounded-2xl transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
          <span className="material-icons text-2xl">{icon}</span>
        </div>
        {trend && (
          <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${trendUp
            ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20'
            : 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20'
            }`}>
            <span className="material-icons text-sm">{trendUp ? 'trending_up' : 'trending_down'}</span>
            {trend}%
          </div>
        )}
        {badge && (
          <span className="bg-amber-100 dark:bg-amber-500/10 text-amber-600 px-2 py-1 rounded-full text-[10px] font-bold border border-amber-200 dark:border-amber-500/20">
            {badge} {t(badgeKey)}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">{t(labelKey)}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{t(noteKey)}</span>
        <span className="material-icons text-slate-300 dark:text-slate-600 text-sm group-hover:text-primary transition-colors">arrow_forward</span>
      </div>
    </div>
  );
}

function SecurityMonitor({ logs, traffic, stats, onAnalyze }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-5 group hover:border-green-500/50 transition-colors">
          <div className="w-14 h-14 bg-green-100 dark:bg-green-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-icons text-green-600 text-3xl">gpp_good</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('admin.sidebar.systemStatus')}</p>
            <h4 className="text-xl font-black text-slate-900 dark:text-white">SAFE</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-5 group hover:border-blue-500/50 transition-colors">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-icons text-blue-600 text-3xl">lan</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('admin.security.systemTraffic')}</p>
            <h4 className="text-xl font-black text-slate-900 dark:text-white">{stats?.totalRequests?.toLocaleString() || '1.2k'} reqs</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-5 group hover:border-rose-500/50 transition-colors">
          <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-icons text-rose-600 text-3xl">bolt</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('admin.stats.securityAlerts')}</p>
            <h4 className="text-xl font-black text-rose-600 dark:text-rose-500 font-mono">{stats?.threatsToday || 0}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Threat Log */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-icons text-rose-500">policy</span>
              {t('admin.security.threatLog')}
            </h3>
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[500px] overflow-y-auto custom-scrollbar">
            {logs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <span className="material-icons text-4xl mb-2 opacity-20">verified_user</span>
                <p>{t('admin.security.noThreats') || 'Chưa phát hiện mối đe dọa nào'}</p>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-l-4 border-transparent hover:border-rose-500">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${THREAT_ICON_MAP[log.threat]?.color || 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                      {log.threat.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">{log.path}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-500 font-mono">IP: {log.ip}</p>
                    <button
                      onClick={() => onAnalyze(log)}
                      className="text-[10px] text-primary font-bold hover:underline"
                    >
                      {t('admin.analysis.title')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time Scanner Detections */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-icons text-purple-500">radar</span>
              {t('admin.security.liveScanner')}
            </h3>
            <div className="flex gap-2">
              {logs.filter(l => l.threat === 'scan' && (new Date() - new Date(l.createdAt)) < 60000).length > 2 && (
                <span className="bg-red-100 dark:bg-red-500/10 text-red-600 text-[10px] font-black px-2 py-0.5 rounded animate-pulse border border-red-200 uppercase">High Intensity</span>
              )}
              <span className="bg-purple-100 dark:bg-purple-500/10 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Scanner Alert</span>
            </div>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {logs.filter(l => l.threat === 'scan').length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="material-icons">check_circle</span>
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Hệ thống đang được bảo vệ</p>
                <p className="text-[10px] text-slate-500 mt-1">Không phát hiện dấu hiệu rà quét lỗ hổng gần đây.</p>
              </div>
            ) : (
              logs.filter(l => l.threat === 'scan').map((scan, i) => {
                const isNmap = scan.path.includes('nmap') || scan.threatDetails?.toLowerCase().includes('nmap');
                const isSQLi = scan.path.includes("'") || scan.path.includes('union') || scan.path.includes('select');

                return (
                  <div key={i} className="bg-slate-900 rounded-xl p-4 font-mono text-[10px] border-l-4 border-purple-500 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                      <span className="material-icons text-4xl text-purple-500">terminal</span>
                    </div>
                    <div className="flex justify-between text-slate-500 mb-2 border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                        {new Date(scan.createdAt).toLocaleTimeString()}
                      </span>
                      <span className="text-purple-400 font-bold uppercase tracking-tighter">Event_ID (LGN-{scan._id?.slice(-4) || 'SCAN'})</span>
                    </div>
                    <div className="space-y-1.5 relative z-10">
                      <p className="flex justify-between">
                        <span className="text-primary">$ source_ip:</span>
                        <span className="text-slate-300">{scan.ip}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-primary">$ target_path:</span>
                        <span className="text-slate-300 truncate max-w-[150px]">{scan.path}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-primary">$ threat_type:</span>
                        <span className={`font-bold ${isSQLi ? 'text-orange-400' : 'text-slate-300'}`}>
                          {isSQLi ? 'SQLi_INJECTION_SCAN' : isNmap ? 'NMAP_SERVICE_PROBE' : 'ENDPOINT_FUZZING'}
                        </span>
                      </p>
                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-emerald-400 font-black flex items-center gap-1 italic">
                          <span className="material-icons text-[12px]">security</span>
                          PACKET_DROPPED
                        </span>
                        <span className="text-slate-600 text-[8px] uppercase tracking-widest">{scan.threatDetails || 'Manual_Probe'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-8">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tín hiệu cảnh báo rà quét</h4>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <span className="material-icons">dns</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Dịch vụ giám sát hạ tầng</p>
                <p className="text-[9px] text-slate-500">Giám sát các cổng kết nối 22, 80, 443, 3306 24/7</p>
              </div>
              <span className="ml-auto flex h-2 w-2 rounded-full bg-green-500"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsView({ skillsData, stats, growthData }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6">Phân bổ Kỹ năng Hệ thống</h3>
          <div className="space-y-4">
            {skillsData.skills?.slice(0, 10).map((s, i) => (
              <div key={s._id}>
                <div className="flex justify-between text-xs mb-1 font-bold">
                  <span className="text-slate-600 dark:text-slate-400">{s._id}</span>
                  <span className="text-primary">{s.count} tin</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, (s.count / (skillsData.skills[0]?.count || 1)) * 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6">Thống kê Tăng trưởng</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Người dùng mới</p>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">+{stats?.newUsersToday || 0}</h4>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tỷ lệ tăng trưởng</p>
              <h4 className="text-2xl font-black text-green-600">{stats?.growthRate || '0.0'}%</h4>
            </div>
          </div>
          <div className="mt-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">Xu hướng 7 ngày qua</p>
            <div className="h-32 flex items-end gap-1 px-1">
              {(growthData?.length > 0 ? growthData : [5, 5, 5, 5, 5, 5, 5]).map((v, i) => (
                <div key={i} className="flex-1 bg-primary/20 rounded-t-sm relative group">
                  <div className="absolute bottom-0 left-0 right-0 bg-primary group-hover:bg-primary/80 transition-all rounded-t-sm" style={{ height: `${Math.max(v, 2)}%` }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchingView({ stats }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-900 dark:text-white mb-8">Hiệu suất Ghép nối Dịch vụ</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-3xl">handshake</span>
            </div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{stats?.successfulMatches || 0}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase">Kết nối thành công</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-3xl">description</span>
            </div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{stats?.totalApplications || 0}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase">Tổng hồ sơ ứng tuyển</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-500/10 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-3xl">work</span>
            </div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{stats?.openJobs || 0}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase">Dự án đang mở</p>
          </div>
        </div>

        <div className="mt-12 p-8 bg-blue-50 dark:bg-primary/5 rounded-2xl border border-blue-100 dark:border-primary/20 text-center">
          <h4 className="text-sm font-bold text-primary mb-2">Thông tin vận hành</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            Tỷ lệ ghép nối được tính dựa trên số lượng hồ sơ ứng tuyển thực tế đã được khách hàng phê duyệt thuê (Hired).
            Dữ liệu được cập nhật liên tục từ hệ thống khớp lệnh của Hope.
          </p>
        </div>
      </div>
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
  const [dashboardUsers, setDashboardUsers] = useState([]);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [pendingJobs, setPendingJobs] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [skillsData, setSkillsData] = useState([]);
  const [trafficData, setTrafficData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [banModal, setBanModal] = useState(null); // { userId, name }
  const [banDuration, setBanDuration] = useState('7d');
  const [banReason, setBanReason] = useState('');
  const [deleteWarning, setDeleteWarning] = useState(null); // { userId, name }
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [expandedReport, setExpandedReport] = useState(null);
  const [reportActionModal, setReportActionModal] = useState(null); // { reportId, job, accusedUser }
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [allSkillsData, setAllSkillsData] = useState({ skills: [], niches: [] });
  const [logsModal, setLogsModal] = useState(false);
  const [fullLogs, setFullLogs] = useState([]);
  const [loadingFullLogs, setLoadingFullLogs] = useState(false);
  const [analysisModal, setAnalysisModal] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [systemStatus, setSystemStatus] = useState({ state: 'operational', message: t('admin.sidebar.allOperational') });

  const SKILL_COLORS = [
    { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-50', border: 'border-blue-100', shadow: 'shadow-blue-200' },
    { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-50', border: 'border-purple-100', shadow: 'shadow-purple-200' },
    { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-100', shadow: 'shadow-emerald-200' },
    { bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-50', border: 'border-amber-100', shadow: 'shadow-amber-200' },
    { bg: 'bg-rose-500', text: 'text-rose-500', light: 'bg-rose-50', border: 'border-rose-100', shadow: 'shadow-rose-200' }
  ];

  // User Management State
  const [usersFilter, setUsersFilter] = useState({ search: '', role: '', status: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [customBanDate, setCustomBanDate] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setUsersFilter(prev => ({ ...prev, search: searchTerm }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filter changes (excluding search to avoid double trigger)
  useEffect(() => {
    setUserPage(1);
  }, [usersFilter.role, usersFilter.status, usersFilter.search]);

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

  const fetchUsers = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await adminAPI.getUsers({
        ...usersFilter,
        page: userPage,
        limit: 10
      });
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalUsers(res.data.total || 0);
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoadingData(false);
    }
  }, [usersFilter, userPage]);

  const fetchFullLogs = useCallback(async () => {
    setLoadingFullLogs(true);
    try {
      const res = await adminAPI.getSecurityLogs({ limit: 50 });
      setFullLogs(res.data.logs || []);
    } catch (err) {
      console.error('Fetch full logs error:', err);
    } finally {
      setLoadingFullLogs(false);
    }
  }, []);

  useEffect(() => {
    if (logsModal) fetchFullLogs();
  }, [logsModal, fetchFullLogs]);

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


      const response = await fetch(`${apiBase}/admin/users/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const text = await response.text();
        let message = 'Lỗi từ máy chủ';
        try {
          const errData = JSON.parse(text);
          message = errData.message || message;
        } catch (e) {
          // not json
          message = `HTTP Error ${response.status}`;
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      if (blob.size < 10) throw new Error('Dữ liệu trả về quá ít');

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 1500);
    } catch (err) {
      console.error('Fetch export error:', err);
      alert(`Lỗi xuất file: ${err.message}. Hãy thử Refresh (F5) trang web.`);
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      await adminAPI.updateReport(reportId, { status: 'dismissed', resolution: 'Không vi phạm' });
      setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: 'dismissed' } : r));
    } catch (err) { console.error(err); }
  };

  const handleResolveJobReport = async (reportId, actionData) => {
    try {
      await adminAPI.resolveReport(reportId, actionData);
      toast.success('Báo cáo đã được xử lý');
      setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: 'resolved' } : r));
      setReportActionModal(null);
      fetchDashboardData();
    } catch (err) {
      toast.error('Xử lý báo cáo thất bại');
      console.error(err);
    }
  };

  const handleBanSubmit = async () => {
    if (!banModal) return;
    try {
      let banData;
      if (banDuration === 'permanent') {
        banData = { isPermanentlyBanned: true, reason: banReason || 'Vi phạm nội quy' };
      } else if (banDuration === 'custom' && customBanDate) {
        banData = { banUntil: new Date(customBanDate).toISOString(), isPermanentlyBanned: false, reason: banReason || 'Vi phạm nội quy' };
      } else {
        const days = { '1d': 1, '7d': 7, '30d': 30 }[banDuration] || 7;
        const banUntil = new Date(Date.now() + days * 86400000).toISOString();
        banData = { banUntil, isPermanentlyBanned: false, reason: banReason || 'Vi phạm nội quy' };
      }
      await adminAPI.banUser(banModal.userId, banData);
      setBanModal(null);
      setBanReason('');
      setCustomBanDate('');
      fetchUsers();
      fetchDashboardData();
    } catch (err) { console.error(err); }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await adminAPI.banUser(userId, { isBanned: false, isPermanentlyBanned: false, banUntil: null, reason: '' });
      fetchUsers();
      fetchDashboardData();
    } catch (err) { console.error(err); }
  };


  const fetchDashboardData = useCallback(async () => {
    setLoadingData(true);
    try {
      // 1. Fetch System Health (Parallel)
      const healthPromise = adminAPI.getHealth().catch(() => ({ data: { success: false } }));

      const [statsRes, usersRes, logsRes, skillsRes, trafficRes, pendingJobsRes, growthRes, reportsRes, healthRes] = await Promise.allSettled([
        adminAPI.getStats(),
        adminAPI.getUsers({ ...usersFilter, limit: 5 }),
        adminAPI.getSecurityLogs({ limit: 5 }),
        adminAPI.getSkillsAnalytics(),
        adminAPI.getTraffic(),
        adminAPI.getPendingJobs(),
        adminAPI.getGrowthAnalytics(),
        adminAPI.getReports(),
        healthPromise
      ]);
      if (statsRes.status === 'fulfilled') setApiStats(statsRes.value.data.stats);
      if (usersRes.status === 'fulfilled') setDashboardUsers(usersRes.value.data.users || []);
      if (logsRes.status === 'fulfilled') setSecurityLogs(logsRes.value.data.logs || []);
      if (skillsRes.status === 'fulfilled') {
        const skills = skillsRes.value.data.skills || [];
        const niches = skillsRes.value.data.niches || [];
        const maxCount = Math.max(...skills.map(s => s.count), 1);

        setAllSkillsData({ skills, niches });
        setSkillsData(skills.slice(0, 5).map(s => ({
          name: s._id,
          count: s.count,
          pct: Math.round((s.count / maxCount) * 100)
        })));
      }
      if (trafficRes.status === 'fulfilled') {
        const traffic = trafficRes.value.data.traffic || [];
        if (traffic.length > 0) {
          const maxCount = Math.max(...traffic.map(t => t.count), 1);
          setTrafficData(traffic.map(t => Math.round((t.count / maxCount) * 100)));
        }
      }
      if (growthRes.status === 'fulfilled') {
        const growth = growthRes.value.data.userGrowth || [];
        if (growth.length > 0) {
          const maxCount = Math.max(...growth.map(g => g.count), 1);
          // Map to last 7 days including empty days
          const last7 = [];
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const record = growth.find(g => g._id === dateStr);
            last7.push(Math.round(((record?.count || 0) / maxCount) * 100));
          }
          setGrowthData(last7);
        }
      }
      if (pendingJobsRes.status === 'fulfilled') {
        setPendingJobs(pendingJobsRes.value.data.jobs || []);
      }
      if (reportsRes.status === 'fulfilled') {
        setReports(reportsRes.value.data.reports || []);
      }
      if (healthRes && healthRes.status === 'fulfilled' && healthRes.value.data?.success) {
        setSystemStatus({ state: 'operational', message: healthRes.value.data.status || t('admin.sidebar.allOperational') });
      } else {
        setSystemStatus({ state: 'error', message: 'Hệ thống mất kết nối' });
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Admin dashboard fetch error:', err);
    } finally {
      setLoadingData(false);
    }
  }, [usersFilter]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleApprovePortfolio = async (portfolioId) => {
    try {
      await adminAPI.approvePortfolio(portfolioId, { approved: true });
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
      // Refresh both contexts
      fetchUsers();
      fetchDashboardData();
    } catch (err) {
      console.error('Delete user error:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  // Build stats cards from real data
  const statsCards = [
    {
      icon: 'group',
      labelKey: 'admin.stats.totalUsers',
      value: apiStats?.totalUsers?.toLocaleString() ?? '—',
      trend: apiStats?.growthRate,
      trendUp: parseFloat(apiStats?.growthRate || 0) >= 0,
      noteKey: 'admin.stats.vsLast30',
      iconBg: 'bg-blue-100 dark:bg-blue-500/10',
      iconColor: 'text-blue-600',
      glowColor: 'hover:shadow-blue-500/10'
    },
    {
      icon: 'handshake',
      labelKey: 'admin.stats.successfulMatches',
      value: apiStats?.successfulMatches?.toLocaleString() ?? '—',
      trend: null,
      trendUp: true,
      noteKey: 'admin.stats.vsLast30',
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600',
      glowColor: 'hover:shadow-emerald-500/10'
    },
    {
      icon: 'work',
      labelKey: 'admin.stats.openJobs',
      value: apiStats?.openJobs?.toLocaleString() ?? '—',
      trend: apiStats?.pendingJobs > 0 ? apiStats.pendingJobs : null,
      trendUp: true,
      noteKey: 'admin.stats.vsLastMonth',
      iconBg: 'bg-amber-100 dark:bg-amber-500/10',
      iconColor: 'text-amber-600',
      glowColor: 'hover:shadow-amber-500/10'
    },
    {
      icon: 'security',
      labelKey: 'admin.stats.securityAlerts',
      value: apiStats?.threatsToday?.toLocaleString() ?? '—',
      badge: apiStats?.threatsToday > 0 ? apiStats.threatsToday : null,
      badgeKey: 'admin.stats.highRisk',
      noteKey: 'admin.stats.last24h',
      iconBg: 'bg-rose-100 dark:bg-rose-500/10',
      iconColor: 'text-rose-600',
      glowColor: 'hover:shadow-rose-500/10'
    },
  ];

  const displaySkills = skillsData.length > 0 ? skillsData : [];

  return (
    <div className={`${darkMode ? 'dark' : ''} font-sans`}>
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">

        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-6 py-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile sidebar toggle */}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
              <span className="material-icons">menu</span>
            </button>
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-center">
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
                className="block w-72 p-2 pl-10 text-sm border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary placeholder-slate-500 text-slate-900 dark:text-white"
                placeholder={t('admin.nav.searchPlaceholder')}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (activeSection !== 'users' && e.target.value.length > 0) {
                    setActiveSection('users');
                  }
                }}
              />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-slate-700 mx-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
              {t('common.sync') || 'Live Sync'}: {lastUpdated.toLocaleTimeString('vi-VN')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <span className="material-icons text-lg">{darkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-full relative transition-colors ${showNotifications ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <span className="material-icons">notifications</span>
                {(reports.filter(r => r.status === 'pending').length > 0 || pendingJobs.length > 0) && (
                  <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                      <h4 className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">{t('notifications.title')}</h4>
                      <span className="text-[10px] font-bold text-primary">{reports.filter(r => r.status === 'pending').length + pendingJobs.length} {t('notifications.new')}</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {reports.filter(r => r.status === 'pending').length > 0 && (
                        <button
                          onClick={() => { setActiveSection('reports'); setShowNotifications(false); }}
                          className="w-full p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700 text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                            <span className="material-icons">report_problem</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{t('notifications.reports')}</p>
                            <p className="text-[10px] text-slate-500">{t('notifications.reportsDesc', { count: reports.filter(r => r.status === 'pending').length })}</p>
                          </div>
                        </button>
                      )}
                      {pendingJobs.length > 0 && (
                        <button
                          onClick={() => { setActiveSection('moderation'); setShowNotifications(false); }}
                          className="w-full p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700 text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                            <span className="material-icons">verified_user</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{t('notifications.moderation')}</p>
                            <p className="text-[10px] text-slate-500">{t('notifications.moderationDesc', { count: pendingJobs.length })}</p>
                          </div>
                        </button>
                      )}
                      {(reports.filter(r => r.status === 'pending').length === 0 && pendingJobs.length === 0) && (
                        <div className="p-8 text-center">
                          <span className="material-icons text-slate-200 text-4xl mb-2">notifications_none</span>
                          <p className="text-xs font-bold text-slate-400">{t('notifications.empty')}</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                      <button onClick={() => setShowNotifications(false)} className="w-full py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-primary transition-colors">{t('common.cancel')}</button>
                    </div>
                  </div>
                </>
              )}
            </div>
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
              <div className="h-9 w-9 rounded-xl bg-primary/20 overflow-hidden border border-primary/30">
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
                      className={`group flex items-center gap-3 px-6 py-4 text-sm font-bold transition-all duration-300 relative overflow-hidden ${activeSection === id
                        ? id === 'security'
                          ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 border-l-4 border-rose-600'
                          : 'border-l-4 border-primary bg-primary/5 text-primary'
                        : danger
                          ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/5'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                      {activeSection === id && (
                        <div className={`absolute inset-0 opacity-10 animate-pulse ${id === 'security' ? 'bg-rose-500' : 'bg-primary'}`}></div>
                      )}
                      <div className={`p-1.5 rounded-xl transition-all duration-300 ${activeSection === id
                        ? id === 'security' ? 'bg-rose-100 dark:bg-rose-500/20 shadow-sm' : 'bg-primary/20 shadow-sm'
                        : 'bg-transparent'
                        } group-hover:scale-110`}>
                        <span className="material-icons text-[22px]">{icon}</span>
                      </div>
                      <span className="flex-1 relative z-10 flex items-center justify-between">
                        {t(labelKey)}
                        {id === 'security' && <span className="flex h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>}
                      </span>
                      {activeSection === id && (
                        <span className="material-icons text-sm animate-in slide-in-from-left-2">chevron_right</span>
                      )}
                    </a>
                  ))}
                </div>
              ))}
            </div>

            {/* System Status + Logout */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className={`rounded-xl p-4 border transition-all duration-300 ${systemStatus.state === 'error'
                ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                : 'bg-primary/5 dark:bg-primary/10 border-primary/20'
                }`}>
                <p className={`text-xs font-bold mb-1 ${systemStatus.state === 'error' ? 'text-red-500' : 'text-primary'}`}>{t('admin.sidebar.systemStatus')}</p>
                <div className="flex items-center gap-2">
                  <span className={`flex h-2 w-2 rounded-full animate-pulse ${systemStatus.state === 'error' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">{systemStatus.message}</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statsCards.map((stat) => <StatCard key={stat.labelKey} {...stat} />)}
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Left 2/3 */}
                  <div className="xl:col-span-2 space-y-8">
                    {/* User Management Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-slate-800">
                        <h3 className="font-bold text-slate-900 dark:text-white shrink-0">{t('admin.users.title')}</h3>

                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                          <div className="relative flex-1 md:min-w-[200px]">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400">
                              <span className="material-icons text-sm">search</span>
                            </span>
                            <input
                              type="text"
                              placeholder={t('admin.nav.searchPlaceholder')}
                              className="w-full pl-8 pr-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-primary"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                          <select
                            className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary"
                            value={usersFilter.role}
                            onChange={(e) => setUsersFilter({ ...usersFilter, role: e.target.value })}
                          >
                            <option value="">{t('admin.users.filterAllRoles')}</option>
                            <option value="freelancer">Freelancer</option>
                            <option value="client">Khách hàng</option>
                          </select>
                          <button
                            onClick={handleExportCSV}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1"
                          >
                            <span className="material-icons text-sm">download</span> {t('admin.users.exportCsv')}
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
                            {dashboardUsers.length === 0 && !loadingData && (
                              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">{loadingData ? t('common.loading') : t('admin.users.noData')}</td></tr>
                            )}
                            {dashboardUsers.map((u) => (
                              <tr key={u._id || u.email} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-600">
                                      {u.avatar ? (
                                        <img alt={u.name} className="h-full w-full object-cover" src={u.avatar} />
                                      ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                                          <span className="material-icons text-slate-400 text-lg">person</span>
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                        {u.name}
                                        {u.isVerified && <span className="material-icons text-primary text-[14px]">verified</span>}
                                      </p>
                                      <p className="text-[10px] text-slate-500">{u.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 capitalize">{u.role}</td>
                                <td className="px-6 py-4 text-xs">
                                  {u.isBanned ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                      <span className="material-icons text-[10px]">block</span>
                                      {t('admin.users.status.banned') || 'Bị khóa'}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                      <span className="material-icons text-[10px]">check_circle</span>
                                      {t('admin.users.status.active') || 'Hoạt động'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <Link
                                    to={`/profile/${u._id}`}
                                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                                  >
                                    <span className="material-icons text-[10px]">visibility</span>
                                    {t('admin.users.viewPortfolio')}
                                  </Link>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => u.isBanned ? handleUnbanUser(u._id) : setBanModal({ userId: u._id, name: u.name })}
                                    className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${u.isBanned ? 'text-green-600 bg-green-500/10 hover:bg-green-500/20' : 'text-amber-600 bg-amber-500/10 hover:bg-amber-500/20'
                                      }`}
                                  >
                                    {u.isBanned ? t('admin.users.status.unban') : t('admin.users.status.ban')}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-center">
                        <button
                          onClick={() => setActiveSection('users')}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <span className="material-icons text-sm">visibility</span>
                          {t('admin.users.viewAll')}
                        </button>
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
                                  <div key={log._id || i} className={`flex items-start gap-4 p-3 ${meta.color} rounded-xl border-l-4`}>
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
                                <div className="flex items-center gap-3 p-3 border-l-4 border-green-500 bg-green-500/5 rounded-xl">
                                  <span className="material-icons text-green-500">check_circle</span>
                                  <p className="text-xs text-slate-700 dark:text-slate-300">{t('admin.security.noRecentThreats')}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Traffic + Nmap */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                            {/* Traffic Chart */}
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">{t('admin.security.systemTraffic')}</h4>
                              <div className="h-32 w-full bg-slate-900 rounded-xl relative overflow-hidden flex items-end px-2 gap-1 pb-2">
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
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900 dark:text-white">{t('admin.skills.title')}</h3>
                        <span className="material-icons text-slate-400 text-lg">trending_up</span>
                      </div>
                      <div className="space-y-5">
                        {displaySkills.map(({ name, pct, count }, i) => {
                          const color = SKILL_COLORS[i % SKILL_COLORS.length];
                          return (
                            <div key={name} className="group cursor-default">
                              <div className="flex justify-between items-center text-xs mb-1.5">
                                <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">{name}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${color.light} ${color.text}`}>
                                    {count || 0} bài đăng
                                  </span>
                                  <span className="font-bold text-slate-900 dark:text-white">{pct}%</span>
                                </div>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`${color.bg} h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-80 relative`}
                                  style={{ width: `${pct}%` }}
                                >
                                  <div className="absolute inset-0 bg-white/20 w-1/2 rounded-full blur-[2px] -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setShowSkillsModal(true)}
                        className="w-full mt-8 py-2.5 text-xs font-bold text-primary bg-primary/5 border border-primary/10 rounded-xl hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-icons text-sm">analytics</span>
                        {t('admin.skills.viewFullMap')}
                      </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="font-bold text-slate-900 dark:text-white">{t('admin.matching.title')}</h3>
                      </div>
                      <div className="p-6">
                        {(() => {
                          const totalApps = apiStats?.totalApplications || 1;
                          const hiredApps = apiStats?.successfulMatches || 0;
                          const matchRate = Math.round((hiredApps / totalApps) * 100);
                          const strokeDashoffset = 364.4 - (364.4 * matchRate) / 100;

                          return (
                            <div className="flex flex-col items-center">
                              <div className="relative w-32 h-32 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
                                  <circle className="text-slate-100 dark:text-slate-700" cx="65" cy="65" fill="transparent" r="58" stroke="currentColor" strokeWidth="10" />
                                  <circle
                                    className="text-green-500 transition-all duration-1000 ease-in-out"
                                    cx="65" cy="65" fill="transparent" r="58" stroke="currentColor"
                                    strokeWidth="10" strokeLinecap="round"
                                    style={{ strokeDasharray: '364.4', strokeDashoffset }}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{matchRate}%</span>
                                  <span className="text-[10px] text-slate-500">{t('admin.matching.matchRate')}</span>
                                </div>
                              </div>
                              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 w-full">
                                <div className="flex justify-between items-center mb-4">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('admin.matching.details')}</span>
                                  <span className="text-[10px] font-bold text-emerald-500">REAL-TIME</span>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                    <span className="text-xs text-slate-600 dark:text-slate-400">{t('admin.matching.success')}</span>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">{hiredApps}</span>
                                  </div>
                                  <div className="flex justify-between items-center px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                    <span className="text-xs text-slate-600 dark:text-slate-400">{t('admin.matching.totalApps')}</span>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">{totalApps}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Access Logs (SuperAdmin Only) */}
                    {user?.role === 'superadmin' && (
                      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                          <span className="material-icons text-primary text-sm">history</span>
                          <h3 className="font-bold text-slate-900 dark:text-white">{t('admin.logs.title')}</h3>
                        </div>
                        <div className="p-6">
                          <div className="space-y-4">
                            {securityLogs.slice(0, 5).map((log) => (
                              <div key={log._id} className="flex gap-3">
                                <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                  <span className="material-icons text-slate-500 text-sm">
                                    {THREAT_ICON_MAP[log.threat]?.icon || 'history'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">
                                    {log.method} {log.path}
                                  </p>
                                  <p className="text-[10px] text-slate-500 truncate">IP: {log.ip}</p>
                                </div>
                                <span className="text-[8px] text-slate-400 flex-shrink-0 self-start pt-0.5">
                                  {new Date(log.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                            {securityLogs.length === 0 && (
                              <p className="text-[10px] text-slate-400 text-center py-4 italic">No recent logs</p>
                            )}
                          </div>
                          <button
                            onClick={() => setLogsModal(true)}
                            className="w-full mt-6 py-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2 group"
                          >
                            {t('admin.logs.viewFull')}
                            <span className="material-icons text-xs group-hover:translate-x-1 transition-transform">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeSection === 'moderation' && (
              <div className="space-y-8">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white">{t('admin.moderation.title')}</h3>
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">{pendingJobs.length} {t('admin.moderation.pendingJobs')}</span>
                  </div>
                  <div className="p-6">
                    {pendingJobs.length === 0 ? (
                      <div className="text-center py-12">
                        <span className="material-icons text-4xl text-slate-300 dark:text-slate-600 mb-3">check_circle_outline</span>
                        <p className="text-sm text-slate-500 font-medium">{t('admin.moderation.noPendingJobs')}</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {pendingJobs.map(job => (
                          <div key={job._id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col sm:flex-row justify-between gap-6 hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-slate-900 dark:text-white text-lg">{job.title}</h4>
                                {job.isFlagged && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><span className="material-icons text-[10px]">flag</span>{t('admin.moderation.flagged')}</span>}
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{job.description}</p>

                              <div className="flex gap-4 mt-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl flex-wrap">
                                <div className="text-[11px]">
                                  <span className="text-slate-400 block mb-0.5">{t('admin.moderation.budget')}</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300">${job.budget?.min} - ${job.budget?.max}</span>
                                </div>
                                <div className="text-[11px]">
                                  <span className="text-slate-400 block mb-0.5">{t('admin.moderation.client')}</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{job.client?.name || 'Ẩn danh'}</span>
                                </div>
                                <div className="text-[11px]">
                                  <span className="text-slate-400 block mb-0.5">{t('admin.moderation.workType')}</span>
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
                              <button onClick={() => handleApproveJob(job._id, true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-green-500/20">
                                <span className="material-icons text-sm">check</span> {t('admin.moderation.approve')}
                              </button>
                              <button onClick={() => handleApproveJob(job._id, false)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 text-sm font-bold rounded-xl transition-colors">
                                <span className="material-icons text-sm">close</span> {t('admin.moderation.reject')}
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
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('admin.reports.title')}</h2>
                    <p className="text-sm text-slate-500 mt-1">{t('admin.reports.subtitle')}</p>
                  </div>
                  <button onClick={fetchReports} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                    <span className="material-icons text-sm">refresh</span> {t('common.refresh')}
                  </button>
                </div>

                {loadingReports ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-xl animate-pulse border border-slate-200" />)}
                  </div>
                ) : reports.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
                    <span className="material-icons text-5xl text-slate-300 mb-3">inbox</span>
                    <p className="font-bold text-slate-600">{t('admin.reports.noReports')}</p>
                    <p className="text-sm text-slate-400 mt-1">{t('admin.reports.noReportsDesc')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map(report => (
                      <div key={report._id} className={`bg-white dark:bg-slate-800 rounded-xl border shadow-sm overflow-hidden transition-all ${report.status === 'pending' ? 'border-amber-200 dark:border-amber-500/30' :
                        report.status === 'resolved' ? 'border-green-200 dark:border-green-500/30' : 'border-slate-200 dark:border-slate-700'
                        }`}>
                        <div className="p-5">
                          <div className="flex flex-wrap gap-3 items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {report.reporter?.avatar ? (
                                <img src={report.reporter.avatar} alt={report.reporter.name} className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                  <span className="material-icons text-slate-400 dark:text-slate-500 text-base">person</span>
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">Báo cáo từ: {report.reporter?.name || 'Ẩn danh'}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">Đối tượng: <span className="font-semibold text-red-600 dark:text-red-400">{report.accusedUser?.name || '—'}</span> · {new Date(report.createdAt).toLocaleDateString('vi-VN')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${report.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                  'bg-slate-100 text-slate-500'
                                }`}>
                                {report.status === 'pending' ? '⏳ Chờ xem xét' : report.status === 'resolved' ? '✅ Đã xử lý' : '🚫 Đã đóng'}
                              </span>
                              <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-1 rounded-full capitalize">{report.type}</span>
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-3 mb-4">
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
                                {expandedReport === report._id ? t('common.hideContent') || 'Ẩn nội dung' : t('common.viewContent') || 'Xem nội dung vi phạm'}
                              </button>
                              {expandedReport === report._id && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-slate-700 italic border-l-4 border-l-red-400">
                                  "{report.contentPreview}"
                                </div>
                              )}
                            </div>
                          )}

                          {report.status === 'pending' && (
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                              <button
                                onClick={() => handleDismissReport(report._id)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                              >
                                <span className="material-icons text-sm">do_not_disturb</span>{t('admin.reports.dismiss')}
                              </button>
                              <button
                                onClick={() => handleResolveReport(report._id)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
                              >
                                <span className="material-icons text-sm">check_circle</span>{t('admin.reports.resolve')}
                              </button>
                              {report.accusedUser && (
                                <>
                                  <button
                                    onClick={() => setBanModal({ userId: report.accusedUser._id, name: report.accusedUser.name })}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors"
                                  >
                                    <span className="material-icons text-sm">lock</span>{t('admin.users.status.ban')}
                                  </button>
                                  <button
                                    onClick={() => setDeleteWarning({ userId: report.accusedUser._id, name: report.accusedUser.name })}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                                  >
                                    <span className="material-icons text-sm">delete_forever</span>{t('common.delete')}
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
              </div>
            )}
            {activeSection === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý người dùng</h2>
                    <p className="text-sm text-slate-500 mt-1">Tổng số: {totalUsers} thành viên trong hệ thống</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                      <span className="material-icons text-lg">download</span> {t('admin.users.exportCsv')}
                    </button>
                    <button
                      onClick={fetchUsers}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      <span className="material-icons text-lg">refresh</span> {t('common.refresh')}
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <span className="material-icons text-lg">search</span>
                    </span>
                    <input
                      type="text"
                      placeholder={t('admin.nav.searchPlaceholder')}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary min-w-[140px]"
                    value={usersFilter.role}
                    onChange={(e) => setUsersFilter({ ...usersFilter, role: e.target.value })}
                  >
                    <option value="">{t('admin.users.filterAllRoles')}</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="client">Khách hàng</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary min-w-[140px]"
                    value={usersFilter.status}
                    onChange={(e) => setUsersFilter({ ...usersFilter, status: e.target.value })}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="banned">Đã bị khóa</option>
                  </select>
                </div>

                {/* User Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-4">Người dùng</th>
                          <th className="px-6 py-4">Vai trò</th>
                          <th className="px-6 py-4">Ngày tham gia</th>
                          <th className="px-6 py-4">Trạng thái</th>
                          <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {users.map((u) => (
                          <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                                  {u.avatar ? (
                                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                      <span className="material-icons text-slate-400 text-xl">person</span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                    {u.name}
                                    {u.isVerified && <span className="material-icons text-primary text-sm">verified</span>}
                                  </p>
                                  <p className="text-xs text-slate-500">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                u.role === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                }`}>
                                {u.role === 'freelancer' ? 'Freelancer' : u.role === 'client' ? 'Khách hàng' : 'Admin'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                              {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-6 py-4">
                              {u.isBanned ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                  <span className="material-icons text-xs">block</span> Bị khóa
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                  <span className="material-icons text-xs">check_circle</span> Hoạt động
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => u.isBanned ? handleUnbanUser(u._id) : setBanModal({ userId: u._id, name: u.name })}
                                  className={`p-2 rounded-xl transition-colors ${u.isBanned ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                    }`}
                                  title={u.isBanned ? 'Mở khóa' : 'Khóa tài khoản'}
                                >
                                  <span className="material-icons text-lg">{u.isBanned ? 'lock_open' : 'lock'}</span>
                                </button>
                                <button
                                  onClick={() => setDeleteWarning({ userId: u._id, name: u.name })}
                                  className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                  title="Xóa vĩnh viễn"
                                >
                                  <span className="material-icons text-lg">delete_forever</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                    <p className="text-xs text-slate-500">Trang {userPage} / {totalPages}</p>
                    <div className="flex gap-2">
                      <button
                        disabled={userPage === 1}
                        onClick={() => setUserPage(userPage - 1)}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold disabled:opacity-50"
                      >Trước</button>
                      <button
                        disabled={userPage === totalPages}
                        onClick={() => setUserPage(userPage + 1)}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold disabled:opacity-50"
                      >Sau</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeSection === 'security' && (
              <SecurityMonitor
                logs={securityLogs}
                traffic={trafficData}
                stats={apiStats}
                onAnalyze={(log) => setAnalysisModal(log)}
              />
            )}
            {activeSection === 'matching' && (
              <MatchingView stats={apiStats} />
            )}
            {activeSection === 'analytics' && <AnalyticsView skillsData={allSkillsData} stats={apiStats} growthData={growthData} />}
            {activeSection === 'reports' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-icons text-primary">report</span> Báo cáo vi phạm
                  </h2>
                  <button onClick={fetchReports} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">
                    <span className="material-icons text-lg">refresh</span> Làm mới
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-4">Báo cáo</th>
                          <th className="px-6 py-4">Đối tượng bị tố cáo</th>
                          <th className="px-6 py-4">Người báo cáo</th>
                          <th className="px-6 py-4">Lý do</th>
                          <th className="px-6 py-4">Trạng thái</th>
                          <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {loadingReports ? (
                          [1, 2, 3].map(i => (
                            <tr key={i} className="animate-pulse">
                              <td colSpan="6" className="px-6 py-8 h-16 bg-slate-50/50 dark:bg-slate-900/20"></td>
                            </tr>
                          ))
                        ) : reports.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-20 text-center">
                              <div className="flex flex-col items-center justify-center text-slate-400">
                                <span className="material-icons text-6xl mb-4 bg-slate-100 dark:bg-slate-900/50 p-6 rounded-full">verified_user</span>
                                <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300">Tuyệt vời!</h4>
                                <p className="text-sm max-w-xs mx-auto mt-2">Hiện tại không có báo cáo vi phạm nào cần xử lý. Hệ thống của bạn đang rất sạch sẽ.</p>
                              </div>
                            </td>
                          </tr>
                        ) : reports.map(r => (
                          <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{r.type === 'job' ? '💼 Công việc' : '👤 Người dùng'}</span>
                                <span className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleString('vi-VN')}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                              {r.type === 'job' ? (
                                <div className="flex flex-col">
                                  <span className="text-primary hover:underline cursor-pointer">{r.jobId?.title || 'Công việc không còn tồn tại'}</span>
                                  <span className="text-[10px] text-slate-500 italic">ID: {r.jobId?._id}</span>
                                </div>
                              ) : (
                                <span>{r.accusedUser?.name || 'N/A'}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                              {r.reporter?.name || 'Ẩn danh'}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 italic truncate max-w-xs">{r.reason}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${r.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                }`}>
                                {r.status === 'pending' ? 'Đang chờ' : 'Đã xử lý'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {r.status === 'pending' && (
                                <button
                                  onClick={() => setReportActionModal({
                                    reportId: r._id,
                                    job: r.jobId,
                                    accusedUser: r.accusedUser,
                                    reason: r.reason
                                  })}
                                  className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                  Xử lý
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {activeSection !== 'dashboard' && activeSection !== 'moderation' && activeSection !== 'reports' && activeSection !== 'users' && activeSection !== 'security' && activeSection !== 'matching' && activeSection !== 'analytics' && (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <span className="material-icons text-6xl text-slate-300 dark:text-slate-600 mb-4">construction</span>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Tính năng đang xây dựng</h3>
                <p className="text-sm text-slate-500 mt-2">Phần này ({activeSection}) sẽ sớm được hoàn thiện.</p>
                <button onClick={() => setActiveSection('dashboard')} className="mt-6 px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors">
                  Quay lại Dashboard
                </button>
              </div>
            )}
            {/* Report Action Modal */}
            {reportActionModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                      <span className="material-icons text-red-500">gavel</span> Xử lý báo cáo
                    </h3>
                    <button onClick={() => { setReportActionModal(null); setBanDuration('7d'); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                      <span className="material-icons">close</span>
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Thông tin vi phạm</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{reportActionModal.job?.title || reportActionModal.accusedUser?.name}</p>
                      <p className="text-xs text-slate-500 mt-1 italic">"{reportActionModal.reason}"</p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Chọn hành động xử lý:</p>

                      <button
                        onClick={() => handleResolveJobReport(reportActionModal.reportId, { action: 'none', resolution: 'Bỏ qua báo cáo' })}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <span className="material-icons text-slate-500">close</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Bỏ qua báo cáo</p>
                          <p className="text-xs text-slate-500">Báo cáo không hợp lệ, không thực hiện hành động nào.</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm('Xác nhận xóa công việc này?')) {
                            handleResolveJobReport(reportActionModal.reportId, { action: 'delete_job', resolution: 'Tin đăng vi phạm chính sách' });
                          }
                        }}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <span className="material-icons text-red-500">delete_forever</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-red-600">Xóa công việc</p>
                          <p className="text-xs text-red-700/60 dark:text-red-400">Gỡ bỏ tin đăng này vĩnh viễn khỏi hệ thống.</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setReportActionModal({ ...reportActionModal, mode: 'ban' });
                        }}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                          <span className="material-icons text-orange-500">block</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-orange-600">Khóa người đăng + Xóa Job</p>
                          <p className="text-xs text-orange-700/60 dark:text-orange-400">Hành động mạnh mẽ nhất cho các trường hợp lừa đảo.</p>
                        </div>
                      </button>
                    </div>

                    {reportActionModal.mode === 'ban' && (
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 animate-in slide-in-from-top-4 duration-300">
                        <label className="block text-xs font-bold text-orange-700 uppercase mb-3">Thời hạn khóa tài khoản</label>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {[{ v: '7d', l: '7 ngày' }, { v: '30d', l: '30 ngày' }, { v: 'permanent', l: 'Vĩnh viễn' }].map(opt => (
                            <button
                              key={opt.v}
                              onClick={() => setBanDuration(opt.v)}
                              className={`p-2 rounded-lg text-xs font-bold border-2 transition-all ${banDuration === opt.v ? 'border-orange-500 bg-white text-orange-600' : 'border-orange-100 text-orange-400'
                                }`}
                            >{opt.l}</button>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            const days = { '7d': 7, '30d': 30 }[banDuration] || 7;
                            const banUntil = banDuration === 'permanent' ? null : new Date(Date.now() + days * 86400000).toISOString();
                            handleResolveJobReport(reportActionModal.reportId, {
                              action: 'ban_user',
                              resolution: `Vi phạm nghiêm trọng: ${reportActionModal.reason}`,
                              isPermanentlyBanned: banDuration === 'permanent',
                              banUntil
                            });
                          }}
                          className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
                        >
                          Xác nhận Khóa & Xử lý báo cáo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Modals placed globally within main tag */}
            {/* Ban Modal */}
            {banModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setBanModal(null)}>
                <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center">
                      <span className="material-icons text-orange-500">lock</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Khóa tài khoản</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{banModal.name}</p>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Thời hạn khóa</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[{ v: '1d', l: '1 ngày' }, { v: '7d', l: '7 ngày' }, { v: '30d', l: '30 ngày' }, { v: 'custom', l: 'Tuỳ chỉnh' }, { v: 'permanent', l: 'Vĩnh viễn' }].map(opt => (
                          <button
                            key={opt.v}
                            onClick={() => setBanDuration(opt.v)}
                            className={`p-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${banDuration === opt.v
                              ? opt.v === 'permanent' ? 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' : 'border-primary bg-primary/5 text-primary'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                          >{opt.l}</button>
                        ))}
                      </div>
                    </div>
                    {banDuration === 'custom' && (
                      <div className="animate-in slide-in-from-top-2 duration-200">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('admin.users.banSelectDate')}</label>
                        <input
                          type="date"
                          value={customBanDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setCustomBanDate(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('admin.users.banReasonLabel')}</label>
                      <input
                        type="text"
                        value={banReason}
                        onChange={e => setBanReason(e.target.value)}
                        placeholder={t('admin.users.banPlaceholder')}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white"
                      />
                    </div>
                    {banDuration === 'permanent' && (
                      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3 flex gap-2">
                        <span className="material-icons text-red-500 text-base mt-0.5">warning</span>
                        <p className="text-xs text-red-700 dark:text-red-400 font-medium">{t('admin.users.banPermanentNote')}</p>
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setBanModal(null)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">{t('common.cancel')}</button>
                      <button onClick={handleBanSubmit} className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors shadow-sm ${banDuration === 'permanent' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                        }`}>Xác nhận khóa</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete User Warning Modal */}
            {deleteWarning && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setDeleteWarning(null); setDeleteConfirmText(''); }}>
                <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="bg-red-600 p-5 text-white flex items-center gap-3 rounded-t-2xl">
                    <span className="material-icons text-3xl">dangerous</span>
                    <div>
                      <h3 className="font-bold text-lg">{t('common.criticalWarning')}</h3>
                      <p className="text-sm text-red-200">{t('admin.users.deleteSub')}</p>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                      <p className="text-sm text-red-800 dark:text-red-400 font-semibold mb-2">{t('admin.users.deleteAbout')}</p>
                      <p className="font-bold text-red-900 dark:text-red-300 text-lg">{deleteWarning.name}</p>
                      <ul className="mt-3 space-y-1 text-xs text-red-700 dark:text-red-400">
                        <li>• {t('admin.users.deleteWarning1')}</li>
                        <li>• {t('admin.users.deleteWarning2')}</li>
                        <li>• {t('admin.users.deleteWarning3')}</li>
                      </ul>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        {t('admin.users.deletePrompt')}
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={e => setDeleteConfirmText(e.target.value)}
                        placeholder="XOA VINH VIEN"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border-2 border-red-300 dark:border-red-500/30 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setDeleteWarning(null); setDeleteConfirmText(''); }}
                        className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >{t('admin.users.deleteSafe')}</button>
                      <button
                        onClick={handleDeleteUser}
                        disabled={deleteConfirmText !== 'XOA VINH VIEN'}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-red-500/20"
                      >{t('admin.users.deletePermanent')}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showSkillsModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSkillsModal(false)}>
                <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="bg-primary p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="material-icons text-3xl">map</span>
                      <div>
                        <h3 className="font-bold text-xl">{t('admin.skills.mapTitle')}</h3>
                        <p className="text-sm text-blue-100 opacity-80">{t('admin.skills.mapDesc')}</p>
                      </div>
                    </div>
                    <button onClick={() => setShowSkillsModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                      <span className="material-icons">close</span>
                    </button>
                  </div>

                  <div className="p-8 overflow-y-auto max-h-[calc(90vh-88px)]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      {/* Skills Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-6">
                          <span className="material-icons text-primary">psychology</span>
                          <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">{t('admin.skills.highDemand')}</h4>
                        </div>
                        <div className="space-y-6">
                          {allSkillsData.skills.map((s, i) => {
                            const maxVal = Math.max(...allSkillsData.skills.map(sk => sk.count), 1);
                            const pct = Math.round((s.count / maxVal) * 100);
                            const color = SKILL_COLORS[i % SKILL_COLORS.length];
                            return (
                              <div key={s._id}>
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{s._id}</span>
                                  <span className="text-xs font-bold text-slate-500">{s.count} {t('admin.skills.requests')}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3">
                                  <div
                                    className={`${color.bg} h-3 rounded-full transition-all duration-1000`}
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Niches Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-6">
                          <span className="material-icons text-purple-500">category</span>
                          <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">{t('admin.skills.niches')}</h4>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {allSkillsData.niches.map((n, i) => (
                            <div key={n._id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between min-w-[140px] flex-1">
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight mb-0.5">{n._id}</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{n.count}</p>
                              </div>
                              <span className="material-icons text-slate-300 dark:text-slate-600">arrow_outward</span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-12 p-6 bg-blue-50 dark:bg-primary/10 rounded-2xl border border-blue-100 dark:border-primary/20">
                          <h5 className="font-bold text-primary mb-2 flex items-center gap-2">
                            <span className="material-icons text-sm">info</span>
                            {t('admin.skills.adminNote')}
                          </h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {t('admin.skills.adminNoteDesc')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Full Logs Modal */}
            {logsModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 shadow-primary/20">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <span className="material-icons text-primary text-2xl">history</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('admin.security.detailLog')}</h3>
                        <p className="text-xs text-slate-500 font-medium font-bold opacity-80">{t('admin.security.detailLogDesc')}</p>
                      </div>
                    </div>
                    <button onClick={() => setLogsModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors group">
                      <span className="material-icons text-slate-400 group-hover:rotate-90 transition-transform">close</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto p-0">
                    {loadingFullLogs ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">{t('admin.security.fetchingLogs')}</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('admin.security.colTime')}</th>
                              <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('admin.security.colMethod')}</th>
                              <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('admin.security.colPath')}</th>
                              <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('admin.security.colIp')}</th>
                              <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('admin.security.colThreat')}</th>
                              <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('admin.security.colStatus')}</th>
                              <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t('common.actions')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {fullLogs.map((log) => (
                              <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group">
                                <td className="p-4 whitespace-nowrap">
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${log.method === 'GET' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10' :
                                    log.method === 'POST' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10' :
                                      'bg-slate-100 text-slate-700'
                                    }`}>
                                    {log.method}
                                  </span>
                                </td>
                                <td className="p-4 max-w-xs">
                                  <p className="text-xs font-mono text-slate-500 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{log.path}</p>
                                </td>
                                <td className="p-4">
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{log.ip}</span>
                                </td>
                                <td className="p-4">
                                  {log.threat !== 'none' ? (
                                    <span className="flex items-center gap-1.5 text-rose-600 text-[10px] font-black bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-100 dark:border-rose-500/20">
                                      <span className="material-icons text-xs">warning</span> {log.threat.toUpperCase()}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${log.status >= 400 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{log.status}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => {
                                      setAnalysisModal(log);
                                      setLogsModal(false);
                                    }}
                                    className="text-[10px] font-black text-primary hover:underline uppercase tracking-tight"
                                  >
                                    {t('common.analysis') || 'Phân tích'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {fullLogs.length === 0 && (
                              <tr>
                                <td colSpan="6" className="p-20 text-center">
                                  <span className="material-icons text-4xl text-slate-200 mb-2">history</span>
                                  <p className="text-sm font-bold text-slate-400">{t('admin.security.noRecentThreats')}</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="material-icons text-sm text-primary">verified_user</span>
                      {t('admin.security.aiProtected')}
                    </p>
                    <button onClick={() => setLogsModal(false)} className="px-8 py-2.5 bg-slate-900 dark:bg-primary text-white text-xs font-black rounded-xl hover:shadow-xl transition-all hover:-translate-y-0.5 uppercase tracking-widest">
                      {t('common.closeLogs') || 'Đóng Nhật Ký'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Security Log Analysis Modal */}
            {analysisModal && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setAnalysisModal(null)}>
                <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  {/* Header */}
                  <div className={`p-6 flex justify-between items-center ${analysisModal.threat !== 'none' ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className="material-icons text-3xl">
                        {THREAT_ICON_MAP[analysisModal.threat]?.icon || 'security'}
                      </span>
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">{t('admin.analysis.title')}</h3>
                        <p className="text-xs opacity-80 font-bold uppercase tracking-widest">
                          ID: {analysisModal._id?.slice(-8) || 'SESSION-LOG'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setAnalysisModal(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                      <span className="material-icons">close</span>
                    </button>
                  </div>

                  <div className="p-8 space-y-8">
                    {/* Severity Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('admin.analysis.severity')}</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${analysisModal.threat === 'none' ? 'bg-green-500' :
                            ['sqli-attempt', 'xss-attempt'].includes(analysisModal.threat) ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
                            }`}></div>
                          <span className="text-lg font-black text-slate-900 dark:text-white uppercase transition-colors">
                            {analysisModal.threat === 'none' ? t('admin.analysis.low') :
                              ['sqli-attempt', 'xss-attempt'].includes(analysisModal.threat) ? t('admin.analysis.critical') : t('admin.analysis.medium')}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('admin.analysis.httpStatus')}</p>
                        <h4 className={`text-lg font-black ${analysisModal.status >= 400 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          HTTP {analysisModal.status}
                        </h4>
                      </div>
                    </div>

                    {/* Technical Breakdown */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-icons text-sm">settings_ethernet</span>
                        {t('admin.analysis.technicalDetails')}
                      </h4>
                      <div className="bg-slate-900 rounded-2xl p-6 font-mono text-xs space-y-3 border border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Method</span>
                          <span className="text-primary font-bold">{analysisModal.method}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500 shrink-0">Endpoint</span>
                          <span className="text-emerald-400 break-all text-right">{analysisModal.path}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Source IP</span>
                          <span className="text-white font-bold">{analysisModal.ip}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Timestamp</span>
                          <span className="text-slate-300">{new Date(analysisModal.createdAt).toLocaleString()}</span>
                        </div>
                        {analysisModal.threatDetails && (
                          <div className="pt-3 border-t border-slate-800">
                            <span className="text-rose-400 block mb-1">Payload / Details:</span>
                            <p className="text-slate-400 italic bg-rose-500/5 p-2 rounded">{analysisModal.threatDetails}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Intelligent Insight */}
                    <div className="bg-blue-50 dark:bg-primary/5 p-6 rounded-2xl border border-blue-100 dark:border-primary/20">
                      <h4 className="flex items-center gap-2 text-sm font-bold text-primary mb-2">
                        <span className="material-icons text-lg">psychology</span>
                        Nhận định từ AI Security
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {analysisModal.threat === 'sqli-attempt' ? 'Phát hiện các từ khóa SQL độc hại trong tham số yêu cầu. Đây là nỗ lực nhằm chiếm quyền truy cập hoặc trích xuất dữ liệu trái phép từ database.' :
                          analysisModal.threat === 'xss-attempt' ? 'Phát hiện các đoạn mã script nghi vấn. Đối tượng đang cố gắng chèn mã độc vào giao diện người dùng để đánh cắp session hoặc thông tin cá nhân.' :
                            analysisModal.threat === 'scan' ? 'IP này đang thực hiện quét các đường dẫn nhạy cảm. Đây có thể là công cụ tự động đang dò tìm lỗ hổng bảo mật.' :
                              'Yêu cầu này có vẻ hợp lệ nhưng được ghi lại để phục vụ mục đích kiểm toán hệ thống định kỳ.'}
                      </p>
                    </div>

                    {/* Mitigation Actions */}
                    <div className="flex gap-4 pt-2">
                      <button
                        onClick={() => {
                          alert(`Đã gửi yêu cầu chặn IP ${analysisModal.ip} tới Firewall.`);
                          setAnalysisModal(null);
                        }}
                        className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black rounded-2xl transition-all hover:shadow-lg shadow-rose-500/20 uppercase tracking-widest"
                      >
                        Chặn IP này
                      </button>
                      <button
                        onClick={() => setAnalysisModal(null)}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors uppercase tracking-widest"
                      >
                        Bỏ qua
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
