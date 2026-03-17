import React, { useState, useEffect } from 'react';
import { usersAPI, messagesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SendModal = ({ isOpen, onClose, jobTitle, jobId, jobUrl, onSent }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      // Load initial connections
      // Note: In a real app, connections might be populated in the user object or fetched
      if (user.connections && user.connections.length > 0) {
        // If they are IDs, we might need to fetch details, but assuming they are populated for now
        // or we fetch them from the GET /api/users endpoint filtered by IDs
        setConnections(user.connections);
      }
    }
  }, [isOpen, user]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setLoading(true);
        try {
          const query = searchQuery.startsWith('@') ? searchQuery.substring(1) : searchQuery;
          // Use role: 'all' to find both freelancers and clients
          const res = await usersAPI.getFreelancers({ search: query, role: 'all', limit: 10 });
          setResults(res.data.users || []);
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const toggleUserSelection = (u) => {
    const isSelected = selectedUsers.find(curr => curr._id === u._id);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(curr => curr._id !== u._id));
    } else {
      setSelectedUsers([...selectedUsers, u]);
    }
  };

  const handleSend = async () => {
    if (selectedUsers.length === 0) return;
    setSending(true);
    try {
      const messageText = `Chào bạn, tôi muốn chia sẻ công việc này với bạn: ${jobTitle}\n\nLiên kết: ${jobUrl}`;

      await Promise.all(selectedUsers.map(u =>
        messagesAPI.sendMessage({
          receiverId: u._id,
          content: messageText,
          type: 'job-share',
          jobRef: jobId
        })
      ));

      alert(`Đã gửi công việc cho ${selectedUsers.length} người!`);
      onSent();
      onClose();
    } catch (err) {
      console.error('Send error:', err);
      alert('Có lỗi xảy ra khi gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <span className="material-icons text-primary">send</span> Gửi bài viết
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="p-4 bg-white">
          <div className="relative mb-4">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
            <input
              type="text"
              placeholder="Tìm bạn bè hoặc @tên_người_dùng..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[350px] custom-scrollbar">
            {searchQuery.length > 0 ? (
              <>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Kết quả tìm kiếm</p>
                {loading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : results.length > 0 ? (
                  results.map(u => (
                    <UserItem
                      key={u._id}
                      user={u}
                      isSelected={selectedUsers.some(curr => curr._id === u._id)}
                      onToggle={() => toggleUserSelection(u)}
                    />
                  ))
                ) : (
                  <p className="text-center py-8 text-sm text-gray-500 italic">Không tìm thấy người dùng nào</p>
                )}
              </>
            ) : (
              <>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Gợi ý từ kết nối</p>
                {connections.length > 0 ? (
                  connections.map(u => (
                    <UserItem
                      key={u._id}
                      user={u}
                      isSelected={selectedUsers.some(curr => curr._id === u._id)}
                      onToggle={() => toggleUserSelection(u)}
                    />
                  ))
                ) : (
                  <p className="text-center py-8 text-sm text-gray-400 px-4">Hãy thử tìm kiếm @tên người dùng để gửi cho bất cứ ai</p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-50 bg-gray-50 flex items-center justify-between">
          <div className="flex -space-x-2">
            {selectedUsers.slice(0, 3).map(u => (
              <img key={u._id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white object-cover" title={u.name} />
            ))}
            {selectedUsers.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                +{selectedUsers.length - 3}
              </div>
            )}
          </div>
          <button
            disabled={selectedUsers.length === 0 || sending}
            onClick={handleSend}
            className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
          >
            {sending ? 'Đang gửi...' : `Gửi (${selectedUsers.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserItem = ({ user, isSelected, onToggle }) => (
  <div
    onClick={onToggle}
    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors mb-1 ${isSelected ? 'bg-primary/5 border border-primary/20' : 'hover:bg-gray-50 border border-transparent'}`}
  >
    <div className="relative">
      {user.avatar ? (
        <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          {user.name.charAt(0)}
        </div>
      )}
      {isSelected && (
        <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
          <span className="material-icons text-[10px]">check</span>
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
      <p className="text-[10px] text-gray-500 truncate">{user.headline || 'Người dùng nền tảng'}</p>
    </div>
  </div>
);

export default SendModal;
