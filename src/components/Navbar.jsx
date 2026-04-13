import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { usersAPI } from '../services/api';
import Logo from './Logo';

export default function Navbar({ activeNav = 'home', search, onSearchChange, showSearch = false, extraActions, searchResults, isSearching }) {
  const { t } = useTranslation();
  const { user, logout, setUser, isAuthenticated, loginWithGoogle } = useAuth();
  const { notifications, unreadCount, markAllRead, setNotifications } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const desktopNotifRef = useRef(null);
  const mobileNotifRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        (desktopNotifRef.current && desktopNotifRef.current.contains(event.target)) ||
        (mobileNotifRef.current && mobileNotifRef.current.contains(event.target))
      ) {
        return; // Clicked inside either notif dropdown
      }
      setShowNotifications(false);
      
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (search && search.length > 0) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [search]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [navigate]);

  const handleRespondConnection = async (notif, action) => {
    console.log('Responding to connection request:', notif.sender?._id, action);
    try {
      const res = await usersAPI.respondConnection(notif.sender._id, action);
      console.log('Response from API:', res.data);
      if (action === 'accept') {
        toast.success(res.data.message || 'Đã chấp nhận kết nối');
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, type: 'connection_accepted_local' } : n));
        if (notif.sender && setUser) {
          setUser(prev => ({ ...prev, connections: [notif.sender, ...(prev.connections || [])] }));
        }
      } else {
        toast.success(res.data.message || 'Đã từ chối kết nối');
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, type: 'connection_rejected_local' } : n));
      }
    } catch (err) {
      console.error('API Error:', err);
      toast.error(err.response?.data?.message || 'Không thể thực hiện hành động này');
    }
  };

  const isAdmin = user && ['superadmin', 'moderator', 'support'].includes(user.role);
  const isClient = user && user.role === 'client';

  const navItems = !isAuthenticated
    ? [
      { id: 'jobs', icon: 'work', label: t('nav.jobs'), path: '/jobs' },
    ]
    : isAdmin
      ? [{ id: 'admin', icon: 'settings_suggest', label: t('admin.sidebar.dashboard'), path: '/admin/dashboard' }]
      : isClient
        ? [
          { id: 'home', icon: 'dashboard', label: 'Dashboard', path: '/employer' },
          { id: 'jobs', icon: 'work_outline', label: t('nav.jobs'), path: '/jobs' },
          { id: 'messages', icon: 'chat', label: t('nav.messaging'), path: '/messages' },
          { id: 'notifications', icon: 'notifications', label: t('nav.notifications'), path: '#' },
        ]
        : [
          { id: 'home', icon: 'home', label: t('nav.home'), path: '/dashboard' },
          { id: 'network', icon: 'people', label: t('nav.network'), path: '/dashboard' },
          { id: 'jobs', icon: 'work', label: t('nav.jobs'), path: '/jobs' },
          { id: 'messages', icon: 'chat', label: t('nav.messaging'), path: '/messages' },
          { id: 'notifications', icon: 'notifications', label: t('nav.notifications'), path: '#' },
        ];

  const homePath = isAdmin
    ? '/admin/dashboard'
    : isClient
      ? '/employer'
      : user
        ? '/dashboard'
        : '/';

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-300 h-16 px-4 flex-none shadow-sm">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-2">
          {/* Logo + Search */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Logo size="lg" to={homePath} />
            {showSearch && (
              <div className="relative w-full max-w-xs hidden md:block" ref={searchRef}>
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-icons text-gray-500">search</span>
                </span>
                <input
                  className="w-full bg-blue-50 border-none rounded-md py-2 pl-10 pr-4 text-sm placeholder-gray-500 focus:ring-2 focus:ring-primary transition-all"
                  placeholder={t('jobSearch.searchPlaceholder')}
                  type="text"
                  value={search}
                  onChange={onSearchChange}
                  onFocus={() => search && setShowSearchResults(true)}
                />

                {/* Search Results Popup */}
                {showSearchResults && (searchResults?.jobs?.length > 0 || searchResults?.users?.length > 0 || isSearching || (search && search.trim().length > 0)) && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden z-[60] py-2 max-h-[400px] overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        Đang tìm kiếm...
                      </div>
                    ) : (
                      <>
                        {searchResults?.users?.length > 0 && (
                          <div className="mb-2">
                            <h4 className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Thành viên</h4>
                            {searchResults.users.map(u => (
                              <Link
                                key={u._id}
                                to={`/profile/${u._id}`}
                                onClick={() => setShowSearchResults(false)}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 transition-colors"
                              >
                                {u.avatar ? (
                                  <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    <span className="material-icons text-sm">person</span>
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{u?.name || 'Thành viên'}</p>
                                  <p className="text-[10px] text-gray-500 truncate">{u?.headline || u?.role}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}

                        {searchResults?.jobs?.length > 0 && (
                          <div>
                            <h4 className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-t border-gray-50 pt-3 mt-1">Công việc</h4>
                            {searchResults.jobs.map(j => (
                              <Link
                                key={j._id}
                                to={`/jobs?id=${j._id}`}
                                onClick={() => setShowSearchResults(false)}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 transition-colors"
                              >
                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                  <span className="material-icons text-sm">work</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{j?.title || 'Công việc'}</p>
                                  <p className="text-[10px] text-gray-500 truncate">{j?.client?.name || 'Nhà tuyển dụng'}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}

                        {!isSearching && (!searchResults?.users?.length && !searchResults?.jobs?.length) && (
                          <div className="p-4 text-center">
                            <p className="text-sm text-gray-500 italic">Không tìm thấy kết quả nào cho "{search}"</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center h-full">
            <ul className="flex items-center space-x-1 h-full">
              {navItems.map((item) => {
                if (item.id === 'notifications' && !isAuthenticated) return null;
                const active = item.id === activeNav;
                return (
                  <li key={item.id} ref={item.id === 'notifications' ? desktopNotifRef : null} className={`flex flex-col items-center justify-center cursor-pointer h-full px-2 transition-colors relative group ${active ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}>
                    {item.id === 'notifications' ? (
                      <div className="flex flex-col items-center w-full" onClick={() => { setShowNotifications(!showNotifications); markAllRead(); }}>
                        <span className={`material-icons ${active ? 'text-primary' : 'group-hover:text-primary'}`}>{item.icon}</span>
                        <span className="text-xs hidden md:block font-medium">{item.label}</span>
                        {unreadCount > 0 && <span className="absolute top-3 right-2 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                      </div>
                    ) : (
                      <Link to={item.path} className="flex flex-col items-center w-full">
                        <span className={`material-icons ${active ? 'text-primary' : 'group-hover:text-primary'}`}>{item.icon}</span>
                        <span className="text-xs hidden md:block font-medium">{item.label}</span>
                      </Link>
                    )}
                    {item.id === 'notifications' && showNotifications && (
                      <div className="absolute top-full right-[-50px] md:right-[-100px] mt-2 w-80 md:w-96 bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden z-50 flex flex-col max-h-[80vh] text-left">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                          <h3 className="font-bold text-gray-900">Thông báo</h3>
                          <button onClick={(e) => { e.stopPropagation(); markAllRead(); setShowNotifications(false); }} className="text-gray-400 hover:text-gray-600"><span className="material-icons text-sm">close</span></button>
                        </div>
                        <div className="overflow-y-auto flex-1 bg-white">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">Chưa có thông báo nào</div>
                          ) : (
                            notifications.map((notif) => (
                              <div key={notif._id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}>
                                <Link to={notif.sender ? `/profile/${notif.sender._id}` : '#'} className="flex-shrink-0 mt-1">
                                  {notif.sender?.avatar ? (
                                    <img src={notif.sender.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"><span className="material-icons text-gray-500 text-lg">person</span></div>
                                  )}
                                </Link>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-800">
                                    <span className="font-semibold">{notif.sender?.name || 'Hệ thống'}</span>{' '}
                                    {notif.type === 'new_message' ? 'đã gửi một tin nhắn cho bạn' :
                                      notif.type === 'connection_request' ? 'đã gửi yêu cầu kết nối' :
                                        notif.type === 'connection_accepted' ? 'đã chấp nhận kết nối' :
                                          notif.type === 'job_hired' ? 'đã thu nhận bạn vào công việc' :
                                            notif.type === 'application_status' ? 'đã cập nhật trạng thái ứng tuyển của bạn' :
                                              notif.type === 'video_call' ? 'đã để lại một cuộc gọi nhỡ' :
                                                notif.message}
                                  </p>
                                  <span className="text-xs text-gray-500 block mt-1">{new Date(notif.createdAt).toLocaleString()}</span>

                                  {notif.type === 'connection_request' && (
                                    <div className="flex gap-2 mt-2">
                                      <button onClick={(e) => { e.stopPropagation(); handleRespondConnection(notif, 'accept'); }} className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary-dark transition-colors">Chấp nhận</button>
                                      <button onClick={(e) => { e.stopPropagation(); handleRespondConnection(notif, 'reject'); }} className="px-4 py-1.5 border border-gray-300 text-gray-600 text-xs font-semibold rounded-full hover:bg-gray-100 transition-colors">Từ chối</button>
                                    </div>
                                  )}
                                  {notif.type === 'connection_accepted_local' && (
                                    <div className="mt-2 text-sm text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-md inline-block">Đã chấp nhận kết nối</div>
                                  )}
                                  {notif.type === 'connection_rejected_local' && (
                                    <div className="mt-2 text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1.5 rounded-md inline-block">Đã từ chối kết nối</div>
                                  )}
                                  {(notif.type === 'new_message' || notif.type === 'job_hired') && (
                                    <Link to={`/messages?with=${notif.sender?._id || ''}`} className="mt-2 inline-block px-4 py-1.5 border border-primary text-primary text-xs font-semibold rounded-full hover:bg-primary/5 transition-colors">Xem tin nhắn</Link>
                                  )}
                                  {(notif.type.includes('job_') || notif.type.includes('comment_') || notif.type.includes('reply_')) && (
                                    <Link to={notif.link || `/dashboard?jobId=${notif.jobRef || ''}`} className="mt-2 inline-block px-4 py-1.5 border border-primary text-primary text-xs font-semibold rounded-full hover:bg-primary/5 transition-colors">Xem bài đăng</Link>
                                  )}
                                  {notif.type === 'video_call' && (
                                    <Link to={notif.link || `/messages?with=${notif.sender?._id || ''}`} className="mt-2 inline-block px-4 py-1.5 border border-primary text-primary text-xs font-semibold rounded-full hover:bg-primary/5 transition-colors">Gọi lại ngay</Link>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="ml-4 flex items-center pl-4 border-l border-gray-200 space-x-3 h-full">
              {extraActions}
              {!isAuthenticated ? (
                <div className="flex items-center gap-3 h-full">
                  <button onClick={loginWithGoogle} className="text-gray-600 font-semibold hover:bg-gray-100 px-4 py-2 rounded-md transition text-sm">Tham gia ngay</button>
                  <button onClick={loginWithGoogle} className="text-primary border border-primary font-semibold rounded-full px-5 py-2 hover:bg-blue-50 transition text-sm">Đăng nhập</button>
                </div>
              ) : (
                <>
                  <LanguageSwitcher variant="compact" />
                  <div className="relative group p-1 flex flex-col items-center cursor-pointer">
                    <div className="flex flex-col items-center">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="Me" className="w-6 h-6 rounded-full object-cover shadow-sm border border-gray-100" />
                      ) : (
                        <span className="material-icons text-gray-500 text-[24px]">account_circle</span>
                      )}
                      <span className="text-[10px] hidden md:block text-gray-500 mt-0.5 font-semibold">Tôi ▼</span>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="absolute top-full right-0 mt-3 w-64 bg-white border border-gray-200 shadow-2xl rounded-2xl py-3 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-50 transform origin-top-right group-hover:translate-y-0 translate-y-2">
                      <div className="px-4 py-3 mb-2">
                        <div className="flex items-center gap-3">
                          {user?.avatar
                            ? <img src={user.avatar} className="w-12 h-12 rounded-full border border-gray-100 object-cover" alt="Profile" />
                            : <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><span className="material-icons text-primary">person</span></div>
                          }
                          <div className="flex-1 overflow-hidden">
                            <h4 className="font-bold text-gray-900 truncate">{user?.name}</h4>
                            <p className="text-xs text-gray-500 truncate">{user?.headline || 'Chuyên viên'}</p>
                          </div>
                        </div>
                        <Link to="/profile/edit" className="block mt-3 w-full text-center py-1.5 border border-primary text-primary rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-all">
                          Chỉnh sửa & Chuyển vai trò
                        </Link>
                      </div>

                      <div className="h-px bg-gray-100 my-1" />

                      <div className="px-2">
                        <h5 className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tài khoản</h5>
                        <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                          <span className="material-icons text-gray-400 text-lg">settings</span>
                          <span className="text-sm font-semibold text-gray-700">Cài đặt & Quyền riêng tư</span>
                        </Link>
                        <Link to="/help" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                          <span className="material-icons text-gray-400 text-lg">help_outline</span>
                          <span className="text-sm font-semibold text-gray-700">Trợ giúp</span>
                        </Link>
                      </div>

                      <div className="h-px bg-gray-100 my-1" />

                      <div className="px-2 pt-1">
                        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors text-left font-bold uppercase text-[10px] tracking-widest">
                          <span className="material-icons text-lg">logout</span>
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Right: notification bell + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Mobile notification (icon only) */}
            <div className="relative" ref={mobileNotifRef}>
              {isAuthenticated && (
                <button
                  onClick={() => { setShowNotifications(!showNotifications); markAllRead(); }}
                  className="p-2 text-gray-500 hover:text-primary relative"
                >
                  <span className="material-icons">notifications</span>
                  {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
              )}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden z-50 flex flex-col max-h-[70vh]">
                  <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-sm">Thông báo</h3>
                    <button onClick={() => setShowNotifications(false)} className="text-gray-400"><span className="material-icons text-sm">close</span></button>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 text-sm">Chưa có thông báo nào</div>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <div key={notif._id} className={`p-3 border-b border-gray-50 flex gap-2 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}>
                          {notif.sender?.avatar
                            ? <img src={notif.sender.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            : <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><span className="material-icons text-gray-500 text-sm">person</span></div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-800 leading-snug">
                              <span className="font-semibold">{notif.sender?.name || 'Hệ thống'}</span>{' '}
                              {notif.type === 'new_message' ? 'đã gửi tin nhắn' :
                                notif.type === 'connection_request' ? 'gửi yêu cầu kết nối' :
                                  notif.type === 'connection_accepted' ? 'đã chấp nhận kết nối' :
                                    notif.message}
                            </p>
                            <span className="text-[10px] text-gray-400">{new Date(notif.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <span className="material-icons">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile side drawer overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Mobile slide-out drawer */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out overflow-y-auto ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Drawer Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-primary/20" />
                  : <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><span className="material-icons text-primary">person</span></div>
                }
                <div>
                  <p className="font-bold text-gray-900 text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[140px]">{user?.headline || user?.role}</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col">
                <p className="font-bold text-gray-900 text-sm">Chào mừng bạn!</p>
                <p className="text-xs text-gray-500">Đăng nhập để xem thêm</p>
              </div>
            )}
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-gray-700">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="p-3">
          {navItems.filter(i => i.id !== 'notifications').map((item) => (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 font-semibold transition-colors ${activeNav === item.id ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <span className="material-icons">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="h-px bg-gray-100 mx-4" />

        <div className="p-3">
          {isAuthenticated ? (
            <>
              <Link to="/profile/edit" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold">
                <span className="material-icons text-gray-500">manage_accounts</span>
                Chỉnh sửa hồ sơ
              </Link>
              <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold">
                <span className="material-icons text-gray-500">settings</span>
                Cài đặt
              </Link>
              <div className="px-4 py-3">
                <LanguageSwitcher />
              </div>
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-semibold">
                <span className="material-icons">logout</span>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { loginWithGoogle(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-primary hover:bg-blue-50 font-bold border border-primary/20 mb-2">
                <span className="material-icons">login</span>
                Đăng nhập
              </button>
              <button onClick={() => { loginWithGoogle(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold border border-gray-200">
                <span className="material-icons">person_add</span>
                Tham gia ngay
              </button>
              <div className="px-4 py-3 mt-4">
                <LanguageSwitcher />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
