import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import ApplyModal from './ApplyModal';

const JobDetailModal = ({ isOpen, onClose, jobId }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && jobId) {
      setLoading(true);
      jobsAPI.getJob(jobId)
        .then(res => setJob(res.data.job))
        .catch(err => console.error('Fetch job error:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, jobId]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <span className="material-icons">work_outline</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 leading-tight">Chi tiết công việc</h3>
              <p className="text-xs text-gray-500">Xem thông tin và ứng tuyển trực tiếp</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-600 p-2 rounded-full shadow-sm transition-all">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
              <p className="text-gray-400 font-medium animate-pulse">Đang tải thông tin...</p>
            </div>
          ) : job ? (
            <div className="space-y-8">
              {/* Hero Section */}
              <div className="bg-gradient-to-br from-primary/5 to-transparent p-6 rounded-3xl border border-primary/10">
                <h2 className="text-2xl font-black text-gray-900 mb-2">{job.title}</h2>
                <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <span className="material-icons text-primary text-lg">business</span>
                    {job.company || job.client?.company || 'Nhà tuyển dụng Hope'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-icons text-primary text-lg">location_on</span>
                    {job.workType ? (job.workType.charAt(0).toUpperCase() + job.workType.slice(1)) : 'Chưa rõ'}
                    {job.client?.location && <span className="text-gray-400">({job.client.location})</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-green-600 font-bold">
                    <span className="material-icons text-lg">payments</span>
                    {job.budget?.min && job.budget?.max
                      ? `${job.budget.min.toLocaleString()} - ${job.budget.max.toLocaleString()} ${job.budget.currency || 'VND'}`
                      : 'Thỏa thuận'}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {job.type && (
                  <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-icons text-sm">{getTypeIcon(job.type)}</span>
                    {job.type}
                  </span>
                )}
                {job.niche && (Array.isArray(job.niche) ? job.niche : [job.niche]).map(n => (
                  <span key={n} className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-icons text-sm">{getNicheIcon(n)}</span>
                    {n}
                  </span>
                ))}
                {job.skills?.map(skill => (
                  <span key={skill} className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-xs font-semibold">{skill}</span>
                ))}
              </div>

              {/* Description */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="material-icons text-primary">description</span>
                  <h4 className="font-bold text-gray-900">Mô tả công việc</h4>
                </div>
                <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                  {job.description}
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="material-icons text-primary">checklist</span>
                  <h4 className="font-bold text-gray-900">Yêu cầu ứng viên</h4>
                </div>
                <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                  {job.requirements || 'Vui lòng trao đổi trực tiếp để biết thêm chi tiết.'}
                </div>
              </div>

              {/* Recruiter Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="material-icons text-primary">person_outline</span>
                  <h4 className="font-bold text-gray-900">Thông tin nhà tuyển dụng</h4>
                </div>
                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      {job.client?.avatar ? (
                        <img src={job.client.avatar} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" alt={job.client.name} />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-white shadow-sm">
                          <span className="material-icons text-primary text-3xl">person</span>
                        </div>
                      )}
                      {job.client?.isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-lg">
                          <span className="material-icons text-[12px]">verified</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-gray-900 text-lg flex items-center gap-2 truncate">
                        {job.client?.name}
                        {job.client?.verificationBadge && job.client.verificationBadge !== 'none' && (
                          <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ring-1 ring-primary/20">
                            {job.client.verificationBadge}
                          </span>
                        )}
                      </h5>
                      <p className="text-sm text-gray-600 font-bold">{job.client?.company || 'Nhà tuyển dụng Hope'}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <span className="material-icons text-yellow-400 text-sm">star</span>
                          <span className="font-bold text-gray-700">{job.client?.rating || '0'}</span>
                          <span>({job.client?.totalReviews || 0} đánh giá)</span>
                        </div>
                        <span className="text-gray-300">|</span>
                        <span className="font-medium">{job.client?.industry || 'Đa ngành'}</span>
                      </div>
                    </div>
                  </div>

                  {job.client?.bio && (
                    <div className="text-xs text-gray-500 leading-relaxed italic border-l-4 border-primary/20 pl-4 py-1">
                      "{job.client.bio}"
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-4 text-[11px]">
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-2 shadow-sm">
                      <div className="w-7 h-7 bg-primary/5 rounded-lg flex items-center justify-center">
                        <span className="material-icons text-primary text-lg">groups</span>
                      </div>
                      <div>
                        <p className="text-gray-400 font-bold text-[9px] uppercase tracking-wide">Quy mô</p>
                        <p className="font-bold text-gray-700">{job.client?.companySize || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-2 shadow-sm">
                      <div className="w-7 h-7 bg-primary/5 rounded-lg flex items-center justify-center">
                        <span className="material-icons text-primary text-lg">public</span>
                      </div>
                      <div>
                        <p className="text-gray-400 font-bold text-[9px] uppercase tracking-wide">Vị trí</p>
                        <p className="font-bold text-gray-700 truncate">{job.client?.location || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/profile/${job.client?._id}`}
                    className="block w-full text-center py-2.5 bg-white border border-gray-200 rounded-2xl text-primary font-black text-sm hover:bg-gray-50 transition-all mt-4 hover:border-primary/40"
                  >
                    Xem hồ sơ chi tiết
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <span className="material-icons text-5xl text-gray-200 mb-4">error_outline</span>
              <p>Không tìm thấy thông tin công việc</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 bg-white flex items-center justify-between">
          <div className="hidden sm:block">
            <p className="text-[10px] text-gray-400">Ứng tuyển trực tiếp để kết nối với nhà tuyển dụng</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all flex-1 sm:flex-none"
            >
              Đóng
            </button>
            <button
              disabled={!job}
              onClick={() => setApplyModalOpen(true)}
              className="px-10 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex-1 sm:flex-none flex items-center justify-center gap-2"
            >
              <span className="material-icons text-sm">send</span> Ứng tuyển ngay
            </button>
          </div>
        </div>
      </div>

      {applyModalOpen && job && (
        <ApplyModal
          job={job}
          onClose={() => setApplyModalOpen(false)}
          onSuccess={() => {
            setApplyModalOpen(false);
            alert('Ứng tuyển thành công!');
          }}
        />
      )}
    </div>
  );
};

export default JobDetailModal;
