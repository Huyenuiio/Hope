import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { jobsAPI, usersAPI } from '../services/api';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('history');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [unblockingId, setUnblockingId] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await jobsAPI.getHistory();
        setHistory(res.data.history || []);
      } catch (err) {
        console.error('Fetch history error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  useEffect(() => {
    if (activeTab === 'blocked') {
      fetchBlockedUsers();
    }
  }, [activeTab]);

  const fetchBlockedUsers = async () => {
    setLoadingBlocked(true);
    try {
      const res = await usersAPI.getBlockedUsers();
      setBlockedUsers(res.data.blockedUsers || []);
    } catch (err) {
      console.error('Fetch blocked users error:', err);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblock = async (userId) => {
    setUnblockingId(userId);
    try {
      await usersAPI.unblockUser(userId);
      setBlockedUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      console.error('Unblock error:', err);
    } finally {
      setUnblockingId(null);
    }
  };

  const menuItems = [
    { id: 'account', icon: 'person', label: 'Tài khoản' },
    { id: 'history', icon: 'history', label: 'Lịch sử hoạt động' },
    { id: 'blocked', icon: 'block', label: 'Danh sách chặn' },
    { id: 'privacy', icon: 'lock', label: 'Quyền riêng tư' },
    { id: 'notifications', icon: 'notifications', label: 'Thông báo' },
    { id: 'display', icon: 'palette', label: 'Giao diện' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Navbar activeNav="none" />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Sidebar - Horizontal on mobile, vertical on desktop */}
          <aside className="w-full md:w-64 shrink-0 overflow-hidden">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Cài đặt</h1>
            <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 no-scrollbar">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 md:space-x-3 px-4 py-2.5 md:py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === item.id
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-gray-600 hover:bg-white hover:shadow-sm'
                    }`}
                >
                  <span className="material-icons text-xl">{item.icon}</span>
                  <span className="font-semibold text-sm md:text-base">{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <section className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

              {/* Activity History */}
              {activeTab === 'history' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Lịch sử hoạt động</h2>
                    <span className="text-xs text-gray-500">Tất cả tương tác của bạn</span>
                  </div>

                  {loading ? (
                    <div className="space-y-4 animate-pulse">
                      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
                    </div>
                  ) : history.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                      <span className="material-icons text-5xl mb-2">history_toggle_off</span>
                      <p>Bạn chưa có hoạt động nào</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((item, index) => {
                        const interaction = (() => {
                          switch (item.type) {
                            case 'love': return { icon: 'favorite', color: 'bg-red-50 text-red-500', action: 'đã yêu thích' };
                            case 'haha': return { icon: 'sentiment_very_satisfied', color: 'bg-yellow-50 text-yellow-500', action: 'đã haha' };
                            case 'wow': return { icon: 'sentiment_very_dissatisfied', color: 'bg-yellow-50 text-yellow-600', action: 'đã wow' };
                            case 'sad': return { icon: 'sentiment_dissatisfied', color: 'bg-blue-50 text-blue-400', action: 'đã buồn' };
                            case 'angry': return { icon: 'protest', color: 'bg-orange-50 text-orange-600', action: 'đã phẫn nộ' };
                            case 'comment': return { icon: 'comment', color: 'bg-green-50 text-green-500', action: 'đã bình luận vào' };
                            case 'comment_reaction': return { icon: 'add_reaction', color: 'bg-purple-50 text-purple-500', action: 'đã tương tác với bình luận trong' };
                            case 'comment_reply': return { icon: 'reply', color: 'bg-indigo-50 text-indigo-500', action: 'đã phản hồi bình luận trong' };
                            case 'reply_reaction': return { icon: 'favorite_border', color: 'bg-pink-50 text-pink-500', action: 'đã thích phản hồi trong' };
                            case 'share': return { icon: 'share', color: 'bg-blue-50 text-blue-600', action: 'đã chia sẻ' };
                            case 'send': return { icon: 'send', color: 'bg-gray-50 text-gray-600', action: 'đã gửi' };
                            case 'reply': return { icon: 'reply', color: 'bg-indigo-50 text-indigo-500', action: 'đã phản hồi trong' };
                            default: return { icon: 'thumb_up', color: 'bg-blue-50 text-blue-500', action: 'đã thích' };
                          }
                        })();

                        return (
                          <div key={index} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${interaction.color}`}>
                              <span className="material-icons">{interaction.icon}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-800">
                                Bạn {interaction.action} công việc{' '}
                                <Link to={`/jobs/${item.jobId}`} className="font-bold text-primary hover:underline italic">
                                  "{item.jobTitle}"
                                </Link>
                              </p>
                              {item.text && (
                                <p className="mt-2 text-sm text-gray-600 bg-white border border-gray-100 p-2 rounded-lg italic">
                                  "{item.text}"
                                </p>
                              )}
                              {item.image && (
                                <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 bg-white inline-block">
                                  <img src={item.image} alt="History attachment" className="max-w-[120px] object-contain" />
                                </div>
                              )}
                              <span className="text-xs text-gray-400 mt-2 block">
                                {new Date(item.createdAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500">
                              <span className="material-icons text-sm">delete</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Blocked Users */}
              {activeTab === 'blocked' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Danh sách chặn</h2>
                      <p className="text-sm text-gray-500 mt-1">Những người dùng bạn đã chặn. Bỏ chặn để khôi phục quan hệ bình thường.</p>
                    </div>
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">{blockedUsers.length} người</span>
                  </div>

                  {loadingBlocked ? (
                    <div className="space-y-4 animate-pulse">
                      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
                    </div>
                  ) : blockedUsers.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons text-3xl text-gray-300">block</span>
                      </div>
                      <p className="font-semibold text-gray-600">Bạn chưa chặn ai</p>
                      <p className="text-sm mt-1">Khi bạn chặn ai đó, họ sẽ xuất hiện trong danh sách này.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {blockedUsers.map((blockedUser) => (
                        <div
                          key={blockedUser._id}
                          className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-gray-50/50"
                        >
                          <Link to={`/profile/${blockedUser._id}`} className="shrink-0">
                            {blockedUser.avatar ? (
                              <img src={blockedUser.avatar} alt={blockedUser.name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="material-icons text-primary">person</span>
                              </div>
                            )}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link to={`/profile/${blockedUser._id}`} className="font-bold text-gray-900 hover:underline block truncate">
                              {blockedUser.name}
                            </Link>
                            <p className="text-sm text-gray-500 truncate">{blockedUser.headline || 'Thành viên Hope'}</p>
                          </div>
                          <button
                            onClick={() => handleUnblock(blockedUser._id)}
                            disabled={unblockingId === blockedUser._id}
                            className="shrink-0 flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-white hover:border-primary hover:text-primary transition-all disabled:opacity-50"
                          >
                            {unblockingId === blockedUser._id ? (
                              <span className="material-icons text-sm animate-spin">refresh</span>
                            ) : (
                              <span className="material-icons text-sm">lock_open</span>
                            )}
                            Bỏ chặn
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Account Info */}
              {activeTab === 'account' && (
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin tài khoản</h2>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                      <img src={user?.avatar || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" alt="Avatar" />
                      <div>
                        <p className="font-bold text-lg">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      <Link to="/profile/edit" className="ml-auto bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors shadow-sm">
                        Chỉnh sửa hồ sơ
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-100 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Vai trò</p>
                        <p className="text-sm font-semibold capitalize bg-primary/10 text-primary px-2 py-1 rounded inline-block">{user?.role}</p>
                      </div>
                      <div className="p-4 border border-gray-100 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Ngành nghề</p>
                        <p className="text-sm font-semibold">{user?.niche?.[0] || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'display' && (
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Giao diện</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <button className="p-4 border-2 border-primary rounded-2xl bg-white flex flex-col items-center gap-2">
                      <div className="w-full h-12 bg-gray-100 rounded-lg flex items-center justify-center"><span className="material-icons text-primary">light_mode</span></div>
                      <span className="text-sm font-bold">Chế độ sáng</span>
                    </button>
                    <button className="p-4 border-2 border-transparent hover:border-gray-200 rounded-2xl bg-gray-900 flex flex-col items-center gap-2 text-white">
                      <div className="w-full h-12 bg-gray-800 rounded-lg flex items-center justify-center"><span className="material-icons text-blue-400">dark_mode</span></div>
                      <span className="text-sm font-bold">Chế độ tối</span>
                    </button>
                  </div>
                </div>
              )}

              {(activeTab === 'privacy' || activeTab === 'notifications') && (
                <div className="p-12 text-center text-gray-400">
                  <span className="material-icons text-5xl mb-2">construction</span>
                  <p>Tính năng đang được phát triển</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
