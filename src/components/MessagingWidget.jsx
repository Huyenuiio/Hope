import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { messagesAPI, usersAPI } from '../services/api';
import axios from 'axios';

// --- Chat Window Component ---
function ChatWindow({ chat, onClose, onMinimize, onMarkRead }) {
    const { user } = useAuth();
    const { socket, emit, setCallData } = useSocket();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [otherTyping, setOtherTyping] = useState(false);
    const [uploadingImg, setUploadingImg] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        // Fetch initial messages
        messagesAPI.getMessages(chat.user._id)
            .then(({ data }) => {
                setMessages(data.messages || []);
                setLoading(false);
                scrollToBottom();
            })
            .catch(() => setLoading(false));
    }, [chat.user._id]);

    useEffect(() => {
        if (chat.newMessage) {
            setMessages(prev => {
                // Prevent duplicate if we already optimistically added it or it's already there
                if (prev.find(m => m._id === chat.newMessage._id)) return prev;
                return [...prev, chat.newMessage];
            });
            scrollToBottom();
            onMarkRead();
        }
    }, [chat.newMessage, onMarkRead]);

    useEffect(() => {
        if (!socket) return;

        const handleTypingStart = ({ userId: senderId }) => {
            if (senderId === chat.user._id) {
                setOtherTyping(true);
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
            }
        };
        const handleTypingStop = ({ userId: senderId }) => {
            if (senderId === chat.user._id) setOtherTyping(false);
        };

        socket.on('typing:start', handleTypingStart);
        socket.on('typing:stop', handleTypingStop);

        return () => {
            socket.off('typing:start', handleTypingStart);
            socket.off('typing:stop', handleTypingStop);
        };
    }, [socket, chat.user._id]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || sending) return;

        const content = text.trim();
        setText('');
        setSending(true);

        const tempMsg = {
            _id: Date.now().toString(),
            sender: user._id,
            receiver: chat.user._id,
            content,
            type: 'text',
            createdAt: new Date().toISOString(),
            _temp: true
        };
        setMessages(prev => [...prev, tempMsg]);
        scrollToBottom();

        try {
            const { data } = await messagesAPI.sendMessage({
                receiverId: chat.user._id,
                content,
                type: 'text'
            });
            setMessages(prev => prev.map(m => m._temp ? data.message : m));
        } catch (err) {
            setMessages(prev => prev.filter(m => !m._temp));
            setText(content);
        } finally {
            setSending(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingImg(true);
            const formData = new FormData();
            formData.append('image', file);
            const imgbbRes = await axios.post(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_KEY}`, formData);
            const imageUrl = imgbbRes.data.data.url;

            const tempMsg = {
                _id: Date.now().toString(),
                sender: user._id,
                receiver: chat.user._id,
                content: imageUrl,
                type: 'image',
                createdAt: new Date().toISOString(),
                _temp: true
            };
            setMessages(prev => [...prev, tempMsg]);
            scrollToBottom();

            const { data } = await messagesAPI.sendMessage({
                receiverId: chat.user._id,
                content: imageUrl,
                type: 'image'
            });
            setMessages(prev => prev.map(m => m._temp ? data.message : m));
        } catch (err) {
            console.error('Lỗi upload ảnh:', err);
            setMessages(prev => prev.filter(m => !m._temp));
        } finally {
            setUploadingImg(false);
        }
    };

    const handleStartCall = () => {
        setCallData({
            show: true,
            mode: 'outbound',
            target: chat.user,
            signal: null
        });
    };

    return (
        <div className="w-80 glass-card shadow-2xl rounded-t-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div
                className="bg-primary text-white p-2.5 flex items-center justify-between cursor-pointer hover:bg-primary/90 transition-colors"
                onClick={onMinimize}
            >
                <Link to={`/messages?with=${chat.user._id}`} className="flex items-center gap-2 hover:bg-white/10 p-1 rounded transition-colors" onClick={e => e.stopPropagation()}>
                    <img src={chat.user.avatar || '/default-avatar.png'} alt={chat.user.name} className="w-8 h-8 rounded-full border border-white/30 object-cover bg-white" />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold leading-tight line-clamp-1">{chat.user.name}</span>
                        <span className="text-[10px] text-white/80 leading-tight">Mở trong Chat</span>
                    </div>
                </Link>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={handleStartCall} title="Cuộc gọi video" className="p-1.5 hover:bg-white/20 rounded text-white"><span className="material-icons text-sm">videocam</span></button>
                    <button onClick={onMinimize} title="Thu nhỏ" className="p-1.5 hover:bg-white/20 rounded text-white"><span className="material-icons text-sm">remove</span></button>
                    <button onClick={onClose} title="Đóng" className="p-1.5 hover:bg-white/20 rounded text-white"><span className="material-icons text-sm">close</span></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-3 overflow-y-auto bg-slate-50 min-h-[300px] max-h-[350px] custom-scrollbar flex flex-col gap-3">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <span className="material-icons animate-spin">autorenew</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <span className="material-icons text-3xl mb-2 opacity-50">forum</span>
                        <p className="text-xs">Chưa có tin nhắn nào</p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                        return (
                            <div key={msg._id || i} className={`max-w-[85%] flex flex-col ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                <div className={`px-3 py-2 text-sm ${isMe ? 'bg-primary text-white rounded-t-xl rounded-bl-xl' : 'bg-gray-200 text-gray-900 rounded-t-xl rounded-br-xl'}`}>
                                    {msg.type === 'video_call' ? (
                                        <div className="flex items-center gap-2">
                                            <span className="material-icons text-lg">{msg.content === 'Cuộc gọi nhỡ' ? 'phone_missed' : 'phone'}</span>
                                            {msg.content}
                                        </div>
                                    ) : msg.type === 'image' ? (
                                        <img src={msg.content} alt="sent image" className="max-w-[150px] rounded-lg border border-black/10" />
                                    ) : (
                                        <div className="break-words whitespace-pre-wrap">{msg.content}</div>
                                    )}
                                </div>
                                {msg._temp && <span className="text-[9px] text-gray-400 mt-0.5">Đang gửi...</span>}
                            </div>
                        );
                    })
                )}
                {otherTyping && (
                    <div className="self-start px-3 py-2 bg-gray-200 rounded-full w-fit">
                        <div className="flex gap-1 items-center h-2">
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-2 border-t border-gray-100 bg-white flex items-center gap-2">
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImg}
                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors disabled:opacity-50"
                >
                    {uploadingImg ? <span className="material-icons text-sm animate-spin">autorenew</span> : <span className="material-icons text-sm">attach_file</span>}
                </button>
                <input
                    type="text"
                    placeholder="Nhắn tin..."
                    className="flex-1 bg-gray-100 rounded-full px-4 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onFocus={() => emit('typing:start', { receiverId: chat.user._id })}
                    onBlur={() => emit('typing:stop', { receiverId: chat.user._id })}
                />
                <button
                    type="submit"
                    disabled={!text.trim() || sending}
                    className={`p-2 rounded-full flex items-center justify-center transition-colors ${text.trim() ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}
                >
                    <span className="material-icons text-sm">send</span>
                </button>
            </form>
        </div>
    );
}

// --- Main Container ---
export default function MessagingWidget() {
    const { user, isAuthenticated } = useAuth();
    const { socket } = useSocket();
    const location = useLocation();

    // Hide on the main messages page
    const isMessagesPage = location.pathname.startsWith('/messages');

    // Array of active chats: { user: UserObj, isMinimized: boolean, unread: number, newMessage: MsgObj | null }
    const [activeChats, setActiveChats] = useState([]);

    useEffect(() => {
        if (!socket || !isAuthenticated || isMessagesPage) return;

        const handleNewMessage = (msg) => {
            // Don't show our own messages in bubbles automatically unless we have it open
            if (msg.sender?._id === user?._id || msg.sender === user?._id) return;

            const senderObj = msg.sender?._id
                ? msg.sender
                : { _id: msg.sender || 'unknown', name: msg.callerName || 'Người dùng', avatar: msg.callerAvatar || null };

            setActiveChats(prev => {
                const existingIndex = prev.findIndex(c => c.user._id === senderObj._id);

                if (existingIndex > -1) {
                    // Chat exists. We update it.
                    const newChats = [...prev];
                    const curr = newChats[existingIndex];
                    // If it's minimized, increment unread count
                    const unread = curr.isMinimized ? curr.unread + 1 : 0;
                    newChats[existingIndex] = { ...curr, unread, newMessage: msg };
                    return newChats;
                } else {
                    // New chat bubble
                    return [...prev, {
                        user: senderObj,
                        isMinimized: false,
                        unread: 0,
                        newMessage: msg
                    }];
                }
            });

            // Play sound
            try {
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => { }); // ignore autoplay block
            } catch (e) { }
        };

        socket.on('message:received', handleNewMessage);
        return () => socket.off('message:received', handleNewMessage);
    }, [socket, isAuthenticated, isMessagesPage, user?._id]);

    if (!isAuthenticated || isMessagesPage || activeChats.length === 0) return null;

    const toggleMinimize = (userId) => {
        setActiveChats(prev => prev.map(c =>
            c.user._id === userId ? { ...c, isMinimized: !c.isMinimized, unread: 0 } : c
        ));
    };

    const closeChat = (userId) => {
        setActiveChats(prev => prev.filter(c => c.user._id !== userId));
    };

    const markRead = (userId) => {
        setActiveChats(prev => prev.map(c =>
            c.user._id === userId ? { ...c, unread: 0, newMessage: null } : c
        ));
    };

    return (
        <div className="fixed bottom-0 right-4 z-[9900] flex items-end gap-3 pointer-events-none">
            {/* 
        pointer-events-none on container so we can click through it, 
        and pointer-events-auto on children 
      */}

            {/* Render open chat windows next to each other */}
            <div className="flex items-end gap-3 pointer-events-auto">
                {activeChats.filter(c => !c.isMinimized).map(chat => (
                    <ChatWindow
                        key={chat.user._id}
                        chat={chat}
                        onClose={() => closeChat(chat.user._id)}
                        onMinimize={() => toggleMinimize(chat.user._id)}
                        onMarkRead={() => markRead(chat.user._id)}
                    />
                ))}
            </div>

            {/* Render minimized bubbles stacked vertically or horizontally */}
            <div className="flex flex-col-reverse gap-3 mb-4 pointer-events-auto">
                {activeChats.filter(c => c.isMinimized).map(chat => (
                    <button
                        key={chat.user._id}
                        onClick={() => toggleMinimize(chat.user._id)}
                        className="relative w-14 h-14 glass-card premium-lift rounded-full shadow-2xl flex items-center justify-center p-0.5 group animate-in zoom-in-50"
                    >
                        {chat.user.avatar ? (
                            <img src={chat.user.avatar} alt={chat.user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center"><span className="material-icons text-primary">person</span></div>
                        )}

                        {/* Unread Badge */}
                        {chat.unread > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                {chat.unread > 9 ? '9+' : chat.unread}
                            </span>
                        )}

                        {/* Close Button on hover */}
                        <div
                            onClick={(e) => { e.stopPropagation(); closeChat(chat.user._id); }}
                            className="absolute -top-1 -left-1 bg-gray-800 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-700 shadow-sm"
                        >
                            <span className="material-icons text-[12px]">close</span>
                        </div>

                        {/* Tooltip */}
                        <div className="absolute right-full mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {chat.user.name}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
