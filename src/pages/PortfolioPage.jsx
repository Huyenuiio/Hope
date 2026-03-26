import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { portfolioAPI, reviewsAPI } from '../services/api';

function StarRating({ rating, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`material-icons text-sm ${i < Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}>star</span>
      ))}
    </div>
  );
}

function AddPortfolioModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '', description: '', mediaUrl: '', mediaType: 'video',
    platform: 'YouTube', tags: '',
    caseStudy: { problem: '', solution: '', result: '', metrics: { viewsGained: '', subscribersGained: '', revenueGenerated: '' } },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const setCaseStudy = (key, val) => setForm(p => ({ ...p, caseStudy: { ...p.caseStudy, [key]: val } }));
  const setMetric = (key, val) => setForm(p => ({ ...p, caseStudy: { ...p.caseStudy, metrics: { ...p.caseStudy.metrics, [key]: val } } }));

  const handleSubmit = async () => {
    if (!form.title || !form.mediaUrl) { setError('Cần có tiêu đề và link media'); return; }
    setLoading(true); setError('');
    try {
      await portfolioAPI.createItem({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        caseStudy: {
          ...form.caseStudy,
          metrics: {
            viewsGained: parseInt(form.caseStudy.metrics.viewsGained) || 0,
            subscribersGained: parseInt(form.caseStudy.metrics.subscribersGained) || 0,
            revenueGenerated: parseFloat(form.caseStudy.metrics.revenueGenerated) || 0,
          }
        }
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <h2 className="font-bold text-base md:text-lg text-gray-900">Thêm mục portfolio</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><span className="material-icons text-gray-400">close</span></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">Tiêu đề *</label>
              <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Vd: Kênh review tech 1M views" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">Nền tảng</label>
              <select value={form.platform} onChange={e => set('platform', e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207L10%2012L15%207%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat">
                {['YouTube', 'TikTok', 'Instagram', 'Facebook', 'Other'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">Link video / Portfolio *</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400 material-icons text-sm">link</span>
              <input type="url" value={form.mediaUrl} onChange={e => set('mediaUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full border border-gray-200 rounded-xl p-3 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">Mô tả dự án</label>
            <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Mô tả ngắn về vai trò và nhiệm vụ của bạn..." className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm resize-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">Kỹ năng (phân cách bằng dấu phẩy)</label>
            <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="talking head, color grading, motion graphics..." className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm" />
          </div>

          <div className="bg-gray-50/50 p-4 md:p-5 rounded-2xl border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-icons text-amber-500">analytics</span> Case Study (Khuyên dùng)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Vấn đề ban đầu</label>
                <textarea rows={2} value={form.caseStudy.problem} onChange={e => setCaseStudy('problem', e.target.value)} placeholder="🔴 Vd: Channel niche nhưng CTR thấp 1.2%..." className="w-full border border-gray-200 rounded-xl p-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Giải pháp</label>
                <textarea rows={2} value={form.caseStudy.solution} onChange={e => setCaseStudy('solution', e.target.value)} placeholder="💡 Vd: Thiết kế lại thumbnail, hook 5 giây lôi cuốn..." className="w-full border border-gray-200 rounded-xl p-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Kết quả đạt được</label>
                <textarea rows={2} value={form.caseStudy.result} onChange={e => setCaseStudy('result', e.target.value)} placeholder="✅ Vd: CTR tăng lên 8%, views x10 trong 2 tháng..." className="w-full border border-gray-200 rounded-xl p-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">👁 Views tăng</label>
                  <input type="number" value={form.caseStudy.metrics.viewsGained} onChange={e => setMetric('viewsGained', e.target.value)} placeholder="500000" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">👥 Sub tăng</label>
                  <input type="number" value={form.caseStudy.metrics.subscribersGained} onChange={e => setMetric('subscribersGained', e.target.value)} placeholder="10000" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">💰 Doanh thu ($)</label>
                  <input type="number" value={form.caseStudy.metrics.revenueGenerated} onChange={e => setMetric('revenueGenerated', e.target.value)} placeholder="1000" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2 animate-shake"><span className="material-icons text-sm">error</span>{error}</p>}
        </div>
        <div className="p-4 md:p-5 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-gray-50/50">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 bg-white rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all">Hủy</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2">
            {loading ? <span className="material-icons animate-spin text-sm">refresh</span> : <span>+ Thêm mới</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { userId: paramId } = useParams();
  const { user } = useAuth();
  const targetId = paramId || user?._id;
  const isOwner = !paramId || paramId === user?._id;

  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const [portRes, revRes] = await Promise.allSettled([
        portfolioAPI.getPortfolio(targetId),
        reviewsAPI.getReviews(targetId),
      ]);
      if (portRes.status === 'fulfilled') {
        setItems(portRes.value.data.items || []);
        setProfileUser(portRes.value.data.user || null);
      }
      if (revRes.status === 'fulfilled') setReviews(revRes.value.data.reviews || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [targetId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa mục này?')) return;
    try {
      await portfolioAPI.deleteItem(id);
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (err) { alert('Không thể xóa'); }
  };

  const displayUser = profileUser || user;
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + (r.overallRating || 0), 0) / reviews.length : 0;

  // Embed helper for YouTube
  const getYouTubeEmbed = (url) => {
    const match = url?.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([^&?\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to={user?.role === 'client' ? '/employer' : (user?.role === 'freelancer' ? '/dashboard' : '/')}
            className="flex items-center gap-1"
          >
            <span className="text-primary font-bold text-xl">Ho</span>
            <span className="bg-primary text-white rounded px-1 font-bold text-sm">pe</span>
          </Link>
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                <Link to="/profile/edit" className="text-xs sm:text-sm font-semibold text-primary border border-primary px-3 sm:px-4 py-1.5 rounded-full hover:bg-primary/5 transition-all active:scale-95">
                  <span className="md:hidden"><span className="material-icons text-sm">edit</span></span>
                  <span className="hidden md:inline">Chỉnh sửa hồ sơ</span>
                </Link>
                <button onClick={() => setAddModal(true)} className="text-xs sm:text-sm font-semibold bg-primary text-white px-3 sm:px-4 py-1.5 rounded-full hover:bg-primary-dark transition-all flex items-center gap-1 active:scale-95 shadow-md shadow-primary/20">
                  <span className="material-icons text-sm">add</span>
                  <span className="hidden sm:inline">Thêm portfolio</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Hero */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-primary/80 to-blue-600" />
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10 sm:-mt-12 mb-6 sm:mb-8 text-center sm:text-left">
              <div className="relative group">
                {displayUser?.avatar
                  ? <img src={displayUser.avatar} alt={displayUser?.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white object-cover shadow-xl bg-white" />
                  : <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-primary/20 flex items-center justify-center shadow-xl"><span className="material-icons text-primary text-3xl sm:text-4xl">person</span></div>
                }
                <div className="absolute inset-0 rounded-full border border-gray-100 group-hover:border-primary/50 transition-colors pointer-events-none" />
              </div>
              <div className="pb-1 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{displayUser?.name}</h1>
                <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{displayUser?.headline}</p>
              </div>
              {reviews.length > 0 && (
                <div className="pb-1 flex flex-col items-center sm:items-end">
                  <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100/50">
                    <span className="text-lg font-bold text-amber-600">{avgRating.toFixed(1)}</span>
                    <span className="material-icons text-amber-400 text-sm">star</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">{reviews.length} đánh giá</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(displayUser?.niche || []).map(n => (
                <span key={n} className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">{n}</span>
              ))}
              {(displayUser?.tools || []).map(t => (
                <span key={t} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{t}</span>
              ))}
            </div>

            {displayUser?.bio && <p className="text-sm text-gray-600 leading-relaxed mb-4">{displayUser.bio}</p>}

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {displayUser?.hourlyRate && (
                <span className="flex items-center gap-1"><span className="material-icons text-sm text-green-500">payments</span>{displayUser.hourlyRate.toLocaleString()} VND/giờ</span>
              )}
              {displayUser?.availability && (
                <span className="flex items-center gap-1"><span className="material-icons text-sm text-primary">schedule</span>{displayUser.availability}</span>
              )}
              {displayUser?.englishLevel && (
                <span className="flex items-center gap-1"><span className="material-icons text-sm text-blue-500">translate</span>English: {displayUser.englishLevel}</span>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio Items */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900">Portfolio ({items.length})</h2>
            {isOwner && <button onClick={() => setAddModal(true)} className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"><span className="material-icons text-sm">add</span>Thêm mới</button>}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse"><div className="aspect-video bg-gray-200" /><div className="p-4 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-full" /></div></div>)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 border-dashed">
              <span className="material-icons text-5xl text-gray-300 mb-4 block">movie</span>
              <p className="text-gray-500 font-medium">Chưa có portfolio</p>
              {isOwner && <button onClick={() => setAddModal(true)} className="mt-4 px-6 py-2 bg-primary text-white rounded-full text-sm font-semibold">Thêm video đầu tiên</button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map(item => {
                const embedUrl = getYouTubeEmbed(item.mediaUrl);
                return (
                  <div key={item._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                    {/* Video or thumbnail */}
                    <div className="aspect-video bg-gray-900 relative overflow-hidden">
                      {selectedItem?._id === item._id && embedUrl ? (
                        <iframe src={`${embedUrl}?autoplay=1`} className="w-full h-full" allowFullScreen allow="autoplay" title={item.title} />
                      ) : (
                        <>
                          {embedUrl ? (
                            <img
                              src={`https://img.youtube.com/vi/${embedUrl.split('/embed/')[1]}/hqdefault.jpg`}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                              <span className="material-icons text-4xl text-gray-300">movie</span>
                            </div>
                          )}
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                              <span className="material-icons text-primary text-3xl ml-1">play_arrow</span>
                            </div>
                          </button>
                          <div className="absolute top-2 right-2 flex gap-1">
                            {item.status === 'pending' && <span className="text-[10px] bg-yellow-500 text-white px-2 py-0.5 rounded-full font-bold">⏳ Chờ duyệt</span>}
                            {item.status === 'approved' && <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">✓ Đã duyệt</span>}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                        {isOwner && (
                          <button onClick={() => handleDelete(item._id)} className="text-red-400 hover:text-red-600 p-0.5 opacity-0 group-hover:opacity-100 transition">
                            <span className="material-icons text-sm">delete</span>
                          </button>
                        )}
                      </div>
                      {item.platform && <span className="text-xs text-primary font-medium">{item.platform}</span>}
                      {item.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>}

                      {/* Case Study metrics */}
                      {item.caseStudy?.metrics && (
                        <div className="mt-3 flex gap-3 text-xs">
                          {item.caseStudy.metrics.viewsGained > 0 && (
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-semibold">👁 +{(item.caseStudy.metrics.viewsGained / 1000).toFixed(0)}K views</span>
                          )}
                          {item.caseStudy.metrics.subscribersGained > 0 && (
                            <span className="bg-red-50 text-red-600 px-2 py-1 rounded font-semibold">+{(item.caseStudy.metrics.subscribersGained / 1000).toFixed(0)}K subs</span>
                          )}
                        </div>
                      )}

                      {item.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Đánh giá từ khách hàng ({reviews.length})</h2>
            <div className="space-y-5">
              {reviews.map(review => (
                <div key={review._id} className="border-b border-gray-100 pb-5 last:border-none last:pb-0">
                  <div className="flex items-start gap-3">
                    {review.reviewer?.avatar
                      ? <img src={review.reviewer.avatar} alt={review.reviewer.name} className="w-10 h-10 rounded-full object-cover" />
                      : <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"><span className="material-icons text-gray-400 text-sm">person</span></div>
                    }
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{review.reviewer?.name}</p>
                          <p className="text-xs text-gray-500">{review.reviewer?.company || review.reviewer?.role}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StarRating rating={review.overallRating} />
                          <span className="text-[10px] text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-2 leading-relaxed">{review.comment}</p>
                      {review.response && (
                        <div className="mt-3 bg-gray-50 rounded-lg p-3 border-l-2 border-primary">
                          <p className="text-xs font-semibold text-primary mb-1">Phản hồi của freelancer:</p>
                          <p className="text-xs text-gray-600">{review.response}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {addModal && <AddPortfolioModal onClose={() => setAddModal(false)} onSuccess={fetchAll} />}
    </div>
  );
}
