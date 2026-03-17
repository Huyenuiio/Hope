import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messagesAPI, usersAPI, jobsAPI } from '../services/api';
import JobDetailModal from '../components/JobDetailModal';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export default function MessagesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socket, onlineUsers, emit } = useSocket();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [hasBlockedMe, setHasBlockedMe] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const myTypingTimeoutRef = useRef(null);
  const otherTypingTimeoutRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const { data } = await messagesAPI.getConversations();
      // Backend returns [{_id: conversationId, lastMessage: {...}, unreadCount}]
      // We need to derive otherUser from lastMessage sender/receiver
      const convs = (data.conversations || []).map(conv => {
        const lm = conv.lastMessage;
        if (!lm) return { ...conv, otherUser: null };
        
        // After Mongoose populate, sender & receiver are objects with ._id
        // Must use .toString() for comparison, not ===
        const senderId = lm.sender?._id?.toString() || lm.sender?.toString();
        const currentUserId = user?._id?.toString();
        const otherUser = senderId === currentUserId ? lm.receiver : lm.sender;
        
        return { ...conv, otherUser };
      }).filter(c => c.otherUser); // ignore convs where otherUser can't be determined


      setConversations(convs);

      // Auto-select from URL param or first conversation
      const targetId = searchParams.get('with');
      if (targetId) {
        const found = convs.find(c => c.otherUser?._id === targetId || c.otherUser === targetId);
        if (found) {
          setActiveConv(found);
        } else {
          // Tạo một cuộc hội thoại mới tinh nếu chưa từng nhắn tin
          try {
            const { data: userData } = await usersAPI.getProfile(targetId);
            if (userData?.user) {
              const newConv = {
                _id: 'new_' + targetId,
                otherUser: userData.user,
                lastMessage: null,
                unreadCount: 0
              };
              setConversations([newConv, ...convs]);
              setActiveConv(newConv);
            } else if (convs.length > 0) setActiveConv(convs[0]);
          } catch (e) {
            console.error('Không tìm thấy user để chat mới:', e);
            if (convs.length > 0) setActiveConv(convs[0]);
          }
        }
      } 
      // No auto-select when landing from Navbar - let user choose from the inbox list

    } catch (err) {
      console.error('fetchConversations error:', err);
    } finally {
      setLoadingConvs(false);
    }
  }, [searchParams, user?._id]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!activeConv?.otherUser?._id) return;
    setLoadingMsgs(true);
    setMessages([]);
    setIsBlockedByMe(false);
    setHasBlockedMe(false);
    messagesAPI.getMessages(activeConv.otherUser._id)
      .then(({ data }) => {
        setMessages(data.messages || []);
        setIsBlockedByMe(data.isBlockedByMe || false);
        setHasBlockedMe(data.hasBlockedMe || false);
        setTimeout(scrollToBottom, 100);
      })
      .catch(() => { })
      .finally(() => setLoadingMsgs(false));
  }, [activeConv, scrollToBottom]);

  // Socket.io real-time events
  useEffect(() => {
    if (!socket) return;

    // BUG FIX: Server emits 'message:received', not 'newMessage'
    const handleNewMessage = (msg) => {
      const otherUserId = activeConv?.otherUser?._id || activeConv?.otherUser;
      const msgSender = msg.sender?._id || msg.sender;
      const msgReceiver = msg.receiver?._id || msg.receiver;
      if (otherUserId && (msgSender === otherUserId || msgReceiver === otherUserId)) {
        setMessages(prev => [...prev, msg]);
        setTimeout(scrollToBottom, 50);
      }
      // Update conversation list last message
      setConversations(prev =>
        prev.map(c => {
          const otherId = c.otherUser?._id || c.otherUser;
          if (otherId === msgSender || otherId === msgReceiver) {
            return { ...c, lastMessage: msg };
          }
          return c;
        })
      );
    };

    // BUG FIX: Server emits 'typing:start', not 'userTyping'
    const handleTypingStart = ({ userId: senderId }) => {
      const otherUserId = activeConv?.otherUser?._id || activeConv?.otherUser;
      if (otherUserId === senderId) {
        setOtherTyping(true);
        clearTimeout(otherTypingTimeoutRef.current);
        otherTypingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
      }
    };

    const handleTypingStop = ({ userId: senderId }) => {
      const otherUserId = activeConv?.otherUser?._id || activeConv?.otherUser;
      if (otherUserId === senderId) setOtherTyping(false);
    };

    socket.on('message:received', handleNewMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:received', handleNewMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, activeConv, scrollToBottom]);

  // Scroll on otherTyping
  useEffect(() => { if (otherTyping) scrollToBottom(); }, [otherTyping, scrollToBottom]);

  const handleTyping = () => {
    const otherUserId = activeConv?.otherUser?._id || activeConv?.otherUser;
    if (!typing && otherUserId) {
      setTyping(true);
      // BUG FIX: Server listens for 'typing:start', not 'typing'
      emit('typing:start', { receiverId: otherUserId });
    }
    clearTimeout(myTypingTimeoutRef.current);
    myTypingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      const othId = activeConv?.otherUser?._id || activeConv?.otherUser;
      if (othId) emit('typing:stop', { receiverId: othId });
    }, 2000);
  };

  const handleSend = async () => {
    const otherUserId = activeConv?.otherUser?._id || activeConv?.otherUser;
    if (!newMsg.trim() || !otherUserId || sending) return;
    const text = newMsg.trim();
    setNewMsg('');
    setSending(true);

    // Optimistic UI
    const tempMsg = {
      _id: Date.now(),
      sender: user?._id,
      receiver: otherUserId,
      content: text,
      type: 'text',
      createdAt: new Date().toISOString(),
      _temp: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const { data } = await messagesAPI.sendMessage({
        receiverId: otherUserId,
        content: text,
        type: 'text',
      });
      setMessages(prev => prev.map(m => m._temp ? data.message : m));
    } catch (err) {
      setMessages(prev => prev.filter(m => !m._temp));
      setNewMsg(text);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const otherUserId = activeConv?.otherUser?._id || activeConv?.otherUser;
    if (!otherUserId) return;

    try {
      setUploadingImg(true);

      // Upload to ImgBB
      const formData = new FormData();
      formData.append('image', file);
      const imgbbRes = await axios.post(`https://api.imgbb.com/1/upload?key=6ad8b3a7e1ef39bceed6f960fcdea074`, formData);
      const imageUrl = imgbbRes.data.data.url;

      // Optimistic UI cho ảnh
      const tempMsg = {
        _id: Date.now(),
        sender: user?._id,
        receiver: otherUserId,
        content: imageUrl,
        type: 'image',
        createdAt: new Date().toISOString(),
        _temp: true,
      };
      setMessages(prev => [...prev, tempMsg]);
      setTimeout(scrollToBottom, 50);

      const { data } = await messagesAPI.sendMessage({
        receiverId: otherUserId,
        content: imageUrl,
        type: 'image',
      });
      setMessages(prev => prev.map(m => m._temp ? data.message : m));
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      alert('Không thể tải ảnh lên. Vui lòng thử lại sau.');
      setMessages(prev => prev.filter(m => !m._temp));
    } finally {
      setUploadingImg(false);
      // Reset input file
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const otherUser = activeConv?.otherUser;
  const isOnline = otherUser && onlineUsers?.includes(otherUser._id);

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-4 flex-shrink-0 z-10">
        <Link to="/dashboard" className="flex items-center gap-1">
          <span className="text-primary font-bold text-xl">Ho</span>
          <span className="bg-primary text-white rounded px-1 font-bold text-sm">pe</span>
        </Link>
        <span className="text-base font-semibold text-gray-800">{t('dashboard.messaging')}</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations List */}
        <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex-shrink-0">
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <span className="material-icons text-gray-400 text-lg">search</span>
              </span>
              <input className="w-full bg-gray-100 rounded-full py-2 pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Tìm cuộc trò chuyện..." />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="space-y-3 p-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <span className="material-icons text-4xl text-gray-300 mb-3">chat_bubble_outline</span>
                <p className="text-sm text-gray-500 font-medium">Chưa có tin nhắn</p>
                <p className="text-xs text-gray-400 mt-1">Kết nối với freelancer hoặc client để bắt đầu</p>
              </div>
            ) : (
              conversations.map(conv => {
                const other = conv.otherUser;
                const last = conv.lastMessage;
                const online = other && onlineUsers?.includes(other._id);
                const isActive = activeConv?.otherUser?._id === other?._id;

                return (
                  <button
                    key={conv._id || other?._id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors border-l-4 text-left ${isActive ? 'border-l-primary bg-primary/5' : 'border-l-transparent'}`}
                  >
                    <div className="relative flex-shrink-0">
                      {other?.avatar
                        ? <img alt={other?.name} className="w-12 h-12 rounded-full object-cover" src={other.avatar} />
                        : <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"><span className="material-icons text-primary">person</span></div>
                      }
                      {online && <div className="w-3 h-3 bg-green-500 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="text-sm font-semibold text-gray-900 truncate">{other?.name}</p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{last ? timeAgo(last.createdAt) : ''}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {last?.sender === user?._id ? '✓ ' : ''}{last?.content || 'Bắt đầu cuộc trò chuyện...'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat Area */}
        {activeConv && otherUser ? (
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3 flex-shrink-0">
              <div className="relative">
                {otherUser.avatar
                  ? <img alt={otherUser.name} className="w-10 h-10 rounded-full object-cover" src={otherUser.avatar} />
                  : <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><span className="material-icons text-primary">person</span></div>
                }
                {isOnline && <div className="w-2.5 h-2.5 bg-green-500 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-white" />}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{otherUser.name}</p>
                <p className="text-xs text-gray-500">
                  {isOnline ? <span className="text-green-500 font-medium">● Đang hoạt động</span> : otherUser.headline || otherUser.role}
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition">
                  <span className="material-icons text-lg">video_call</span>
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition">
                  <span className="material-icons text-lg">info</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            {(isBlockedByMe || hasBlockedMe) ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50 text-gray-400">
                <span className="material-icons text-6xl text-gray-300 mb-4">block</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isBlockedByMe ? "Bạn đã chặn người dùng này" : "Nội dung không khả dụng"}
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm">
                  {isBlockedByMe 
                    ? "Bạn không thể gửi hoặc nhận tin nhắn với người này. Vui lòng bỏ chặn trong Cài đặt để tiếp tục trò chuyện." 
                    : "Người dùng không có sẵn hoặc đã chặn tương tác."}
                </p>
                {isBlockedByMe && (
                  <Link
                    to="/settings"
                    className="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-full hover:bg-primary-dark shadow-md transition-colors inline-block"
                  >
                    Vào Cài đặt
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {loadingMsgs ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} animate-pulse`}>
                          <div className={`h-10 rounded-2xl bg-gray-200 ${i % 2 === 0 ? 'w-40' : 'w-56'}`} />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        {otherUser.avatar
                          ? <img alt={otherUser.name} className="w-full h-full rounded-full object-cover" src={otherUser.avatar} />
                          : <span className="material-icons text-primary text-2xl">person</span>
                        }
                      </div>
                      <p className="font-semibold text-gray-600">{otherUser.name}</p>
                      <p className="text-sm mt-1">{otherUser.headline || 'Hãy bắt đầu cuộc trò chuyện!'}</p>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.sender === user?._id || msg.sender?._id === user?._id;
                      return (
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                          {!isMe && (
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {otherUser.avatar ? <img alt="" className="w-full h-full object-cover" src={otherUser.avatar} /> : <span className="material-icons text-primary text-xs">person</span>}
                            </div>
                          )}
                          <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
                                ? 'bg-primary text-white rounded-br-md'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-sm'
                              } ${msg._temp ? 'opacity-70' : ''}`}>
                              {msg.type === 'image' ? (
                                <img src={msg.content} alt="Đính kèm" className="max-w-[200px] sm:max-w-[300px] rounded object-cover mt-1 mb-1 border border-white/20" />
                              ) : msg.type === 'job-share' ? (
                                <div
                                  onClick={() => { setSelectedJobId(msg.jobRef?._id || msg.jobRef); setIsJobModalOpen(true); }}
                                  className="bg-gray-50 border border-gray-100 rounded-xl p-3 cursor-pointer hover:bg-gray-100 transition-all group max-w-[280px]"
                                >
                                  <div className="flex items-start gap-3 mb-2">
                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                                      <span className="material-icons">work</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-gray-900 font-bold text-xs truncate group-hover:text-primary transition-colors">
                                        {msg.content.split(': ')[1]?.split('\n')[0] || 'Chi tiết công việc'}
                                      </p>
                                      <p className="text-[10px] text-gray-500 mt-0.5">Nhấn để xem chi tiết</p>
                                    </div>
                                  </div>
                                  <button className="w-full py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-primary hover:border-primary transition-colors flex items-center justify-center gap-1">
                                    <span className="material-icons text-xs">visibility</span> Xem & Ứng tuyển
                                  </button>
                                </div>
                              ) : (
                                msg.content
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 px-1">{timeAgo(msg.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {/* Typing indicator */}
                  {otherTyping && (
                    <div className="flex items-end gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {otherUser?.avatar ? <img alt="" className="w-full h-full object-cover" src={otherUser.avatar} /> : <span className="material-icons text-primary text-xs">person</span>}
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-1.5">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-end gap-3 flex-shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImg}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 flex-shrink-0 transition disabled:opacity-50"
                    title="Gửi hình ảnh"
                  >
                    {uploadingImg ? <span className="material-icons animate-spin text-sm">autorenew</span> : <span className="material-icons">attach_file</span>}
                  </button>
                  <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 min-h-[44px] flex items-end">
                    <textarea
                      className="w-full bg-transparent text-sm resize-none max-h-32 focus:outline-none placeholder-gray-400"
                      placeholder="Nhập tin nhắn..."
                      rows={1}
                      value={newMsg}
                      onChange={e => { setNewMsg(e.target.value); handleTyping(); }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!newMsg.trim() || sending}
                    className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition disabled:opacity-50 flex-shrink-0"
                  >
                    <span className="material-icons text-lg">send</span>
                  </button>
                </div>
              </>
            )}
          </main>
        ) : (
          <main className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <span className="material-icons text-6xl mb-4 text-gray-200">forum</span>
            <p className="text-lg font-medium text-gray-500">Chọn cuộc trò chuyện</p>
            <p className="text-sm mt-1">hoặc bắt đầu trò chuyện mới</p>
          </main>
        )}
      </div>
      <JobDetailModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        jobId={selectedJobId}
      />
    </div>
  );
}
