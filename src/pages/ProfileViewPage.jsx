import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usersAPI, reviewsAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function ProfileViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isUserOnline } = useSocket();
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', jobId: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewableJobs, setReviewableJobs] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await usersAPI.getProfile(id);
        setProfile({
          ...data.user,
          isBlockedByMe: data.isBlockedByMe,
          hasBlockedMe: data.hasBlockedMe,
        });
        setReviews(data.reviews || []);
        setCanReview(data.canReview || false);
        setReviewableJobs(data.reviewableJobs || []);
        if (data.reviewableJobs?.length === 1) {
          setReviewForm(p => ({ ...p, jobId: data.reviewableJobs[0]._id }));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải hồ sơ người dùng.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 p-4">
        <span className="material-icons text-6xl text-gray-300 mb-4">person_off</span>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy hồ sơ</h2>
        <p className="text-gray-500 mb-6">{error || 'Người dùng này không tồn tại hoặc đã bị xóa.'}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-primary text-white font-medium rounded-full shadow-md hover:bg-primary-dark transition-colors">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* ── BANNER & HEADER ── */}
      <div className="h-48 bg-gradient-to-r from-primary to-blue-400 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 flex items-center gap-2 bg-black/20 hover:bg-black/40 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-all text-sm font-semibold"
        >
          <span className="material-icons text-sm">arrow_back</span> Quay lại
        </button>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        {/* Block Overlay (if applicable) */}
        {(profile.isBlockedByMe || profile.hasBlockedMe) && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl text-center">
              <span className="material-icons text-6xl text-gray-300 mb-4">block</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {profile.isBlockedByMe ? "Bạn đã chặn người dùng này" : "Nội dung không khả dụng"}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {profile.isBlockedByMe 
                  ? "Bạn hiện không thể xem hồ sơ hoặc nhắn tin với người này. Vui lòng bỏ chặn trong Cài đặt để tiếp tục tương tác." 
                  : "Bạn không thể xem hồ sơ này do cài đặt quyền riêng tư hoặc chặn."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Quay lại
                </button>
                {profile.isBlockedByMe && (
                  <Link
                    to="/settings"
                    className="flex-1 py-3 text-sm font-bold text-white bg-primary rounded-full hover:bg-primary-dark shadow-md transition-colors inline-block"
                  >
                    Vào Cài đặt
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 relative ${(profile.isBlockedByMe || profile.hasBlockedMe) ? 'opacity-20 pointer-events-none' : ''}`}>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative inline-block">
              {profile.avatar
                ? <img src={profile.avatar} alt={profile.name} className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white" />
                : <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-primary/20 flex items-center justify-center">
                  <span className="material-icons text-primary text-5xl">person</span>
                </div>
              }
              {isUserOnline(profile._id) && (
                <span className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full shadow-sm z-10" title="Đang hoạt động"></span>
              )}
            </div>
            <div className="flex-1 mt-2 md:mt-10">
              <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-lg text-gray-600 font-medium mt-1">
                {profile.headline || profile.role.toUpperCase()}
                {profile.role === 'client' && profile.company && <span className="text-primary ml-2 font-bold block md:inline-block">@ {profile.company}</span>}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-gray-500">
                {profile.location && (
                  <span className="flex items-center gap-1"><span className="material-icons text-lg">location_on</span> {profile.location}</span>
                )}
                {profile.hourlyRate && (
                  <span className="flex items-center gap-1"><span className="material-icons text-lg">payments</span> ${profile.hourlyRate}/giờ</span>
                )}
                {profile.rating > 0 && (
                  <span className="flex items-center gap-1 text-amber-500 font-medium"><span className="material-icons text-lg">star</span> {profile.rating.toFixed(1)} <span className="text-gray-400 text-xs text-normal">({profile.totalReviews || 0})</span></span>
                )}
                {profile.role === 'client' && profile.companySize && (
                  <span className="flex items-center gap-1"><span className="material-icons text-lg">groups</span> {profile.companySize} nhân viên</span>
                )}
              </div>
            </div>

            <div className="w-full md:w-auto mt-6 md:mt-12 flex gap-3">
              {user?.connections?.some(c => (c._id || c) === profile._id) ? (
                <button
                  onClick={async () => {
                    try {
                      await usersAPI.disconnect(profile._id);
                      setUser(prev => ({ ...prev, connections: prev.connections.filter(c => (c._id || c) !== profile._id) }));
                    } catch (e) { }
                  }}
                  className="flex-1 md:flex-none px-6 py-2 border-2 border-gray-300 text-gray-600 font-semibold rounded-full hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-icons">person_remove</span> Hủy kết nối
                </button>
              ) : (requestSent || profile?.connectionRequests?.some(r => r.from === user?._id && r.status === 'pending')) ? (
                <button disabled className="flex-1 md:flex-none px-6 py-2 bg-gray-300 text-gray-600 font-semibold rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-not-allowed">
                  <span className="material-icons">hourglass_empty</span> Đã gửi yêu cầu
                </button>
              ) : (
                <button onClick={async () => {
                  try {
                    await usersAPI.connect(profile._id);
                    setRequestSent(true);
                  } catch (e) { }
                }} className="flex-1 md:flex-none px-6 py-2 bg-primary text-white font-semibold rounded-full shadow-md hover:bg-primary-dark transition-all flex items-center justify-center gap-2">
                  <span className="material-icons">person_add</span> Kết nối
                </button>
              )}
              <button onClick={() => navigate(`/messages?with=${profile._id}`)} className="flex-1 md:flex-none px-6 py-2 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                <span className="material-icons">chat</span> Nhắn tin
              </button>
              {canReview && user?._id !== profile._id && (
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="flex-1 md:flex-none px-6 py-2 bg-amber-500 text-white font-semibold rounded-full shadow-md hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-icons">star</span> Đánh giá
                </button>
              )}
            </div>
          </div>

          {/* Niche & Tags */}
          {profile.niche?.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {profile.niche.map(n => (
                <span key={n} className="px-3 py-1 bg-blue-50 text-primary border border-primary/20 rounded-full text-xs font-semibold">{n}</span>
              ))}
              {profile.subNiche?.map(sn => (
                <span key={sn} className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-semibold">{sn}</span>
              ))}
            </div>
          )}
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 ${(profile.isBlockedByMe || profile.hasBlockedMe) ? 'opacity-20 pointer-events-none' : ''}`}>
          {/* ── LEFT COLUMN: MAIN CONTENT ── */}
          <div className="md:col-span-2 space-y-6">

            {/* ── CLIENT SPECIFIC CONTENT ── */}
            {profile.role === 'client' && profile.clientInfo && (
              <section className="bg-white rounded-2xl shadow-sm border border-primary/20 p-6 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <span className="material-icons" style={{ fontSize: '120px' }}>business</span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="material-icons text-amber-500">campaign</span> Dự án đang tìm kiếm tài năng
                  </h3>
                  <p className="text-gray-500 text-sm">Các mục tiêu và thông tin ngân sách dự kiến của khách hàng.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.clientInfo.problem && (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                      <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-1"><span className="material-icons text-sm">report_problem</span> Vấn đề cần giải quyết</h4>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{profile.clientInfo.problem}</p>
                    </div>
                  )}
                  {profile.clientInfo.expectedResult && (
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-1"><span className="material-icons text-sm">auto_graph</span> Kết quả mong đợi</h4>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{profile.clientInfo.expectedResult}</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 flex flex-wrap gap-x-6 gap-y-4 shadow-inner border border-gray-100">
                  {profile.industry && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lĩnh vực Cty</span>
                      <span className="text-gray-900 font-semibold">{profile.industry}</span>
                    </div>
                  )}
                  {profile.clientInfo.budgetRange && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ngân sách</span>
                      <span className="text-primary font-bold">{profile.clientInfo.budgetRange}</span>
                    </div>
                  )}
                  {profile.clientInfo.duration && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Thời lượng</span>
                      <span className="text-gray-900 font-semibold">{profile.clientInfo.duration}</span>
                    </div>
                  )}
                  {profile.clientInfo.updateFrequency && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cập nhật</span>
                      <span className="text-gray-900 font-semibold capitalize bg-gray-200 px-2 py-0.5 rounded text-xs mt-1 w-fit">{profile.clientInfo.updateFrequency}</span>
                    </div>
                  )}
                  {profile.clientInfo.paymentType && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Trả lương</span>
                      <span className="text-gray-900 font-semibold capitalize bg-gray-200 px-2 py-0.5 rounded text-xs mt-1 w-fit">{profile.clientInfo.paymentType}</span>
                    </div>
                  )}
                </div>

                {profile.clientInfo.meetingWillingness && (
                  <div className="flex justify-center mt-2">
                    <span className="bg-blue-50 text-blue-700 px-4 py-2 border border-blue-200 rounded-full text-sm font-medium flex items-center gap-2">
                      <span className="material-icons">videocam</span> Sẵn sàng họp Video trao đổi trực tiếp
                    </span>
                  </div>
                )}
              </section>
            )}

            {/* ── FREELANCER SPECIFIC CONTENT ── */}
            {profile.role !== 'client' && (
              <>
                {/* Bio / About */}
                {profile.bio && (
                  <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="material-icons text-gray-400">article</span> Giới thiệu
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
                  </section>
                )}

                {/* Value Proposition */}
                {(profile.problemsSolved || profile.workAttitude) && (
                  <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="material-icons text-emerald-500">tips_and_updates</span> Giá trị mang lại & Cam kết
                    </h3>
                    {profile.problemsSolved && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Vấn đề có thể giải quyết</h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{profile.problemsSolved}</p>
                      </div>
                    )}
                    {profile.workAttitude && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Cách tôi làm việc</h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{profile.workAttitude}</p>
                      </div>
                    )}
                  </section>
                )}

                {/* Case Studies */}
                {profile.caseStudies && profile.caseStudies.length > 0 && (
                  <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="material-icons text-amber-500">emoji_events</span> Case Studies nổi bật
                    </h3>
                    <div className="space-y-4">
                      {profile.caseStudies.map((cs, idx) => (
                        <div key={idx} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-bold text-gray-900 text-lg">{cs.title}</h4>
                          {cs.problem && <div className="mt-2 text-sm"><span className="font-semibold text-red-500">Vấn đề:</span> <span className="text-gray-700">{cs.problem}</span></div>}
                          {cs.solution && <div className="mt-1 text-sm"><span className="font-semibold text-blue-500">Giải pháp:</span> <span className="text-gray-700">{cs.solution}</span></div>}
                          {cs.result && <div className="mt-1 text-sm"><span className="font-semibold text-green-500">Kết quả:</span> <span className="text-gray-700">{cs.result}</span></div>}
                          {cs.mediaUrl && <a href={cs.mediaUrl} target="_blank" rel="noreferrer" className="inline-block mt-3 text-sm text-primary hover:underline font-medium">Xem tài liệu đính kèm &rarr;</a>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Career Goals & Mindset */}
                {(profile.careerGoals || profile.coreBeliefs) && (
                  <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="material-icons text-primary">auto_awesome</span> Tầm nhìn & Tư duy
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.careerGoals && (
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                          <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-1"><span className="material-icons text-sm">flag</span> Định hướng sự nghiệp</h4>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">{profile.careerGoals}</p>
                        </div>
                      )}
                      {profile.coreBeliefs && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                          <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1"><span className="material-icons text-sm">self_improvement</span> Triết lý cá nhân</h4>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">{profile.coreBeliefs}</p>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Niche Specific Data Removed */}
              </>
            )}
          </div>

          {/* ── RIGHT COLUMN: SIDEBAR DETAILS ── */}
          <div className="space-y-6">
            {/* Skills & Tools */}
            {(profile.skills?.length > 0 || profile.tools?.length > 0) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4">Năng lực & Công cụ</h3>

                {profile.skills?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Kỹ năng</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map(s => <span key={s} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{s}</span>)}
                    </div>
                  </div>
                )}

                {profile.tools?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Công cụ</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.tools.map(t => <span key={t} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{t}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Info & Equipment */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h3 className="text-base font-bold text-gray-900">Thông tin nhanh</h3>

              {profile.availability && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center gap-2"><span className="material-icons text-base">event_available</span> Trạng thái</span>
                  <span className="font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs capitalize">{profile.availability}</span>
                </div>
              )}

              {profile.languages?.length > 0 && (
                <div className="pt-2 border-t border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Ngôn ngữ</span>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.map((l, i) => (
                      <span key={i} className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded" title={l.certificate}>
                        {l.name}: <span className="text-primary">{l.level}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.englishLevel && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center gap-2"><span className="material-icons text-base">language</span> Tiếng Anh</span>
                  <span className="font-semibold text-gray-900 capitalize">{profile.englishLevel}</span>
                </div>
              )}
              {profile.projectRate && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center gap-2"><span className="material-icons text-base">receipt_long</span> Khoán dự án</span>
                  <span className="font-semibold text-gray-900">{profile.projectRate.toLocaleString()} VND</span>
                </div>
              )}
              {profile.equipment?.software?.length > 0 && (
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Bộ máy (Software)</span>
                  <p className="text-sm font-medium text-gray-800">{profile.equipment.software.join(', ')}</p>
                </div>
              )}
              {profile.equipment?.hardware?.length > 0 && (
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Thiết bị (Hardware)</span>
                  <p className="text-sm font-medium text-gray-800">{profile.equipment.hardware.join(', ')}</p>
                </div>
              )}
            </div>

            {/* Deep Links */}
            {(profile.github || profile.linkedin || profile.website) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex gap-4 justify-center">
                {profile.github && <a href={profile.github} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors"><span className="material-icons text-3xl">code</span></a>}
                {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors"><span className="material-icons text-3xl">business</span></a>}
                {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary transition-colors"><span className="material-icons text-3xl">language</span></a>}
              </div>
            )}

            {/* Reviews Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-amber-500">reviews</span> Nhận xét
                </div>
                {profile.rating > 0 && (
                  <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full text-amber-700 text-sm">
                    <span className="material-icons text-sm">star</span>
                    <span className="font-bold">{profile.rating.toFixed(1)}</span>
                  </div>
                )}
              </h3>

              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((rev, idx) => (
                    <div key={rev._id || idx} className="border-b border-gray-50 last:border-0 pb-6 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <img src={rev.reviewer?.avatar || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full object-cover" alt="" />
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{rev.reviewer?.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`material-icons text-[14px] ${i < rev.rating ? 'text-amber-400' : 'text-gray-200'}`}>star</span>
                              ))}
                              <span className="text-[10px] text-gray-400 ml-2">{new Date(rev.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed italic">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-icons text-4xl text-gray-100 mb-2">rate_review</span>
                  <p className="text-gray-400 text-sm">Chưa có đánh giá nào.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Đánh giá Nhà tuyển dụng</h3>
            <p className="text-sm text-gray-500 mb-6">Trải nghiệm của bạn sẽ giúp những freelancers khác có cái nhìn thực tế hơn.</p>

            <div className="space-y-6">
              {reviewableJobs.length > 1 && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Chọn công việc để đánh giá</label>
                  <select 
                    className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition-all"
                    value={reviewForm.jobId}
                    onChange={e => setReviewForm(p => ({ ...p, jobId: e.target.value }))}
                  >
                    <option value="">-- Chọn công việc --</option>
                    {reviewableJobs.map(j => (
                      <option key={j._id} value={j._id}>{j.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 text-center">Xếp hạng của bạn</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewForm(p => ({ ...p, rating: s }))}
                      className={`material-icons text-4xl transition-all hover:scale-110 ${s <= reviewForm.rating ? 'text-amber-400' : 'text-gray-200'}`}
                    >
                      {s <= reviewForm.rating ? 'star' : 'star_outline'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nhận xét chi tiết</label>
                <textarea
                  rows={4}
                  className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition-all"
                  placeholder="Chia sẻ cảm nghĩ của bạn về môi trường làm việc, giao tiếp..."
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setReviewModalOpen(false)}
                  className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Hủy
                </button>
                <button
                  disabled={submittingReview || !reviewForm.comment.trim()}
                  onClick={async () => {
                    try {
                      setSubmittingReview(true);
                      const { data } = await reviewsAPI.createReview({
                        revieweeId: profile._id,
                        jobId: reviewForm.jobId,
                        overallRating: reviewForm.rating,
                        comment: reviewForm.comment
                      });
                      setReviews(prev => [data.review, ...prev]);
                      setReviewModalOpen(false);
                      setReviewForm({ rating: 5, comment: '' });
                      // Update profile rating slightly locally
                      setProfile(p => ({
                        ...p,
                        totalReviews: (p.totalReviews || 0) + 1,
                        rating: ((p.rating * (p.totalReviews || 0)) + reviewForm.rating) / ((p.totalReviews || 0) + 1)
                      }));
                    } catch (err) {
                      alert(err.response?.data?.message || 'Lỗi khi gửi đánh giá');
                    } finally {
                      setSubmittingReview(false);
                    }
                  }}
                  className="flex-1 py-3 font-bold text-white bg-primary rounded-2xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
