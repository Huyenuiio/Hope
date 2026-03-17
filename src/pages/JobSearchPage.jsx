import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { jobsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ApplyModal from '../components/ApplyModal';

const NICHES = ['Talking Head', 'Vlog', 'Real Estate', 'Reels/Shorts', 'YouTube', 'Documentary', 'Ads/Commercial'];
const WORK_TYPES = ['remote', 'hybrid', 'on-site'];
const BUDGET_TYPES = ['fixed', 'hourly', 'monthly'];

const getTypeIcon = (type) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('event')) return 'festival';
  if (t.includes('freelance')) return 'work';
  if (t.includes('full')) return 'business_center';
  if (t.includes('part')) return 'schedule';
  return 'sell';
};

const getNicheIcon = (niche) => {
  const nicheStr = Array.isArray(niche) ? niche[0] : niche;
  const n = nicheStr?.toLowerCase() || '';
  if (n.includes('video') || n.includes('media')) return 'movie';
  if (n.includes('thiết kế') || n.includes('design')) return 'palette';
  if (n.includes('lập trình') || n.includes('dev') || n.includes('it')) return 'code';
  if (n.includes('marketing')) return 'campaign';
  if (n.includes('esports') || n.includes('thể thao điện tử')) return 'sports_esports';
  if (n.includes('viết') || n.includes('writing') || n.includes('nội dung')) return 'edit_note';
  if (n.includes('tài chính') || n.includes('kế toán') || n.includes('finance')) return 'account_balance_wallet';
  if (n.includes('giáo dục') || n.includes('gia sư') || n.includes('education')) return 'school';
  if (n.includes('bán hàng') || n.includes('kinh doanh') || n.includes('sales')) return 'trending_up';
  if (n.includes('y tế') || n.includes('sức khỏe') || n.includes('health')) return 'medical_services';
  if (n.includes('làm đẹp') || n.includes('thời trang') || n.includes('beauty')) return 'face';
  if (n.includes('nhiếp ảnh') || n.includes('photography') || n.includes('film')) return 'photo_camera';
  if (n.includes('dịch') || n.includes('translation')) return 'translate';
  if (n.includes('sự kiện') || n.includes('ẩm thực') || n.includes('event')) return 'festival';
  if (n.includes('trợ lý ảo') || n.includes('va') || n.includes('admin')) return 'support_agent';
  if (n.includes('pháp lý') || n.includes('tư vấn') || n.includes('legal')) return 'gavel';
  return 'category';
};

