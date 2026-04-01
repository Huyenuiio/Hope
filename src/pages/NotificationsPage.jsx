import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { messagesAPI } from '../services/api';
import Logo from '../components/Logo';

const NOTIFICATION_CONFIG = {
  job_application: { icon: 'work', color: 'text-primary bg-primary/10', label: 'Ứng tuyển mới' },
  application_status: { icon: 'how_to_reg', color: 'text-green-600 bg-green-100', label: 'Trạng thái đơn' },
  job_match: { icon: 'bolt', color: 'text-amber-500 bg-amber-100', label: 'Gợi ý việc làm' },
  new_message: { icon: 'chat', color: 'text-blue-500 bg-blue-100', label: 'Tin nhắn mới' },
  job_approved: { icon: 'verified', color: 'text-green-600 bg-green-100', label: 'Tin đã duyệt' },
  job_rejected: { icon: 'cancel', color: 'text-red-500 bg-red-100', label: 'Tin bị từ chối' },
  portfolio_approved: { icon: 'collections', color: 'text-primary bg-primary/10', label: 'Portfolio duyệt' },
  new_review: { icon: 'star', color: 'text-amber-500 bg-amber-100', label: 'Đánh giá mới' },
  meeting_request: { icon: 'event', color: 'text-purple-500 bg-purple-100', label: 'Lịch họp mới' },
  meeting_accepted: { icon: 'event_available', color: 'text-green-600 bg-green-100', label: 'Lịch họp xác nhận' },
  video_call: { icon: 'videocam', color: 'text-red-500 bg-red-100', label: 'Cuộc gọi' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m}p trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, job, message, meeting

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await messagesAPI.getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('fetchNotifications error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await messagesAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'job') return ['job_application', 'application_status', 'job_match', 'job_approved', 'job_rejected'].includes(n.type);
    if (filter === 'message') return ['new_message', 'video_call'].includes(n.type);
    if (filter === 'meeting') return ['meeting_request', 'meeting_accepted', 'meeting_reminder'].includes(n.type);
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const FILTERS = [
    { key: 'all', label: 'Tất cả', icon: 'notifications' },
    { key: 'unread', label: `Chưa đọc${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: 'mark_email_unread' },
    { key: 'job', label: 'Công việc', icon: 'work' },
    { key: 'message', label: 'Tin nhắn', icon: 'chat' },
    { key: 'meeting', label: 'Lịch họp', icon: 'event' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={user?.role === 'client' ? '/employer' : '/dashboard'}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition"
            >
              <span className="material-icons">arrow_back</span>
            </Link>
            <Logo size="md" />
            <h1 className="text-base font-bold text-gray-900">{t('nav.notifications')}</h1>
            {unreadCount > 0 && (
              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-sm text-primary font-semibold hover:underline">
              Đánh dấu đã đọc tất cả
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${filter === f.key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
                }`}
            >
              <span className="material-icons text-sm">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4 p-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-4/5" />
                    <div className="h-2 bg-gray-200 rounded w-2/3" />
                  </div>
                  <div className="w-12 h-2 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                <span className="material-icons text-3xl text-gray-300">notifications_none</span>
              </div>
              <p className="text-gray-600 font-semibold text-base">Không có thông báo</p>
              <p className="text-sm text-gray-400 mt-1">
                {filter === 'unread' ? 'Bạn đã đọc tất cả!' : 'Thông báo sẽ xuất hiện tại đây'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map(notif => {
                const config = NOTIFICATION_CONFIG[notif.type] || { icon: 'circle_notifications', color: 'text-gray-500 bg-gray-100', label: '' };
                return (
                  <div
                    key={notif._id}
                    className={`flex gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/40' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <span className="material-icons text-lg">{config.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {config.label && (
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{config.label}</span>
                          )}
                          <p className={`text-sm leading-relaxed mt-0.5 ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {notif.message}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-gray-400">{timeAgo(notif.createdAt)}</span>
                          {!notif.isRead && <div className="w-2 h-2 bg-primary rounded-full" />}
                        </div>
                      </div>
                      {notif.link && (
                        <Link
                          to={notif.link}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Xem chi tiết <span className="material-icons text-xs">arrow_forward</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
