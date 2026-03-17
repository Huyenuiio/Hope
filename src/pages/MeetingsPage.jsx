import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { meetingsAPI, usersAPI } from '../services/api';

const PLATFORMS = ['Google Meet', 'Zoom', 'Microsoft Teams', 'Skype', 'Zalo'];
const STATUS_CONFIG = {
  pending: { label: 'Chờ xác nhận', icon: 'pending', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  accepted: { label: 'Đã xác nhận', icon: 'event_available', color: 'text-green-600 bg-green-50 border-green-200' },
  completed: { label: 'Hoàn thành', icon: 'check_circle', color: 'text-gray-500 bg-gray-50 border-gray-200' },
  cancelled: { label: 'Đã hủy', icon: 'cancel', color: 'text-red-500 bg-red-50 border-red-100' },
  rescheduled: { label: 'Đổi lịch', icon: 'update', color: 'text-blue-500 bg-blue-50 border-blue-200' },
};

function timeUntil(dateStr) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) return 'Đã qua';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} phút nữa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ nữa`;
  const d = Math.floor(h / 24);
  return `${d} ngày nữa`;
}

function ScheduleMeetingModal({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [freelancers, setFreelancers] = useState([]);
  const [form, setForm] = useState({
    attendeeId: '',
    title: '',
    description: '',
    scheduledAt: '',
    duration: 30,
    platform: 'Google Meet',
    meetingLink: '',
    timezone: 'Asia/Ho_Chi_Minh',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    usersAPI.getFreelancers({ limit: 20 })
      .then(({ data }) => setFreelancers(data.users || []))
      .catch(() => {});
  }, []);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    if (!form.attendeeId || !form.title || !form.scheduledAt) {
      setError('Vui lòng điền đầy đủ: người tham dự, tiêu đề, ngày/giờ');
      return;
    }
    setLoading(true); setError('');
    try {
      await meetingsAPI.createMeeting({
        ...form,
        attendees: [form.attendeeId],
        duration: parseInt(form.duration),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg text-gray-900">Đặt lịch họp</h2>
            <p className="text-xs text-gray-500 mt-0.5">Kết nối với freelancer qua video call</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full"><span className="material-icons text-gray-400">close</span></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Người tham dự *</label>
            <select value={form.attendeeId} onChange={e => set('attendeeId', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white">
              <option value="">Chọn freelancer...</option>
              {freelancers.map(f => (
                <option key={f._id} value={f._id}>{f.name} — {f.niche?.slice(0, 2).join(', ') || f.role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Tiêu đề cuộc họp *</label>
            <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Vd: Discussion về dự án video marketing" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Mô tả / Agenda</label>
            <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Nội dung cần thảo luận..." className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Ngày & Giờ *</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => set('scheduledAt', e.target.value)}
                min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Thời lượng (phút)</label>
              <select value={form.duration} onChange={e => set('duration', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white">
                {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} phút</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Nền tảng</label>
              <select value={form.platform} onChange={e => set('platform', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white">
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Link họp (tùy chọn)</label>
              <input type="url" value={form.meetingLink} onChange={e => set('meetingLink', e.target.value)} placeholder="https://meet.google.com/..." className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</p>}
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><span className="material-icons text-sm animate-spin">refresh</span>Đang gửi...</> : <><span className="material-icons text-sm">event</span>Đặt lịch</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MeetingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, past, all

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await meetingsAPI.getMeetings();
      setMeetings(data.meetings || []);
    } catch (err) {
      console.error('fetchMeetings error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await meetingsAPI.updateStatus(id, { status });
      setMeetings(prev => prev.map(m => m._id === id ? { ...m, status } : m));
    } catch (err) { alert('Không thể cập nhật trạng thái'); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Hủy cuộc họp này?')) return;
    try {
      await meetingsAPI.cancelMeeting(id);
      setMeetings(prev => prev.map(m => m._id === id ? { ...m, status: 'cancelled' } : m));
    } catch (err) { alert('Không thể hủy cuộc họp'); }
  };

  const now = Date.now();
  const filteredMeetings = meetings.filter(m => {
    const meetingTime = new Date(m.scheduledAt).getTime();
    if (activeTab === 'upcoming') return meetingTime > now && m.status !== 'cancelled' && m.status !== 'completed';
    if (activeTab === 'past') return meetingTime <= now || m.status === 'completed' || m.status === 'cancelled';
    return true;
  });

  const upcomingCount = meetings.filter(m => new Date(m.scheduledAt).getTime() > now && m.status === 'pending').length;

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
              <span className="material-icons">arrow_back</span>
            </Link>
            <Link to="/" className="flex items-center gap-0.5">
              <span className="text-primary font-bold text-xl">Ho</span>
              <span className="bg-primary text-white rounded px-1 font-bold text-sm">pe</span>
            </Link>
            <h1 className="text-base font-bold text-gray-900">Lịch họp</h1>
            {upcomingCount > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{upcomingCount} chờ</span>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary text-white text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-primary-dark transition flex items-center gap-1.5"
          >
            <span className="material-icons text-sm">add</span>Đặt lịch họp
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-200/60 rounded-xl p-1 mb-6 w-fit">
          {[
            { key: 'upcoming', label: 'Sắp tới' },
            { key: 'past', label: 'Đã qua' },
            { key: 'all', label: 'Tất cả' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="material-icons text-primary text-3xl">event_note</span>
            </div>
            <p className="text-gray-600 font-semibold text-base">Chưa có lịch họp nào</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">Đặt lịch với freelancer để thảo luận về dự án</p>
            <button onClick={() => setShowModal(true)} className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-dark">
              Đặt lịch họp đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMeetings.map(meeting => {
              const statusConfig = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.pending;
              const isFuture = new Date(meeting.scheduledAt).getTime() > now;
              const otherAttendee = meeting.attendees?.find(a => a._id !== user?._id) || meeting.organizer;
              const isOrganizer = meeting.organizer?._id === user?._id || meeting.organizer === user?._id;
              const needsResponse = !isOrganizer && meeting.status === 'pending';

              return (
                <div key={meeting._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${meeting.status === 'cancelled' ? 'opacity-60' : ''}`} style={{ borderColor: meeting.status === 'accepted' && isFuture ? '#3b82f6' : '#e5e7eb' }}>
                  <div className="p-5">
                    <div className="flex gap-4">
                      {/* Time Block */}
                      <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-center ${isFuture && meeting.status !== 'cancelled' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <span className="text-lg font-bold leading-none">
                          {new Date(meeting.scheduledAt).getDate()}
                        </span>
                        <span className="text-[10px] uppercase font-medium mt-0.5">
                          {new Date(meeting.scheduledAt).toLocaleString('vi-VN', { month: 'short' })}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 text-base">{meeting.title}</h3>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 flex-shrink-0 ${statusConfig.color}`}>
                            <span className="material-icons text-sm">{statusConfig.icon}</span>
                            {statusConfig.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <span className="material-icons text-sm text-gray-400">schedule</span>
                            {new Date(meeting.scheduledAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                            {' · '}{meeting.duration} phút
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="material-icons text-sm text-gray-400">video_call</span>
                            {meeting.platform}
                          </span>
                          {isFuture && meeting.status !== 'cancelled' && (
                            <span className="flex items-center gap-1 text-amber-600 font-semibold">
                              <span className="material-icons text-xs">timer</span>
                              {timeUntil(meeting.scheduledAt)}
                            </span>
                          )}
                        </div>

                        {otherAttendee && (
                          <div className="flex items-center gap-2 mt-3">
                            {otherAttendee.avatar
                              ? <img src={otherAttendee.avatar} alt={otherAttendee.name} className="w-6 h-6 rounded-full object-cover" />
                              : <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"><span className="material-icons text-primary text-xs">person</span></div>
                            }
                            <span className="text-xs text-gray-600">{isOrganizer ? 'Với: ' : 'Từ: '}<span className="font-semibold">{otherAttendee.name}</span></span>
                          </div>
                        )}

                        {meeting.description && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{meeting.description}</p>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                          {meeting.meetingLink && meeting.status === 'accepted' && isFuture && (
                            <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-full text-xs font-semibold hover:bg-primary-dark transition">
                              <span className="material-icons text-sm">video_call</span>Tham gia họp
                            </a>
                          )}
                          {needsResponse && (
                            <>
                              <button onClick={() => handleUpdateStatus(meeting._id, 'accepted')}
                                className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-full text-xs font-semibold hover:bg-green-600 transition">
                                <span className="material-icons text-sm">check</span>Chấp nhận
                              </button>
                              <button onClick={() => handleUpdateStatus(meeting._id, 'cancelled')}
                                className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-full text-xs font-semibold hover:bg-red-600 transition">
                                <span className="material-icons text-sm">close</span>Từ chối
                              </button>
                            </>
                          )}
                          {isOrganizer && meeting.status !== 'cancelled' && meeting.status !== 'completed' && (
                            <button onClick={() => handleCancel(meeting._id)}
                              className="flex items-center gap-1 px-4 py-2 text-red-500 border border-red-200 rounded-full text-xs font-semibold hover:bg-red-50 transition">
                              <span className="material-icons text-sm">cancel</span>Hủy lịch
                            </button>
                          )}
                          {meeting.status === 'accepted' && isFuture && user?.role === 'client' && (
                            <button onClick={() => handleUpdateStatus(meeting._id, 'completed')}
                              className="flex items-center gap-1 px-4 py-2 text-gray-600 border border-gray-200 rounded-full text-xs font-semibold hover:bg-gray-50 transition">
                              <span className="material-icons text-sm">check_circle</span>Đánh dấu hoàn thành
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showModal && <ScheduleMeetingModal onClose={() => setShowModal(false)} onSuccess={fetchMeetings} />}
    </div>
  );
}