function JobCard({ job, isSelected, onSelect }) {
  const { t } = useTranslation();
  const hasApplied = job.hasApplied;

  return (
    <li
      className={`px-4 py-4 hover:bg-blue-50 cursor-pointer border-l-4 transition-colors ${isSelected ? 'bg-blue-50 border-l-primary' : 'border-l-transparent border-b border-gray-200'}`}
      onClick={() => onSelect(job)}
    >
      <div className="flex items-start gap-3">
        {/* Client avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
          {job.client?.avatar
            ? <img alt={job.client?.name} src={job.client.avatar} className="w-full h-full object-cover" />
            : <span className="material-icons text-primary text-lg">business</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-primary hover:underline truncate">{job.title}</h3>
          <p className="text-xs text-gray-700">{job.client?.name || job.client?.company || 'Khách hàng'}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {job.workType === 'remote' ? '🌐 Remote' : job.workType === 'hybrid' ? '🏢 Hybrid' : '📍 ' + (job.location || 'On-site')}
            {job.budget?.min && ` · ${job.budget.type === 'hourly' ? '💰' : '💵'} ${job.budget.min.toLocaleString()}${job.budget.max ? '–' + job.budget.max.toLocaleString() : '+'} ${job.budget.currency || 'VND'}`}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {(job.niche || []).slice(0, 2).map(n => (
              <span key={n} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <span className="material-icons text-[12px]">{getNicheIcon(n)}</span>
                {n}
              </span>
            ))}
            {job.type && (
              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <span className="material-icons text-[12px]">{getTypeIcon(job.type)}</span>
                {job.type}
              </span>
            )}
            {job.hasApplied && (
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">✓ Đã ứng tuyển</span>
            )}
            {job.isSaved && (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">🔖 Đã lưu</span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {new Date(job.createdAt).toLocaleDateString('vi-VN')} · {job.applicantCount || 0} ứng viên
          </p>
        </div>
      </div>
    </li>
  );
}


export default function JobSearchPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isFreelancer } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [applyModal, setApplyModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    niche: '',
    workType: '',
    budgetType: '',
    budgetMin: '',
    budgetMax: '',
    sort: '-createdAt',
  });
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...filters };
      // Remove empty filters
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      let { data } = await jobsAPI.getJobs(params);

      // If showing saved only, filter the results locally (since savedJobs is populated on user)
      // Alternatively you can do this from backend, but since we map `isSaved` boolean, we can just array.filter
      let validJobs = data.jobs || [];
      if (showSavedOnly) validJobs = validJobs.filter(j => j.isSaved);

      setJobs(validJobs);
      setTotal(showSavedOnly ? validJobs.length : data.total || 0);
      if (validJobs.length > 0 && !selectedJob) setSelectedJob(validJobs[0]);
    } catch (err) {
      console.error('Fetch jobs error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters, showSavedOnly]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleApplySuccess = () => {
    setSelectedJob(prev => ({ ...prev, hasApplied: true }));
    fetchJobs();
  };

  const handleToggleSave = async () => {
    if (!isAuthenticated) return navigate('/');
    try {
      const res = await jobsAPI.toggleSavedJob(selectedJob._id);
      if (res.data.success) {
        setSelectedJob(prev => ({ ...prev, isSaved: res.data.isSaved }));
        fetchJobs(); // Update the list
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-100 font-sans h-screen flex flex-col overflow-hidden">
      <Navbar activeNav="jobs" search={filters.search} onSearchChange={e => handleFilterChange('search', e.target.value)} showSearch={true} />

      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
          <select
            className="text-xs border border-gray-300 rounded-full px-3 py-1.5 text-gray-600 focus:ring-1 focus:ring-primary bg-white cursor-pointer"
            value={filters.niche}
            onChange={e => handleFilterChange('niche', e.target.value)}
          >
            <option value="">🎯 {t('jobSearch.filters.experienceLevel')}</option>
            {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select
            className="text-xs border border-gray-300 rounded-full px-3 py-1.5 text-gray-600 focus:ring-1 focus:ring-primary bg-white cursor-pointer"
            value={filters.workType}
            onChange={e => handleFilterChange('workType', e.target.value)}
          >
            <option value="">🏢 {t('jobSearch.filters.jobType')}</option>
            {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select
            className="text-xs border border-gray-300 rounded-full px-3 py-1.5 text-gray-600 focus:ring-1 focus:ring-primary bg-white cursor-pointer"
            value={filters.budgetType}
            onChange={e => handleFilterChange('budgetType', e.target.value)}
          >
            <option value="">💰 Loại ngân sách</option>
            {BUDGET_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select
            className="text-xs border border-gray-300 rounded-full px-3 py-1.5 text-gray-600 focus:ring-1 focus:ring-primary bg-white cursor-pointer"
            value={filters.sort}
            onChange={e => handleFilterChange('sort', e.target.value)}
          >
            <option value="-createdAt">⏰ Mới nhất</option>
            <option value="-applicantCount">🔥 Nhiều ứng viên</option>
            <option value="-views">👁 Nhiều lượt xem</option>
          </select>

          <button
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${showSavedOnly ? 'bg-blue-100 border-blue-200 text-blue-700 font-semibold' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            🔖 Việc đã lưu
          </button>

          {(filters.niche || filters.workType || filters.budgetType || showSavedOnly) && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, niche: '', workType: '', budgetType: '' }))}
              className="text-xs text-red-500 hover:underline"
            >
              ✕ Xóa filter
            </button>
          )}
          <span className="text-xs text-gray-400 ml-auto">{total} công việc</span>
        </div>
      </div>

      {/* Main 2-col */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex gap-0">
          {/* Left: Job List */}
          <div className="w-full md:w-[380px] flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto h-full">
            {loading ? (
              <div className="flex flex-col gap-4 p-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2 bg-gray-200 rounded w-1/2" />
                      <div className="h-2 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <span className="material-icons text-4xl text-gray-300 mb-3">work_off</span>
                <p className="text-gray-500 font-medium">Không tìm thấy công việc phù hợp</p>
                <p className="text-xs text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            ) : (
              <ul>
                {jobs.map(job => (
                  <JobCard key={job._id} job={job} isSelected={selectedJob?._id === job._id} onSelect={setSelectedJob} />
                ))}
              </ul>
            )}
          </div>

          {/* Right: Job Detail */}
          <div className="hidden md:flex flex-1 flex-col overflow-y-auto h-full bg-white">
            {selectedJob ? (
              <div className="p-6 max-w-2xl">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0">
                    {selectedJob.client?.avatar
                      ? <img alt={selectedJob.client?.name} src={selectedJob.client.avatar} className="w-full h-full object-cover" />
                      : <span className="material-icons text-primary text-2xl">business</span>
                    }
                  </div>
                  <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900">{selectedJob.title}</h1>
                    <p className="text-gray-600 mt-0.5">{selectedJob.client?.name || selectedJob.client?.company || 'Khách hàng'}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                      {selectedJob.workType && <span className="flex items-center gap-1"><span className="material-icons text-xs">place</span>{selectedJob.workType}</span>}
                      {selectedJob.budget?.min && (
                        <span className="flex items-center gap-1">
                          <span className="material-icons text-xs">payments</span>
                          {selectedJob.budget.min.toLocaleString()}
                          {selectedJob.budget.max ? `–${selectedJob.budget.max.toLocaleString()}` : '+'}
                          {' '}{selectedJob.budget.currency || 'VND'}/{selectedJob.budget.type || 'dự án'}
                        </span>
                      )}
                      <span className="flex items-center gap-1"><span className="material-icons text-xs">group</span>{selectedJob.applicantCount || 0} ứng viên</span>
                      <span className="flex items-center gap-1"><span className="material-icons text-xs">schedule</span>{new Date(selectedJob.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mb-6">
                  {selectedJob.hasApplied ? (
                    <button disabled className="flex-1 bg-green-100 text-green-700 font-semibold py-2.5 rounded-full text-sm flex items-center justify-center gap-2">
                      <span className="material-icons text-sm">check_circle</span>Đã ứng tuyển
                    </button>
                  ) : isAuthenticated && isFreelancer ? (
                    <button
                      onClick={() => setApplyModal(true)}
                      className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-full text-sm hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-icons text-sm">send</span>{t('jobSearch.detail.apply')}
                    </button>
                  ) : !isAuthenticated ? (
                    <button
                      onClick={() => navigate('/')}
                      className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-full text-sm hover:bg-primary-dark transition-colors"
                    >
                      Đăng nhập để ứng tuyển
                    </button>
                  ) : null}
                  <button onClick={handleToggleSave} className={`px-4 py-2.5 border border-gray-300 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${selectedJob.isSaved ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <span className="material-icons text-sm">{selectedJob.isSaved ? 'bookmark' : 'bookmark_border'}</span>
                    {selectedJob.isSaved ? 'Đã lưu' : 'Lưu'}
                  </button>
                </div>

                {/* Niche & Type Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedJob.type && (
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                      <span className="material-icons text-sm">{getTypeIcon(selectedJob.type)}</span>
                      {selectedJob.type}
                    </span>
                  )}
                  {selectedJob.niche?.map(n => (
                    <span key={n} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                      <span className="material-icons text-sm">{getNicheIcon(n)}</span>
                      {n}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <div className="prose prose-sm max-w-none text-gray-700">
                  <h2 className="text-base font-semibold text-gray-900 mb-2">Mô tả công việc</h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedJob.description}</p>
                </div>

                {/* Skills */}
                {selectedJob.requiredSkills?.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-3">Kỹ năng yêu cầu</h2>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.requiredSkills.map(s => (
                        <span key={s} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Client info */}
                {selectedJob.client && (
                  <div className="mt-6 p-5 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl border border-gray-200">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="material-icons text-primary text-base">verified_user</span>
                      Thông tin khách hàng
                    </h2>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {selectedJob.client.avatar
                          ? <img alt={selectedJob.client.name} src={selectedJob.client.avatar} className="w-full h-full object-cover" />
                          : <span className="material-icons text-primary text-2xl">person</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-gray-900 truncate">{selectedJob.client.name || selectedJob.client.company}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          {selectedJob.client.rating > 0 && (
                            <span className="text-xs font-semibold text-amber-600 flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded">
                              ⭐ {selectedJob.client.rating.toFixed(1)}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <span className="material-icons text-[14px]">work_history</span>
                            {selectedJob.client.postedJobsCount || 0} tin tuyển dụng
                          </span>
                          {selectedJob.client.location && (
                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                              <span className="material-icons text-[14px]">location_on</span>
                              {selectedJob.client.location}
                            </span>
                          )}
                          {selectedJob.client.industry && (
                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                              <span className="material-icons text-[14px]">business</span>
                              {selectedJob.client.industry}
                            </span>
                          )}
                        </div>
                        {selectedJob.client.companySize && (
                          <p className="text-xs text-gray-400 mt-2 italic">Quy mô: {selectedJob.client.companySize} nhân viên</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="material-icons text-5xl mb-3">work_outline</span>
                <p>Chọn một công việc để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {applyModal && selectedJob && (
        <ApplyModal job={selectedJob} onClose={() => setApplyModal(false)} onSuccess={handleApplySuccess} />
      )}
    </div>
  );
}
