import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { jobsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── COMPONENTS ─────────────────────────────────────────────────────

function StatCard({ icon, label, value, trend, note, iconBg, iconColor, loading, onClick, isActive }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white overflow-hidden rounded-lg shadow-sm border p-5 transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-primary' : 'border-gray-200'
        } ${isActive ? 'ring-2 ring-primary border-transparent' : ''}`}
    >
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${iconBg} rounded-md p-3`}>
          <span className={`material-icons ${iconColor}`}>{icon}</span>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
          <dd className="flex items-baseline">
            {loading
              ? <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
              : <div className="text-2xl font-semibold text-gray-900">{value ?? '—'}</div>
            }
            {trend && !loading && <span className="ml-2 flex items-baseline text-sm font-semibold text-green-600"><span className="material-icons text-xs mr-0.5">arrow_upward</span>{trend}</span>}
            {note && !loading && <span className="ml-2 text-sm text-gray-500">{note}</span>}
          </dd>
        </div>
      </div>
    </div>
  );
}

function PostJobModal({ onClose, onSuccess }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: '', description: '', niche: [], subNiche: [], workType: 'remote',
    expertiseLevel: 'junior',
    'budget.type': 'fixed', 'budget.min': '', 'budget.max': '', 'budget.currency': 'VND',
    requiredSkills: '', deadline: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const NICHES = [
    { id: 'writing', label: 'Viết lách / Nội dung' },
    { id: 'design', label: 'Thiết kế / Sáng tạo' },
    { id: 'video', label: 'Video Editor / Media' },
    { id: 'dev', label: 'Lập trình / IT' },
    { id: 'marketing', label: 'Digital Marketing' },
    { id: 'esports', label: 'Thể thao điện tử' },
    { id: 'finance', label: 'Tài chính / Kế toán' },
    { id: 'education', label: 'Giáo dục / Gia sư' },
    { id: 'sales', label: 'Bán hàng / Kinh doanh' },
    { id: 'health', label: 'Y tế / Sức khỏe' },
    { id: 'beauty', label: 'Làm đẹp / Thời trang' },
    { id: 'photography', label: 'Nhiếp ảnh / Film' },
    { id: 'translation', label: 'Biên phiên dịch' },
    { id: 'event', label: 'Sự kiện / Ẩm thực' },
    { id: 'va', label: 'Trợ lý ảo / Admin' },
    { id: 'legal', label: 'Pháp lý / Tư vấn' },
  ];

  const SUB_NICHES = {
    writing: ['SEO Blog', 'Viết Quảng Cáo (Ads)', 'Kịch bản Video', 'Sách / Ebook', 'PR / Báo chí'],
    video: ['Talking Head', 'Vlog', 'Reels/Shorts', 'Documentary', 'Corporate / Ads', 'Music Video'],
    design: ['Logo / Branding', 'UI/UX Design', 'Social Media Graphics', 'Illustration', 'Bao bì'],
    dev: ['Front-end', 'Back-end', 'Full-stack', 'Mobile App', 'Game Dev', 'AI / Data Science'],
    marketing: ['Facebook Ads', 'Google Ads', 'SEO', 'Email Marketing', 'KOL / Influencer Manager'],
    esports: ['Streamer', 'Pro Player', 'Caster / Analyst', 'Coach (Huấn luyện viên)', 'Manager / Scout'],
    finance: ['Kế toán thuế', 'Kiểm toán', 'Phân tích tài chính', 'Tư vấn đầu tư', 'Quản lý dòng tiền'],
    education: ['Gia sư ngoại ngữ', 'Dạy kỹ năng mềm', 'Luyện thi (IELTS/TOEIC)', 'Đào tạo doanh nghiệp', 'E-learning Content'],
    sales: ['Telesale', 'Bán hàng B2B', 'Tư vấn bảo hiểm', 'Bất động sản', 'Phát triển thị trường'],
    health: ['Tư vấn dinh dưỡng', 'PT (Huấn luyện viên cá nhân)', 'Yoga / Yoga bay', 'Tham vấn tâm lý'],
    beauty: ['Trang điểm (Makeup)', 'Làm tóc / Nails', 'Stylist thời trang', 'Skincare Consultant'],
    photography: ['Ảnh cưới', 'Ảnh sản phẩm', 'Flycam / Cinematic', 'Chỉnh sửa ảnh chuyên nghiệp'],
    translation: ['Biên dịch tài liệu', 'Phiên dịch cabin', 'Bản địa hóa (Localization)', 'Phụ đề / Lồng tiếng'],
    event: ['Wedding Planner', 'MC / Hoạt náo', 'Trang trí sự kiện', 'Chef / Catering'],
    va: ['Data Entry', 'Chăm sóc Khách hàng', 'Quản lý Lịch trình', 'Nghiên cứu thị trường', 'Telesale'],
    legal: ['Tư vấn luật', 'Hồ sơ pháp lý', 'Tranh tụng', 'Tư vấn doanh nghiệp'],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) { setError('Vui lòng điền tiêu đề và mô tả'); return; }
    setLoading(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        niche: form.niche,
        subNiche: form.subNiche,
        workType: form.workType,
        expertiseLevel: form.expertiseLevel,
        budget: {
          type: form['budget.type'],
          min: parseFloat(form['budget.min']) || 0,
          max: parseFloat(form['budget.max']) || 0,
          currency: form['budget.currency'],
        },
        requiredSkills: form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        deadline: form.deadline || undefined,
      };
      await jobsAPI.createJob(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const toggleNiche = (id) => {
    setForm(prev => ({
      ...prev,
      niche: prev.niche.includes(id) ? prev.niche.filter(x => x !== id) : [...prev.niche, id],
      // Reset subNiches if main niche is removed
      subNiche: prev.niche.includes(id) ? prev.subNiche.filter(sn => !SUB_NICHES[id]?.includes(sn)) : prev.subNiche
    }));
  };

  const toggleSubNiche = (sn) => {
    setForm(prev => ({
      ...prev,
      subNiche: prev.subNiche.includes(sn) ? prev.subNiche.filter(x => x !== sn) : [...prev.subNiche, sn],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <h2 className="font-bold text-lg text-gray-900">Đăng tin tuyển dụng</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><span className="material-icons text-gray-400">close</span></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Tiêu đề công việc *</label>
            <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Vd: Cần editor video Talking Head..." className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Mô tả chi tiết *</label>
            <textarea rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Mô tả yêu cầu công việc, kết quả mong đợi..." className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Lĩnh vực (Niche)</label>
            <div className="flex flex-wrap gap-2">
              {NICHES.map(n => (
                <button key={n.id} type="button" onClick={() => toggleNiche(n.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.niche.includes(n.id) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-primary'}`}
                >{n.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Ngách chuyên sâu (Sub-Niches)</label>
            <div className="flex flex-wrap gap-2">
              {form.niche.map(nId => (
                SUB_NICHES[nId]?.map(sn => (
                  <button key={`${nId}-${sn}`} type="button" onClick={() => toggleSubNiche(sn)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.subNiche.includes(sn) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-600'}`}
                  >{sn}</button>
                ))
              ))}
              {form.niche.length === 0 && <p className="text-xs text-gray-400 italic">Chọn Lĩnh vực trước để chọn Ngách...</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Hình thức</label>
              <select value={form.workType} onChange={e => setForm(p => ({ ...p, workType: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="remote">🌐 Remote</option>
                <option value="hybrid">🏢 Hybrid</option>
                <option value="onsite">📍 On-site</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Trình độ yêu cầu</label>
              <select value={form.expertiseLevel} onChange={e => setForm(p => ({ ...p, expertiseLevel: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="intern">Intern</option>
                <option value="junior">Junior</option>
                <option value="middle">Middle</option>
                <option value="senior">Senior</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Loại ngân sách</label>
              <select value={form['budget.type']} onChange={e => setForm(p => ({ ...p, 'budget.type': e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="fixed">💵 Cố định</option>
                <option value="hourly">⏱ Theo giờ</option>
                <option value="monthly">📅 Theo tháng</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Tối thiểu</label>
              <input type="number" value={form['budget.min']} onChange={e => setForm(p => ({ ...p, 'budget.min': e.target.value }))} placeholder="0" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Tối đa</label>
              <input type="number" value={form['budget.max']} onChange={e => setForm(p => ({ ...p, 'budget.max': e.target.value }))} placeholder="0" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Đơn vị</label>
              <select value={form['budget.currency']} onChange={e => setForm(p => ({ ...p, 'budget.currency': e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Kỹ năng yêu cầu (phân cách bằng dấu phẩy)</label>
            <input type="text" value={form.requiredSkills} onChange={e => setForm(p => ({ ...p, requiredSkills: e.target.value }))} placeholder="Premiere Pro, After Effects, DaVinci Resolve..." className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Hạn nộp hồ sơ (tùy chọn)</label>
            <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}
        </form>
        <div className="p-5 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors">
            {loading ? 'Đang đăng...' : 'Đăng tin'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplicationsModal({ job, onClose }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchApps = useCallback(() => {
    setLoading(true);
    jobsAPI.getApplications(job._id)
      .then(res => setApplications(res.data.applications || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [job._id]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const handleAccept = async (appId) => {
    if (!window.confirm('Bạn có chắc chắn muốn chấp nhận ứng viên này? (Hệ thống sẽ gửi thông báo chúc mừng đến ứng viên)')) return;
    try {
      await jobsAPI.acceptApplication(job._id, appId);
      alert('Đã chấp nhận ứng viên thành công!');
      fetchApps(); // reload list
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleReject = async (appId) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối ứng viên này? (Hệ thống sẽ gửi thông báo đến ứng viên)')) return;
    try {
      await jobsAPI.rejectApplication(job._id, appId);
      alert('Đã từ chối ứng viên.');
      fetchApps(); // reload list
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg text-gray-900">Đơn ứng tuyển</h2>
            <p className="text-sm text-gray-500">{job.title} · {applications.length} ứng viên</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><span className="material-icons text-gray-400">close</span></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="flex gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full" /><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-1/2" /><div className="h-2 bg-gray-200 rounded w-3/4" /></div></div>)}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <span className="material-icons text-4xl mb-2 block">inbox</span>
              <p>Chưa có đơn ứng tuyển</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {applications.map(app => (
                <li key={app._id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start gap-3">
                    {app.freelancer?.avatar
                      ? <img alt={app.freelancer.name} className="w-10 h-10 rounded-full object-cover" src={app.freelancer.avatar} />
                      : <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><span className="material-icons text-primary text-sm">person</span></div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">{app.freelancer?.name}</p>
                        <div className="flex gap-1">
                          {app.freelancer?.rating > 0 && <span className="text-xs text-amber-500">⭐ {app.freelancer.rating.toFixed(1)}</span>}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${app.status === 'hired' ? 'bg-green-100 text-green-700' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-500' :
                              app.status === 'reviewed' ? 'bg-blue-100 text-primary' : 'bg-gray-100 text-gray-500'
                            }`}>{app.status}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {app.freelancer?.niche?.slice(0, 2).join(', ')}
                        {app.proposedRate && ` · Đề xuất: ${app.proposedRate.toLocaleString()} VND`}
                      </p>
                      {app.coverLetter && (
                        <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg italic line-clamp-3">"{app.coverLetter}"</p>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => navigate(`/messages?with=${app.freelancer._id}`)}
                          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-transparent hover:border-blue-200 hover:bg-blue-100 rounded-full transition-colors"
                        >
                          <span className="material-icons text-[14px]">chat</span>
                          Nhắn tin
                        </button>

                        {/* Only show Accept and Reject if the application is not already finalized */}
                        {(app.status === 'pending' || app.status === 'reviewed') && (
                          <>
                            <button
                              onClick={() => handleAccept(app._id)}
                              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 rounded-full shadow-sm transition-colors"
                            >
                              <span className="material-icons text-[14px]">check_circle</span>
                              Chấp nhận
                            </button>
                            <button
                              onClick={() => handleReject(app._id)}
                              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-transparent hover:border-red-200 rounded-full transition-colors"
                            >
                              <span className="material-icons text-[14px]">cancel</span>
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN ────────────────────────────────────────────────────────────

export default function EmployerDashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [myJobs, setMyJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [postModal, setPostModal] = useState(false);
  const [appModal, setAppModal] = useState(null); // selected job for applications
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchMyJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      // Fetch all jobs posted by this client
      const { data } = await jobsAPI.getMyJobs();
      setMyJobs(data.jobs || []);
    } catch (err) {
      console.error('Fetch my jobs error:', err);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => { if (user) fetchMyJobs(); }, [fetchMyJobs, user]);

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy tin tuyển dụng này?')) return;
    try {
      await jobsAPI.deleteJob(id);
      fetchMyJobs();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi hủy tin');
    }
  };

  // Stats computed from jobs
  const totalViews = myJobs.reduce((sum, j) => sum + (j.views || 0), 0);
  const totalApplications = myJobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0);
  const openJobs = myJobs.filter(j => j.status === 'open').length;

  const statsCards = [
    { id: 'all', icon: 'format_list_bulleted', label: 'Tất cả tin', value: myJobs.length, iconBg: 'bg-gray-100', iconColor: 'text-gray-600' },
    { id: 'open', icon: 'work', label: t('employer.stats.activeJobs'), value: openJobs, iconBg: 'bg-blue-100', iconColor: 'text-primary' },
    { id: 'pending', icon: 'pending', label: 'Chờ duyệt', value: myJobs.filter(j => j.status === 'pending').length, iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    { id: 'applications', icon: 'people', label: t('employer.stats.totalApplications'), value: totalApplications, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  ];

  const filteredJobs = myJobs.filter(j => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'applications') return j.applicantCount > 0;
    return j.status === filterStatus;
  });

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-primary font-bold text-2xl tracking-tighter flex items-center gap-1">
                Ho<span className="bg-primary text-white px-1 rounded-sm">pe</span>
                <span className="text-sm font-normal text-gray-500 ml-2 tracking-normal self-end mb-1">Talent Solutions</span>
              </Link>
              <div className="hidden md:flex md:space-x-6">
                {['Dashboard', t('nav.jobs'), 'Ứng viên'].map((item, i) => (
                  <a key={item} href="#" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${i === 0 ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{item}</a>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <LanguageSwitcher variant="compact" />
              <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100"><span className="material-icons">notifications</span></button>
              <button
                onClick={() => setPostModal(true)}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-1.5 rounded-full font-medium text-sm transition-colors flex items-center gap-2"
              >
                <span className="material-icons text-sm">add</span>{t('employer.postJob')}
              </button>
              {/* Avatar + Logout */}
              <div className="relative group cursor-pointer">
                {user?.avatar
                  ? <img alt="Avatar" className="h-8 w-8 rounded-full border border-gray-300 object-cover" src={user.avatar} />
                  : <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center"><span className="material-icons text-primary text-sm">person</span></div>
                }
                <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border border-gray-200 py-1 w-36 hidden group-hover:block z-50">
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">Đăng xuất</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Xin chào, {user?.name?.split(' ')[0] || 'Nhà tuyển dụng'}! 👋</h1>
            <p className="mt-1 text-sm text-gray-500">{t('employer.subtitle')}</p>
          </div>
          <button onClick={() => setPostModal(true)} className="bg-primary text-white font-semibold px-5 py-2 rounded-full text-sm hover:bg-primary-dark flex items-center gap-2 shadow-sm">
            <span className="material-icons text-sm">add_circle</span>Đăng tin mới
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statsCards.map((stat) => (
            <StatCard
              key={stat.label}
              {...stat}
              loading={loadingJobs}
              onClick={!stat.noFilter ? () => setFilterStatus(stat.id) : undefined}
              isActive={filterStatus === stat.id}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Postings Table */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">{t('employer.postings.title')}</h3>
                <button onClick={fetchMyJobs} className="text-sm text-primary hover:underline flex items-center gap-1">
                  <span className="material-icons text-sm">refresh</span>Làm mới
                </button>
              </div>
              {loadingJobs ? (
                <div className="divide-y divide-gray-200">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="px-6 py-5 animate-pulse flex gap-4">
                      <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /><div className="h-3 bg-gray-200 rounded w-1/3" /></div>
                    </div>
                  ))}
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <span className="material-icons text-4xl text-gray-300 mb-3 block">work_outline</span>
                  <p className="text-gray-500 font-medium">Chưa có tin tuyển dụng nào thuộc trạng thái này</p>
                  <p className="text-sm text-gray-400 mt-1 mb-4">Bạn có thể đổi bộ lọc hoặc đăng tin mới</p>
                  <button onClick={() => { setFilterStatus('all'); setPostModal(true); }} className="px-6 py-2 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-dark">Đăng tin ngay</button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredJobs.map(job => (
                    <li key={job._id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-primary hover:underline cursor-pointer truncate">{job.title}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${job.status === 'open' ? 'bg-green-100 text-green-700' :
                              job.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                job.status === 'closed' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-500'
                              }`}>{job.status}</span>
                            {job.isFlagged && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">⚠ Flagged</span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{job.workType} · {new Date(job.createdAt).toLocaleDateString('vi-VN')}</p>
                          {job.niche?.length > 0 && (
                            <div className="flex gap-1 mt-1.5">
                              {job.niche.slice(0, 3).map(n => <span key={n} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">{n}</span>)}
                            </div>
                          )}
                          <div className="mt-3 flex gap-4">
                            <div className="flex items-center gap-1 text-xs">
                              <span className="material-icons text-sm text-blue-500">visibility</span>
                              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{job.views || 0}</span>
                              <span className="text-gray-500">{t('employer.postings.views')}</span>
                            </div>
                            <button
                              onClick={() => setAppModal(job)}
                              className="flex items-center gap-1 text-xs hover:text-primary transition-colors"
                            >
                              <span className="material-icons text-sm text-green-500">people</span>
                              <span className="font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">{job.applicantCount || 0}</span>
                              <span className="text-gray-500">{t('employer.postings.applicants')}</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {job.status === 'pending' && (
                            <button
                              onClick={() => handleDeleteJob(job._id)}
                              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium bg-red-50 px-2 py-1 rounded"
                              title="Hủy tin này"
                            >
                              <span className="material-icons text-sm">delete</span>
                              Hủy
                            </button>
                          )}
                          <button className="text-gray-400 hover:text-gray-600"><span className="material-icons">more_horiz</span></button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Profile card */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                {user?.avatar
                  ? <img alt="Avatar" className="h-12 w-12 rounded-full object-cover border border-gray-200" src={user.avatar} />
                  : <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center"><span className="material-icons text-primary">business</span></div>
                }
                <div>
                  <p className="font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.company || user?.role || 'Khách hàng'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tin đã đăng</span>
                  <span className="font-semibold text-primary">{myJobs.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Đang mở</span>
                  <span className="font-semibold text-green-600">{openJobs}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tổng ứng viên</span>
                  <span className="font-semibold">{totalApplications}</span>
                </div>
              </div>
            </div>

            {/* Insights card */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">{t('employer.insights.title')}</h4>
                <span className="material-icons text-gray-400 text-sm">info</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{t('employer.insights.desc')}</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="material-icons text-primary text-sm">trending_up</span>
                  Video editing tăng 40% nhu cầu
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="material-icons text-green-500 text-sm">check_circle</span>
                  Reels/Shorts đang hot nhất
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="material-icons text-amber-500 text-sm">star</span>
                  Freelancer top-rated phản hồi nhanh hơn
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {postModal && <PostJobModal onClose={() => setPostModal(false)} onSuccess={fetchMyJobs} />}
      {appModal && <ApplicationsModal job={appModal} onClose={() => setAppModal(null)} />}
    </div>
  );
}
