import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { jobsAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ApplyModal from '../components/ApplyModal';
import ReportJobModal from '../components/ReportJobModal';
import { toast } from 'react-hot-toast';

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
              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold whitespace-nowrap flex items-center gap-0.5 shadow-sm">
                <span className="material-icons text-[12px]">bookmark</span>Đã lưu
              </span>
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
  const { isAuthenticated, isFreelancer, user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlJobId = searchParams.get('id');

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
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
  const [showAppliedOnly, setShowAppliedOnly] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');
  const [searchResults, setSearchResults] = useState({ jobs: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);

  const fetchSearchResults = useCallback(async (q) => {
    if (!q) {
      setSearchResults({ jobs: [], users: [] });
      return;
    }
    setIsSearching(true);
    try {
      const [jobsRes, usersRes] = await Promise.all([
        jobsAPI.getJobs({ search: q, limit: 5 }),
        usersAPI.getFreelancers({ search: q, limit: 5 })
      ]);
      setSearchResults({
        jobs: jobsRes.data.jobs || [],
        users: usersRes.data.users || []
      });
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Sync LOCAL input with URL (e.g. on page load)
  useEffect(() => {
    setLocalSearch(searchParams.get('search') || '');
  }, [searchParams]);

  // Debounce: Global Search results & URL Sync
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchSearchResults(localSearch);

      // Update URL search param for consistency with Dashboard (Use a new instance to avoid mutation issues)
      const newParams = new URLSearchParams(searchParams);
      if (localSearch) newParams.set('search', localSearch);
      else newParams.delete('search');

      // ONLY update if it actually changed to prevent infinite loops
      if (newParams.toString() !== searchParams.toString()) {
        setSearchParams(newParams, { replace: true });
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [localSearch, fetchSearchResults, setSearchParams, searchParams]);

  const [reportModalJob, setReportModalJob] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        ...filters,
        appliedOnly: showAppliedOnly,
        savedOnly: showSavedOnly
      };
      // Remove empty filters
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      let { data } = await jobsAPI.getJobs(params);

      setJobs(data.jobs || []);
      setTotal(data.total || 0);

      // Priority: Select job by ID from URL if present
      if (urlJobId) {
        const found = data.jobs?.find(j => j._id === urlJobId);
        if (found) {
          setSelectedJob(found);
        } else {
          // If NOT in the current list, fetch it specifically
          try {
            const res = await jobsAPI.getJob(urlJobId);
            if (res.data && res.data.job) {
              setSelectedJob(res.data.job);
              // Add to list so it appears in the sidebar too
              setJobs(prev => [res.data.job, ...prev.filter(j => j._id !== urlJobId)]);
            }
          } catch (err) {
            console.error('Specific job fetch error:', err);
          }
        }
      } else if (data.jobs?.length > 0 && !selectedJob) {
        setSelectedJob(data.jobs[0]);
      }
    } catch (err) {
      console.error('Fetch jobs error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters, showSavedOnly, showAppliedOnly, urlJobId]);

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
        const newIsSaved = res.data.isSaved;
        setSelectedJob(prev => ({ ...prev, isSaved: newIsSaved }));

        // Update the list immediately for UI feedback
        setJobs(prev => {
          if (showSavedOnly && !newIsSaved) {
            return prev.filter(j => String(j._id) !== String(selectedJob._id));
          }
          return prev.map(j => String(j._id) === String(selectedJob._id) ? { ...j, isSaved: newIsSaved } : j);
        });

        toast.success(newIsSaved ? 'Đã lưu công việc!' : 'Đã bỏ lưu công việc');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái lưu');
    }
  };

  const activeJob = jobs.find(j => j._id === selectedJob?._id) || selectedJob;

  const handleReportSubmit = async ({ reason, description }) => {
    try {
      await jobsAPI.reportJob(activeJob._id, { reason, description });
      toast.success('Báo cáo của bạn đã được gửi!');
      setReportModalJob(null);
    } catch (err) {
      toast.error('Gửi báo cáo thất bại. Vui lòng thử lại.');
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-100 font-sans h-screen flex flex-col overflow-hidden">
      <Navbar
        activeNav="jobs"
        search={localSearch}
        onSearchChange={e => {
          setLocalSearch(e.target.value);
          if (e.target.value.trim().length > 0) {
            setIsSearching(true);
          } else {
            setSearchResults({ jobs: [], users: [] });
            setIsSearching(false);
          }
        }}
        showSearch={true}
        searchResults={searchResults}
        isSearching={isSearching}
      />

      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex-none shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          {/* Niche Filter */}
          <div className="relative group">
            <select
              className={`appearance-none text-xs border rounded-full pl-8 pr-8 py-1.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 ${filters.niche ? 'bg-primary/5 border-primary text-primary font-bold shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}
              value={filters.niche}
              onChange={e => handleFilterChange('niche', e.target.value)}
            >
              <option value="">{t('jobSearch.filters.experienceLevel')}</option>
              {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className={`material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none ${filters.niche ? 'text-primary' : 'text-gray-400'}`}>
              explore
            </span>
            <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors">
              expand_more
            </span>
          </div>

          {/* Work Type Filter */}
          <div className="relative group">
            <select
              className={`appearance-none text-xs border rounded-full pl-8 pr-8 py-1.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 ${filters.workType ? 'bg-primary/5 border-primary text-primary font-bold shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}
              value={filters.workType}
              onChange={e => handleFilterChange('workType', e.target.value)}
            >
              <option value="">{t('jobSearch.filters.jobType')}</option>
              {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <span className={`material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none ${filters.workType ? 'text-primary' : 'text-gray-400'}`}>
              location_on
            </span>
            <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors">
              expand_more
            </span>
          </div>

          {/* Budget Type Filter */}
          <div className="relative group">
            <select
              className={`appearance-none text-xs border rounded-full pl-8 pr-8 py-1.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 ${filters.budgetType ? 'bg-primary/5 border-primary text-primary font-bold shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}
              value={filters.budgetType}
              onChange={e => handleFilterChange('budgetType', e.target.value)}
            >
              <option value="">Loại ngân sách</option>
              {BUDGET_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <span className={`material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none ${filters.budgetType ? 'text-primary' : 'text-gray-400'}`}>
              payments
            </span>
            <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors">
              expand_more
            </span>
          </div>

          <div className="w-[1px] h-6 bg-gray-200 mx-1 hidden sm:block" />

          {/* Toggle Buttons */}
          <button
            onClick={() => { setShowSavedOnly(!showSavedOnly); setShowAppliedOnly(false); }}
            className={`text-xs px-4 py-1.5 rounded-full border transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${showSavedOnly ? 'bg-blue-600 border-blue-600 text-white font-bold' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white'}`}
          >
            <span className={`material-icons text-[16px] ${showSavedOnly ? 'text-white' : 'text-blue-500'}`}>bookmark</span>
            Việc đã lưu
          </button>

          <button
            onClick={() => { setShowAppliedOnly(!showAppliedOnly); setShowSavedOnly(false); }}
            className={`text-xs px-4 py-1.5 rounded-full border transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${showAppliedOnly ? 'bg-green-600 border-green-600 text-white font-bold' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white'}`}
          >
            <span className={`material-icons text-[16px] ${showAppliedOnly ? 'text-white' : 'text-green-500'}`}>assignment_turned_in</span>
            Đã ứng tuyển
          </button>

          {/* Sort Filter - Right side if space allows */}
          <div className="relative group ml-auto flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold hidden lg:block">Sắp xếp:</span>
            <select
              className="appearance-none text-xs border border-gray-200 bg-gray-50 rounded-full pl-8 pr-8 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer hover:border-gray-300 transition-all font-medium"
              value={filters.sort}
              onChange={e => handleFilterChange('sort', e.target.value)}
            >
              <option value="-createdAt">⏰ Mới nhất</option>
              <option value="-applicantCount">🔥 Nhiều ứng viên</option>
              <option value="-views">👁 Nhiều lượt xem</option>
            </select>
            <span className="material-icons absolute left-2.5 lg:left-[60px] top-1/2 -translate-y-1/2 text-[16px] text-gray-400 pointer-events-none">
              sort
            </span>
            <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none group-hover:text-gray-600">
              expand_more
            </span>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            {(filters.niche || filters.workType || filters.budgetType || showSavedOnly || showAppliedOnly || filters.search) && (
              <button
                onClick={() => {
                  setFilters(prev => ({ ...prev, niche: '', workType: '', budgetType: '', search: '', sort: '-createdAt' }));
                  setShowSavedOnly(false);
                  setShowAppliedOnly(false);
                  setPage(1);
                }}
                className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors font-medium border-b border-transparent hover:border-red-200"
              >
                <span className="material-icons text-sm">filter_alt_off</span>
                Xóa tất cả bộ lọc
              </button>
            )}
            <span className="text-[11px] font-bold text-gray-400 ml-auto whitespace-nowrap bg-gray-100 px-2 py-1 rounded">
              {total} <span className="font-medium">công việc</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-col */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex gap-0">
          {/* Left: Job List Sidebar with Local Search */}
          <div className={`${mobileDetailOpen ? 'hidden' : 'flex'} w-full md:w-[380px] md:flex flex-shrink-0 border-r border-gray-200 bg-white flex-col h-full`}>
            {/* Local Sidebar Search */}
            <div className="p-3 border-b border-gray-100 bg-gray-50/50">
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-icons text-gray-400 text-[18px] group-focus-within:text-primary transition-colors">search</span>
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm nhanh công việc..."
                  className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-icons text-sm">cancel</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
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
                <ul className="divide-y divide-gray-100">
                  {jobs.map(job => (
                    <JobCard
                      key={job._id}
                      job={job}
                      isSelected={selectedJob?._id === job._id}
                      onSelect={(j) => { setSelectedJob(j); setMobileDetailOpen(true); }}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right: Job Detail */}
          <div className={`${mobileDetailOpen ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-y-auto h-full bg-white`}>
            {activeJob ? (
              <div className="p-6 max-w-2xl">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0 relative">
                    {/* Mobile Back Button */}
                    <button
                      onClick={() => setMobileDetailOpen(false)}
                      className="md:hidden absolute -top-1 -left-1 bg-white rounded-full shadow-md border border-gray-200 p-1 text-primary z-20"
                    >
                      <span className="material-icons text-xl">arrow_back</span>
                    </button>

                    {activeJob.client?.avatar
                      ? <img alt={activeJob.client?.name} src={activeJob.client.avatar} className="w-full h-full object-cover" />
                      : <span className="material-icons text-primary text-2xl">business</span>
                    }
                  </div>
                  <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900">{activeJob.title}</h1>
                    <p className="text-gray-600 mt-0.5">{activeJob.client?.name || activeJob.client?.company || 'Khách hàng'}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                      {activeJob.workType && <span className="flex items-center gap-1"><span className="material-icons text-xs">place</span>{activeJob.workType}</span>}
                      {activeJob.budget?.min && (
                        <span className="flex items-center gap-1">
                          <span className="material-icons text-xs">payments</span>
                          {activeJob.budget.min.toLocaleString()}
                          {activeJob.budget.max ? `–${activeJob.budget.max.toLocaleString()}` : '+'}
                          {' '}{activeJob.budget.currency || 'VND'}/{activeJob.budget.type || 'dự án'}
                        </span>
                      )}
                      <span className="flex items-center gap-1"><span className="material-icons text-xs">group</span>{activeJob.applicantCount || 0} ứng viên</span>
                      <span className="flex items-center gap-1"><span className="material-icons text-xs">schedule</span>{new Date(activeJob.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mb-6">
                  {activeJob.hasApplied ? (
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
                      onClick={loginWithGoogle}
                      className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-full text-sm hover:bg-primary-dark transition-colors"
                    >
                      Đăng nhập để ứng tuyển
                    </button>
                  ) : null}
                  <button
                    onClick={handleToggleSave}
                    className={`px-4 py-2.5 border rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1 shrink-0 shadow-sm ${activeJob.isSaved
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 bg-white border-gray-300'
                      }`}
                  >
                    <span className="material-icons text-sm">{activeJob.isSaved ? 'bookmark' : 'bookmark_border'}</span>
                    {activeJob.isSaved ? 'Đã lưu' : 'Lưu'}
                  </button>
                  {isAuthenticated && activeJob.client?._id?.toString() !== user?._id?.toString() && (
                    <button onClick={() => setReportModalJob(activeJob)} className="px-3 py-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all flex items-center justify-center group" title="Báo cáo vi phạm">
                      <span className="material-icons group-hover:scale-110 transition-transform">flag</span>
                    </button>
                  )}
                </div>

                {/* Niche & Type Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {activeJob.type && (
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                      <span className="material-icons text-sm">{getTypeIcon(activeJob.type)}</span>
                      {activeJob.type}
                    </span>
                  )}
                  {activeJob.niche?.map(n => (
                    <span key={n} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                      <span className="material-icons text-sm">{getNicheIcon(n)}</span>
                      {n}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <div className="prose prose-sm max-w-none text-gray-700">
                  <h2 className="text-base font-semibold text-gray-900 mb-2">Mô tả công việc</h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{activeJob.description}</p>
                </div>

                {/* Skills */}
                {activeJob.requiredSkills?.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-3">Kỹ năng yêu cầu</h2>
                    <div className="flex flex-wrap gap-2">
                      {activeJob.requiredSkills.map(s => (
                        <span key={s} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Client info */}
                {activeJob.client && (
                  <div className="mt-6 p-5 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl border border-gray-200">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="material-icons text-primary text-base">verified_user</span>
                      Thông tin khách hàng
                    </h2>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {activeJob.client.avatar
                          ? <img alt={activeJob.client.name} src={activeJob.client.avatar} className="w-full h-full object-cover" />
                          : <span className="material-icons text-primary text-2xl">person</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-gray-900 truncate">{activeJob.client.name || activeJob.client.company}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          {activeJob.client.rating > 0 && (
                            <span className="text-xs font-semibold text-amber-600 flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded">
                              ⭐ {activeJob.client.rating.toFixed(1)}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <span className="material-icons text-[14px]">work_history</span>
                            {activeJob.client.postedJobsCount || 0} tin tuyển dụng
                          </span>
                          {activeJob.client.location && (
                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                              <span className="material-icons text-[14px]">location_on</span>
                              {activeJob.client.location}
                            </span>
                          )}
                          {activeJob.client.industry && (
                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                              <span className="material-icons text-[14px]">business</span>
                              {activeJob.client.industry}
                            </span>
                          )}
                        </div>
                        {activeJob.client.companySize && (
                          <p className="text-xs text-gray-400 mt-2 italic">Quy mô: {activeJob.client.companySize} nhân viên</p>
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
      {reportModalJob && (
        <ReportJobModal job={reportModalJob} onClose={() => setReportModalJob(null)} onSubmit={handleReportSubmit} />
      )}
    </div>
  );
}
