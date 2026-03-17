import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { jobsAPI, usersAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ApplyModal from '../components/ApplyModal';
import ImageLightbox from '../components/ImageLightbox';
import ShareModal from '../components/ShareModal';
import SendModal from '../components/SendModal';

const postActionIcons = { Like: 'thumb_up_off_alt', Comment: 'comment', Share: 'share', Send: 'send' };
const postActions = ['Like', 'Comment', 'Share', 'Send'];

const reactionsList = [
  { id: 'like', icon: 'thumb_up', label: 'Thích', color: 'text-blue-500' },
  { id: 'love', icon: 'favorite', label: 'Yêu thích', color: 'text-red-500' },
  { id: 'care', icon: 'volunteer_activism', label: 'Thương thương', color: 'text-orange-400' },
  { id: 'haha', icon: 'sentiment_very_satisfied', label: 'Haha', color: 'text-yellow-500' },
  { id: 'wow', icon: 'sentiment_neutral', label: 'Wow', color: 'text-yellow-600' },
  { id: 'sad', icon: 'sentiment_dissatisfied', label: 'Buồn', color: 'text-blue-400' },
  { id: 'angry', icon: 'sentiment_very_dissatisfied', label: 'Phẫn nộ', color: 'text-red-600' },
];

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

function JobCard({ job, t, onApply, isHighlighted, onRefresh, setPreviewImage, onShare, onSend }) {
  const [reactions, setReactions] = useState(job.reactions || []);
  const [userReaction, setUserReaction] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(job.comments || []);
  const [commentText, setCommentText] = useState('');
  const [shareCount, setShareCount] = useState(job.shares?.length || 0);
  const [sendCount, setSendCount] = useState(job.sends?.length || 0);
  const { user } = useAuth();
  const reactionTimeout = useRef(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showJobOptions, setShowJobOptions] = useState(false);
  const dropdownRef = useRef(null);
  const [isSaved, setIsSaved] = useState(job.isSaved || false);
  const [commentImage, setCommentImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [commentMention, setCommentMention] = useState(null);
  const [replyImage, setReplyImage] = useState(null);
  const [uploadingReplyImage, setUploadingReplyImage] = useState(false);
  const [replyMention, setReplyMention] = useState(null);
  const commentFileRef = useRef(null);
  const replyFileRef = useRef(null);
  const commentMenuRef = useRef(null);
  const [activeMenu, setActiveMenu] = useState(null); // { type: 'comment'|'reply', id }

  const handleImageUpload = async (file, type = 'comment') => {
    if (!file) return;
    try {
      if (type === 'comment') setUploadingImage(true);
      else setUploadingReplyImage(true);

      const formData = new FormData();
      formData.append('image', file);
      const res = await axios.post(`https://api.imgbb.com/1/upload?key=6ad8b3a7e1ef39bceed6f960fcdea074`, formData);

      if (type === 'comment') setCommentImage(res.data.data.url);
      else setReplyImage(res.data.data.url);
    } catch (err) {
      console.error('ImgBB upload error:', err);
      alert('Không thể tải ảnh lên');
    } finally {
      if (type === 'comment') setUploadingImage(false);
      else setUploadingReplyImage(false);
    }
  };

  useEffect(() => {
    if (job.reactions) setReactions(job.reactions);
    if (job.comments) setComments(job.comments);
  }, [job.reactions, job.comments]);

  useEffect(() => {
    setIsSaved(job.isSaved || false);
  }, [job.isSaved]);

  useEffect(() => {
    if (user && reactions) {
      const found = reactions.find(r => r.user && (r.user._id || r.user).toString() === user._id.toString());
      if (found) setUserReaction(found.type);
      else setUserReaction(null);
    }
  }, [user, reactions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowJobOptions(false);
      }
    };
    if (showJobOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showJobOptions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (commentMenuRef.current && !commentMenuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  const handleToggleSaveJob = async () => {
    try {
      const res = await jobsAPI.toggleSavedJob(job._id);
      if (res.data.success) {
        setIsSaved(res.data.isSaved);
        setShowJobOptions(false);
      }
    } catch (err) {
      console.error('Toggle save error:', err);
    }
  };

  const handleReact = async (type) => {
    try {
      const res = await jobsAPI.reactJob(job._id, type);
      setUserReaction(res.data.userReaction);

      // Update local reactions list to keep count in sync
      setReactions(prev => {
        const index = prev.findIndex(r => r.user && (r.user._id || r.user).toString() === user._id.toString());
        if (index > -1) {
          if (res.data.userReaction === null) {
            // Unliked
            return prev.filter((_, i) => i !== index);
          } else {
            // Changed reaction
            const next = [...prev];
            next[index] = { ...next[index], type: res.data.userReaction };
            return next;
          }
        } else if (res.data.userReaction) {
          // New reaction
          return [...prev, { user: user._id, type: res.data.userReaction }];
        }
        return prev;
      });
    } catch (err) {
      console.error('React error:', err);
    }
    setShowReactionPicker(false);
  };

  const [blockConfirm, setBlockConfirm] = useState(null); // { userId, name }

  const handleBlockUser = (userId, name) => {
    setBlockConfirm({ userId, name });
    setActiveMenu(null);
  };

  const handleConfirmBlock = async () => {
    if (!blockConfirm) return;
    try {
      await usersAPI.blockUser(blockConfirm.userId);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Block error:', err);
    } finally {
      setBlockConfirm(null);
    }
  };

  const [editingContent, setEditingContent] = useState(null);
  const [reportModal, setReportModal] = useState(null);
  const [blockingUser, setBlockingUser] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDeleteComment = (commentId) => {
    setDeleteConfirm({ type: 'comment', commentId });
  };

  const handleDeleteReply = (commentId, replyId) => {
    setDeleteConfirm({ type: 'reply', commentId, replyId });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'comment') {
        await jobsAPI.deleteComment(job._id, deleteConfirm.commentId);
        setComments(prev => prev.filter(c => c._id !== deleteConfirm.commentId));
      } else {
        await jobsAPI.deleteReply(job._id, deleteConfirm.commentId, deleteConfirm.replyId);
        setComments(prev => prev.map(c =>
          c._id === deleteConfirm.commentId
            ? { ...c, replies: c.replies.filter(r => r._id !== deleteConfirm.replyId) }
            : c
        ));
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const [reportReason, setReportReason] = useState('Spam');

  const handleUpdateContent = async () => {
    if (!editingContent.text.trim()) return;
    try {
      if (editingContent.type === 'comment') {
        const res = await jobsAPI.updateComment(job._id, editingContent.id, { text: editingContent.text });
        setComments(prev => prev.map(c => c._id === editingContent.id ? { ...c, text: res.data.comment.text } : c));
      } else {
        const res = await jobsAPI.updateReply(job._id, editingContent.commentId, editingContent.id, { text: editingContent.text });
        setComments(prev => prev.map(c =>
          c._id === editingContent.commentId
            ? { ...c, replies: c.replies.map(r => r._id === editingContent.id ? { ...r, text: res.data.reply.text } : r) }
            : c
        ));
      }
      setEditingContent(null);
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handleReportSubmit = async (reason) => {
    try {
      await jobsAPI.reportSocial({
        ...reportModal,
        jobId: job._id,
        reason
      });
      alert('Báo cáo của bạn đã được gửi. Cảm ơn bạn đã phản hồi!');
      setReportModal(null);
    } catch (err) {
      console.error('Report error:', err);
    }
  };

  const fetchJobData = async () => {
    // Optionally re-fetch this specific job to get latest counts accurately
    // For now, let's just rely on the next dashboard refresh or manual sync
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && !commentImage) return;
    try {
      const res = await jobsAPI.commentJob(job._id, commentText, commentImage, commentMention?.userId, commentMention?.name);
      // Ensure user info is attached for immediate display
      const newC = { ...res.data.comment, user: user, replies: [] };
      setComments([...comments, newC]);
      setCommentText('');
      setCommentImage(null);
      setCommentMention(null);
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleReply = async (commentId) => {
    if (!replyText.trim() && !replyImage) return;
    try {
      const res = await jobsAPI.replyComment(job._id, commentId, replyText, replyImage, replyMention?.userId, replyMention?.name);
      setComments(prev => prev.map(c =>
        c._id === commentId ? { ...c, replies: [...(c.replies || []), { ...res.data.reply, user: user }] } : c
      ));
      setReplyText('');
      setReplyImage(null);
      setReplyMention(null);
    } catch (err) {
      console.error('Reply error:', err);
    }
  };

  const handleReplyToUser = (commentId, userId, userName) => {
    setReplyTo(commentId);
    setReplyText(`@${userName} `);
    setReplyMention({ userId, name: userName });
  };

  const handleCommentReact = async (commentId, type) => {
    try {
      const res = await jobsAPI.reactComment(job._id, commentId, type);
      setComments(prev => prev.map(c =>
        (c._id || c).toString() === commentId.toString() ? { ...c, reactions: res.data.reactions } : c
      ));
    } catch (err) {
      console.error('Comment react error:', err);
    }
  };

  const handleReplyReact = async (commentId, replyId, type) => {
    try {
      const res = await jobsAPI.reactReply(job._id, commentId, replyId, type);
      setComments(prev => prev.map(c =>
        (c._id || c).toString() === commentId.toString() ? {
          ...c,
          replies: c.replies.map(r => (r._id || r).toString() === replyId.toString() ? { ...r, reactions: res.data.reactions } : r)
        } : c
      ));
    } catch (err) {
      console.error('Reply react error:', err);
    }
  };

  const [hoveredReply, setHoveredReply] = useState(null);
  const replyReactionTimeout = useRef(null);

  const [hoveredComment, setHoveredComment] = useState(null);
  const commentReactionTimeout = useRef(null);

  // Helper for reaction icons in comments
  const renderReactionIcons = (reactions) => {
    if (!reactions || reactions.length === 0) return null;
    const types = [...new Set(reactions.map(r => r.type))].slice(0, 3);
    return (
      <div className="flex items-center gap-0.5 bg-white shadow-sm border border-gray-100 rounded-full px-1 py-0.5 ml-1">
        {types.map(t => (
          <span key={t} className={`material-symbols-outlined text-[10px] ${reactionsList.find(r => r.id === t)?.color}`}>
            {reactionsList.find(r => r.id === t)?.icon}
          </span>
        ))}
        <span className="text-[10px] text-gray-600 font-bold ml-0.5">{reactions.length}</span>
      </div>
    );
  };

  const handleShare = () => {
    onShare(job);
  };

  const handleSend = () => {
    onSend(job);
  };

  // UI Helpers
  const currentReaction = reactionsList.find(r => r.id === userReaction) || reactionsList[0];
  const totalReactions = reactions.length;
  const topReactions = [...new Set(reactions.map(r => {
    const rUserId = r.user?._id || r.user;
    return rUserId?.toString() === user?._id?.toString() ? userReaction : r.type;
  }))].filter(Boolean).slice(0, 3);


  return (
    <article
      id={`job-${job._id}`}
      className={`rounded-lg shadow-sm border border-gray-200 mb-4 relative transition-all duration-1000 ${isHighlighted ? 'ring-2 ring-primary ring-offset-2 bg-blue-50/20' : 'bg-white'}`}
    >
      <div className="p-4 pb-2">
        <div className="flex justify-between items-start mb-2">
          <div className="text-xs text-gray-500">
            {job.matchScore ? `🎯 Phù hợp ${job.matchScore}% với hồ sơ của bạn` : 'Gợi ý dành cho bạn'}
          </div>
          <div className="flex gap-2 relative" ref={dropdownRef}>
            {shareCount > 0 && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{shareCount} lượt chia sẻ</span>}
            <button
              onMouseDown={(e) => {
                e.stopPropagation();
                setShowJobOptions(!showJobOptions);
              }}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${showJobOptions ? 'bg-gray-100 text-primary' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
            >
              <span className="material-icons text-[20px]">more_horiz</span>
            </button>

            {/* Premium Post Dropdown */}
            {showJobOptions && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[70] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 origin-top-right">
                <button
                  onClick={handleToggleSaveJob}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className={`material-icons text-lg ${isSaved ? 'text-blue-600' : 'text-gray-400'}`}>
                    {isSaved ? 'bookmark' : 'bookmark_border'}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold">{isSaved ? 'Đã lưu' : 'Lưu công việc'}</span>
                    <span className="text-[11px] text-gray-500">Xem lại sau trong mục việc đã lưu</span>
                  </div>
                </button>
                <button
                  onClick={() => { setShowJobOptions(false); alert('Chức năng này đang được phát triển'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="material-icons text-lg text-gray-400">visibility_off</span>
                  <div className="flex flex-col">
                    <span className="font-semibold">Ẩn bài viết</span>
                    <span className="text-[11px] text-gray-500">Giảm bớt gợi ý tương tự</span>
                  </div>
                </button>
                <div className="h-[1px] bg-gray-100 my-1 mx-2" />
                <button
                  onClick={() => {
                    setReportModal({ type: 'job', id: job._id, accusedUser: job.client, contentPreview: job.title });
                    setShowJobOptions(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <span className="material-icons text-lg">flag</span>
                  <div className="flex flex-col">
                    <span className="font-semibold">Báo cáo bài viết</span>
                    <span className="text-[11px] text-red-400">Nội dung không phù hợp hoặc lừa đảo</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-white rounded p-1 w-12 h-12 flex items-center justify-center border border-gray-100 flex-shrink-0 overflow-hidden">
            {job.client?.avatar
              ? <img alt={job.client?.name} className="w-10 h-10 object-contain" src={job.client.avatar} />
              : <span className="material-icons text-primary text-2xl">business</span>
            }
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-primary hover:underline cursor-pointer">{job.title}</h3>
            <p className="text-sm text-gray-800">{job.client?.name || job.client?.company || 'Khách hàng'}</p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                {job.workType === 'remote' ? '🌐' : job.workType === 'hybrid' ? '🏢' : '📍'} {job.workType} · {job.applicantCount || 0} ứng viên · {new Date(job.createdAt).toLocaleDateString('vi-VN')}
              </p>
              {job.type && (
                <span className="flex items-center gap-0.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                  <span className="material-icons text-[12px]">{getTypeIcon(job.type)}</span>
                  {job.type}
                </span>
              )}
              {job.niche && (Array.isArray(job.niche) ? job.niche : [job.niche]).map(n => (
                <span key={n} className="flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                  <span className="material-icons text-[12px]">{getNicheIcon(n)}</span>
                  {n}
                </span>
              ))}
            </div>
          </div>
          {job.client?._id === user?._id ? (
            <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full font-medium">Bạn là chủ bài đăng</span>
          ) : job.hasApplied ? (
            <button disabled className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold h-fit flex items-center gap-1">
              <span className="material-icons text-sm">check_circle</span>
              Đã ứng tuyển
            </button>
          ) : (
            <button
              onClick={() => onApply(job)}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-1.5 rounded-full text-sm font-semibold h-fit transition-colors"
            >
              {t('jobSearch.detail.apply')}
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-4 py-3 flex items-center justify-between text-sm text-gray-500 border-t border-gray-50 mx-4">
        <div className="flex items-center gap-2">
          {totalReactions > 0 && (
            <div className="flex items-center gap-1.5 cursor-pointer hover:underline" onClick={() => setShowReactionPicker(prev => !prev)}>
              <div className="flex -space-x-1">
                {topReactions.map(type => (
                  <div key={type} className={`p-0.5 rounded-full bg-white ring-1 ring-gray-100 ${reactionsList.find(r => r.id === type)?.color}`}>
                    <span className="material-symbols-outlined text-[13px] block" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {reactionsList.find(r => r.id === type)?.icon}
                    </span>
                  </div>
                ))}
              </div>
              <span className="text-[13px] font-medium">{totalReactions}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 text-[13px]">
          {comments.length > 0 && <span className="hover:underline cursor-pointer" onClick={() => setShowComments(!showComments)}>{comments.length} bình luận</span>}
          {shareCount > 0 && <span>{shareCount} chia sẻ</span>}
          {sendCount > 0 && <span>{sendCount} gửi</span>}
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-4 py-1 flex items-center justify-between border-t border-b border-gray-100 mx-4 relative">
        {showReactionPicker && (
          <div
            className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-2xl border border-gray-100 p-1.5 flex gap-2 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-200"
            onMouseEnter={() => clearTimeout(reactionTimeout.current)}
            onMouseLeave={() => setShowReactionPicker(false)}
          >
            {reactionsList.map(r => (
              <button
                key={r.id}
                onClick={() => { handleReact(r.id); setShowReactionPicker(false); }}
                className="hover:scale-150 transition-transform duration-200 p-1 group flex flex-col items-center relative"
              >
                <div className={`${r.color}`}>
                  <span className="material-symbols-outlined text-2xl block" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {r.icon}
                  </span>
                </div>
                <span className="absolute -top-9 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                  {r.label}
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          onMouseEnter={() => {
            reactionTimeout.current = setTimeout(() => setShowReactionPicker(true), 500);
          }}
          onMouseLeave={() => {
            clearTimeout(reactionTimeout.current);
          }}
          onClick={() => handleReact('like')}
          className={`flex-1 flex items-center justify-center space-x-2 py-1.5 rounded-md hover:bg-gray-100 transition-all font-semibold ${userReaction ? currentReaction.color : 'text-gray-600'}`}
        >
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: userReaction ? "'FILL' 1" : "'FILL' 0" }}>
            {userReaction ? currentReaction.icon : 'thumb_up'}
          </span>
          <span className="hidden sm:block text-[13px]">{userReaction ? currentReaction.label : 'Thích'}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex-1 flex items-center justify-center space-x-2 py-1.5 rounded-md hover:bg-gray-100 transition-all font-semibold ${showComments ? 'text-primary' : 'text-gray-600'}`}
        >
          <span className="material-symbols-outlined text-xl">chat_bubble</span>
          <span className="hidden sm:block text-[13px]">Bình luận</span>
        </button>

        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center space-x-2 py-1.5 rounded-md hover:bg-gray-100 transition-all font-semibold text-gray-600"
        >
          <span className="material-symbols-outlined text-xl">share</span>
          <span className="hidden sm:block text-[13px]">Chia sẻ</span>
        </button>

        <button
          onClick={handleSend}
          className="flex-1 flex items-center justify-center space-x-2 py-1.5 rounded-md hover:bg-gray-100 transition-all font-semibold text-gray-600"
        >
          <span className="material-symbols-outlined text-xl">send</span>
          <span className="hidden sm:block text-[13px]">Gửi</span>
        </button>
      </div>

      {showComments && (
        <div className="p-4 bg-white">
          <form onSubmit={handleComment} className="flex flex-col mb-4 bg-white p-2 rounded-lg border border-gray-200">
            <div className="flex gap-2">
              {user?.avatar
                ? <img src={user.avatar} className="w-8 h-8 rounded-full" alt="Me" />
                : <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><span className="material-icons text-gray-400 text-sm">person</span></div>
              }
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Viết bình luận..."
                  className="w-full bg-gray-100 border-none rounded-2xl pl-4 pr-20 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={commentFileRef}
                    onChange={(e) => handleImageUpload(e.target.files[0], 'comment')}
                  />
                  <button
                    type="button"
                    onClick={() => setCommentMention({ userId: job.client?._id, name: job.client?.name })}
                    className={`material-icons text-xl hover:text-primary transition-colors ${commentMention ? 'text-primary' : 'text-gray-400'}`}
                    title="Nhắc tên chủ bài đăng"
                  >
                    alternate_email
                  </button>
                  <button
                    type="button"
                    onClick={() => commentFileRef.current.click()}
                    className="material-icons text-xl text-gray-400 hover:text-primary"
                  >
                    image
                  </button>
                  <button
                    type="submit"
                    className={`material-icons text-xl transition-colors ${commentText.trim() || commentImage ? 'text-primary' : 'text-gray-300'}`}
                  >
                    send
                  </button>
                </div>
              </div>
            </div>
            {commentMention && (
              <div className="ml-10 mt-2 text-[10px] text-primary flex items-center gap-1">
                <span className="material-icons text-xs">alternate_email</span>
                Đang nhắc tên <strong>{commentMention.name}</strong>
                <button onClick={() => setCommentMention(null)} className="material-icons text-xs text-gray-400 hover:text-gray-600">close</button>
              </div>
            )}
            {uploadingImage && <div className="ml-10 mt-2 text-[10px] text-gray-500 flex items-center gap-1"><span className="material-icons animate-spin text-xs">autorenew</span> Đang tải ảnh...</div>}
            {commentImage && (
              <div className="ml-10 mt-2 relative w-20 h-20 group">
                <img src={commentImage} className="w-full h-full object-cover rounded border border-gray-200" alt="Preview" />
                <button
                  type="button"
                  onClick={() => setCommentImage(null)}
                  className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-icons text-xs">close</span>
                </button>
              </div>
            )}
          </form>
          <div className="space-y-4">
            {comments.map((c, i) => (
              <div key={c._id || i} className="flex gap-2 group/comment">
                {c.user?.avatar
                  ? <img src={c.user.avatar} className="w-8 h-8 rounded-full object-cover" alt="User" />
                  : <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0"><span className="material-icons text-gray-400 text-sm">person</span></div>
                }
                <div className="flex-1 max-w-full">
                  <div className="bg-gray-100 rounded-2xl px-3 py-2 inline-block max-w-full relative">
                    <p className="text-xs font-bold text-gray-900 leading-tight">{c.user?.name || 'User'}</p>
                    {editingContent?.id === c._id ? (
                      <div className="mt-1">
                        <textarea
                          className="w-full text-xs p-1 border rounded"
                          value={editingContent.text}
                          onChange={(e) => setEditingContent({ ...editingContent, text: e.target.value })}
                          autoFocus
                        />
                        <div className="flex justify-end gap-1 mt-1">
                          <button onClick={() => setEditingContent(null)} className="text-[10px] text-gray-500">Hủy</button>
                          <button onClick={handleUpdateContent} className="text-[10px] text-primary font-bold">Lưu</button>
                        </div>
                      </div>
                    ) : c.isBlockedContent ? (
                      <div className="bg-gray-200/50 border border-gray-300/50 rounded p-2 mt-1 flex items-center gap-2 text-gray-500 italic">
                        <span className="material-icons text-sm">block</span>
                        <span className="text-[10px]">Bình luận này đã bị ẩn do cài đặt chặn. Bỏ chặn để xem nội dung.</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-800 break-words mt-0.5 whitespace-pre-wrap">
                        {c.mention && (
                          <Link to={`/profile/${c.mention.user}`} className="text-primary font-bold hover:underline mr-1">
                            @{c.mention.name}
                          </Link>
                        )}
                        {c.text}
                      </p>
                    )}
                    {c.image && !c.isBlockedContent && (
                      <div
                        className={`${c.text ? 'mt-2' : 'mt-1'} rounded-lg overflow-hidden w-fit max-w-full cursor-pointer hover:opacity-90 transition-opacity`}
                        onClick={() => setPreviewImage(c.image)}
                      >
                        <img src={c.image} alt="Comment attachment" className="max-w-[200px] sm:max-w-[350px] md:max-w-[450px] object-contain block shadow-sm border border-gray-200/50" />
                      </div>
                    )}
                    {/* Floating Reaction Count for Comment */}
                    <div className="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2">
                      {renderReactionIcons(c.reactions)}
                    </div>

                    {/* Options Menu for Comment */}
                    <div className="absolute top-1 right-1 transition-opacity">
                      <button
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu?.id === c._id ? null : { type: 'comment', id: c._id });
                        }}
                        className={`flex items-center justify-center w-6 h-6 rounded-full transition-all ${activeMenu?.id === c._id ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                      >
                        <span className="material-icons text-[16px]">more_horiz</span>
                      </button>
                      {activeMenu?.id === c._id && (
                        <div 
                          ref={commentMenuRef}
                          className="absolute right-0 top-full mt-1 bg-white shadow-2xl border border-gray-100 rounded-xl py-2 w-44 z-[60] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 origin-top-right"
                        >
                          {c.user?._id === user?._id ? (
                            <>
                              <button onClick={() => { setEditingContent({ type: 'comment', id: c._id, text: c.text }); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                                <span className="material-icons text-lg text-gray-400">edit</span> 
                                <span className="font-medium">Chỉnh sửa</span>
                              </button>
                              <button onClick={() => { handleDeleteComment(c._id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                                <span className="material-icons text-lg">delete</span> 
                                <span className="font-medium">Xóa bình luận</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setReportModal({ type: 'comment', id: c._id, accusedUser: c.user?._id, contentPreview: c.text }); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                                <span className="material-icons text-lg text-gray-400">flag</span> 
                                <span className="font-medium">Báo cáo</span>
                              </button>
                              <button onClick={() => { handleBlockUser(c.user?._id, c.user?.name); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                                <span className="material-icons text-lg text-gray-400">block</span> 
                                <span className="font-medium">Chặn {c.user?.name}</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1 px-2 relative">
                    {/* Comment Reaction Picker */}
                    <div className="relative">
                      <button
                        onMouseEnter={() => {
                          commentReactionTimeout.current = setTimeout(() => setHoveredComment(c._id), 500);
                        }}
                        onMouseLeave={() => {
                          clearTimeout(commentReactionTimeout.current);
                        }}
                        onClick={() => handleCommentReact(c._id, 'like')}
                        className={`text-[11px] font-bold hover:underline ${c.reactions?.some(r => r.user && (r.user._id || r.user).toString() === user?._id?.toString())
                          ? reactionsList.find(r => r.id === c.reactions.find(rr => rr.user && (rr.user._id || rr.user).toString() === user?._id?.toString())?.type)?.color || 'text-primary'
                          : 'text-gray-500'}`}
                      >
                        {c.reactions?.some(r => r.user && (r.user._id || r.user).toString() === user?._id?.toString())
                          ? reactionsList.find(r => r.id === c.reactions.find(rr => rr.user && (rr.user._id || rr.user).toString() === user?._id?.toString())?.type)?.label || 'Thích'
                          : 'Thích'}
                      </button>

                      {hoveredComment === c._id && (
                        <div
                          className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg border border-gray-100 p-1 flex gap-1 z-50 animate-in fade-in slide-in-from-bottom-1"
                          onMouseEnter={() => clearTimeout(commentReactionTimeout.current)}
                          onMouseLeave={() => setHoveredComment(null)}
                        >
                          {reactionsList.map(r => (
                            <button key={r.id} onClick={() => { handleCommentReact(c._id, r.id); setHoveredComment(null); }} className="hover:scale-150 transition-transform p-0.5">
                              <span className={`material-icons text-lg ${r.color}`}>{r.icon}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleReplyToUser(c._id, c.user?._id, c.user?.name)}
                      className="text-[11px] font-bold text-gray-500 hover:underline"
                    >
                      Phản hồi
                    </button>
                    <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>

                  {/* Replies List */}
                  {c.replies?.length > 0 && (
                    <div className="mt-2 space-y-3 ml-2 border-l-2 border-gray-200 pl-4">
                      {c.replies.map((reply, ri) => (
                        <div key={reply._id || ri} className="flex gap-2">
                          {reply.user?.avatar
                            ? <img src={reply.user.avatar} className="w-6 h-6 rounded-full object-cover" alt="User" />
                            : <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0"><span className="material-icons text-gray-400 text-[10px]">person</span></div>
                          }
                          <div className="flex-1">
                            <div className="bg-gray-100 rounded-2xl px-3 py-1.5 inline-block max-w-full relative group/reply">
                              <p className="text-[11px] font-bold text-gray-900">{reply.user?.name || 'User'}</p>
                              {editingContent?.id === reply._id ? (
                                <div className="mt-1">
                                  <textarea
                                    className="w-full text-[10px] p-1 border rounded bg-white"
                                    value={editingContent.text}
                                    onChange={(e) => setEditingContent({ ...editingContent, text: e.target.value })}
                                    autoFocus
                                  />
                                  <div className="flex justify-end gap-1 mt-1">
                                    <button onClick={() => setEditingContent(null)} className="text-[10px] text-gray-500">Hủy</button>
                                    <button onClick={handleUpdateContent} className="text-[10px] text-primary font-bold">Lưu</button>
                                  </div>
                                </div>
                              ) : reply.isBlockedContent ? (
                                <div className="bg-gray-200/50 border border-gray-300/50 rounded px-2 py-1.5 mt-1 flex items-center gap-1.5 text-gray-500 italic">
                                  <span className="material-icons text-[12px]">block</span>
                                  <span className="text-[9px]">Phản hồi đã bị ẩn.</span>
                                </div>
                              ) : (
                                <p className="text-[11px] text-gray-800 break-words mt-0.5">
                                  {reply.mention && (
                                    <Link
                                      to={`/profile/${reply.mention.user}`}
                                      className="text-primary font-bold hover:underline mr-1"
                                    >
                                      @{reply.mention.name}
                                    </Link>
                                  )}
                                  {reply.text.startsWith(`@${reply.mention?.name} `)
                                    ? reply.text.substring(reply.mention.name.length + 2)
                                    : reply.text
                                  }
                                </p>
                              )}
                              {reply.image && !reply.isBlockedContent && (
                                <div
                                  className={`${reply.text ? 'mt-1.5' : 'mt-0.5'} rounded overflow-hidden w-fit max-w-full cursor-pointer hover:opacity-90 transition-opacity`}
                                  onClick={() => setPreviewImage(reply.image)}
                                >
                                  <img src={reply.image} alt="Reply attachment" className="max-w-[150px] sm:max-w-[250px] object-contain block shadow-sm border border-gray-200/50" />
                                </div>
                              )}

                              {/* Options Menu for Reply */}
                              <div className="absolute top-1 right-1 transition-opacity">
                                <button
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    setActiveMenu(activeMenu?.id === reply._id ? null : { type: 'reply', id: reply._id });
                                  }}
                                  className={`flex items-center justify-center w-5 h-5 rounded-full transition-all ${activeMenu?.id === reply._id ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                                >
                                  <span className="material-icons text-[14px]">more_horiz</span>
                                </button>
                                {activeMenu?.id === reply._id && (
                                  <div 
                                    ref={commentMenuRef}
                                    className="absolute right-0 top-full mt-1 bg-white shadow-2xl border border-gray-100 rounded-xl py-1.5 w-40 z-[60] animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-300 origin-top-right"
                                  >
                                    {reply.user?._id === user?._id ? (
                                      <>
                                        <button onClick={() => { setEditingContent({ type: 'reply', id: reply._id, text: reply.text, commentId: c._id }); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                                          <span className="material-icons text-base text-gray-400">edit</span> 
                                          <span className="font-medium">Sửa</span>
                                        </button>
                                        <button onClick={() => { handleDeleteReply(c._id, reply._id); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 text-[11px] text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                                          <span className="material-icons text-base">delete</span> 
                                          <span className="font-medium">Xóa</span>
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => { setReportModal({ type: 'reply', id: reply._id, commentId: c._id, accusedUser: reply.user?._id, contentPreview: reply.text }); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                                          <span className="material-icons text-base text-gray-400">flag</span> 
                                          <span className="font-medium">Báo cáo</span>
                                        </button>
                                        <button onClick={() => { handleBlockUser(reply.user?._id, reply.user?.name); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                                          <span className="material-icons text-base text-gray-400">block</span> 
                                          <span className="font-medium">Chặn {reply.user?.name}</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 px-2 relative">
                              <div className="relative">
                                <button
                                  onMouseEnter={() => {
                                    replyReactionTimeout.current = setTimeout(() => setHoveredReply(reply._id), 500);
                                  }}
                                  onMouseLeave={() => {
                                    clearTimeout(replyReactionTimeout.current);
                                  }}
                                  onClick={() => handleReplyReact(c._id, reply._id, 'like')}
                                  className={`text-[10px] font-bold hover:underline ${reply.reactions?.some(r => r.user && (r.user._id || r.user).toString() === user?._id?.toString())
                                    ? reactionsList.find(r => r.id === reply.reactions.find(rr => rr.user && (rr.user._id || rr.user).toString() === user?._id?.toString())?.type)?.color || 'text-primary'
                                    : 'text-gray-500'}`}
                                >
                                  {reply.reactions?.some(r => r.user && (r.user._id || r.user).toString() === user?._id?.toString())
                                    ? reactionsList.find(r => r.id === reply.reactions.find(rr => rr.user && (rr.user._id || rr.user).toString() === user?._id?.toString())?.type)?.label || 'Thích'
                                    : 'Thích'}
                                </button>

                                {hoveredReply === reply._id && (
                                  <div
                                    className="absolute bottom-full left-0 mb-1 bg-white rounded-full shadow-lg border border-gray-100 p-1 flex gap-1 z-50 animate-in fade-in slide-in-from-bottom-1"
                                    onMouseEnter={() => clearTimeout(replyReactionTimeout.current)}
                                    onMouseLeave={() => setHoveredReply(null)}
                                  >
                                    {reactionsList.map(r => (
                                      <button key={r.id} onClick={() => { handleReplyReact(c._id, reply._id, r.id); setHoveredReply(null); }} className="hover:scale-150 transition-transform p-0.5">
                                        <span className={`material-icons text-[14px] ${r.color}`}>{r.icon}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleReplyToUser(c._id, reply.user?._id, reply.user?.name)}
                                className="text-[10px] font-bold text-gray-500 hover:underline"
                              >
                                Phản hồi
                              </button>
                              <span className="text-[10px] text-gray-400">{new Date(reply.createdAt).toLocaleDateString('vi-VN')}</span>
                              {renderReactionIcons(reply.reactions)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  {replyTo === c._id && (
                    <div className="mt-2 flex flex-col animate-in fade-in slide-in-from-left-2 ml-4 bg-white p-2 rounded-lg border border-gray-100">
                      <div className="flex gap-2">
                        {user?.avatar
                          ? <img src={user.avatar} className="w-6 h-6 rounded-full" alt="Me" />
                          : <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"><span className="material-icons text-gray-400 text-[10px]">person</span></div>
                        }
                        <div className="flex-1 flex items-center relative gap-2">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Viết phản hồi..."
                            className="flex-1 bg-gray-50 border-none rounded-2xl px-3 py-1 text-xs focus:ring-1 focus:ring-primary outline-none pr-14"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleReply(c._id)}
                          />
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={replyFileRef}
                              onChange={(e) => handleImageUpload(e.target.files[0], 'reply')}
                            />
                            <button
                              onClick={() => replyFileRef.current.click()}
                              className="material-icons text-base text-gray-400 hover:text-primary"
                            >
                              image
                            </button>
                            <button
                              onClick={() => handleReply(c._id)}
                              className={`material-icons text-base ${replyText.trim() || replyImage ? 'text-primary' : 'text-gray-300'}`}
                            >
                              send
                            </button>
                          </div>
                        </div>
                        <button onClick={() => { setReplyTo(null); setReplyImage(null); }} className="text-[10px] text-gray-400 hover:text-gray-600">Hủy</button>
                      </div>
                      {uploadingReplyImage && <div className="ml-8 mt-1 text-[9px] text-gray-500 flex items-center gap-1"><span className="material-icons animate-spin text-[10px]">autorenew</span> Đang tải ảnh...</div>}
                      {replyImage && (
                        <div className="ml-8 mt-1.5 relative w-14 h-14 group">
                          <img src={replyImage} className="w-full h-full object-cover rounded border border-gray-100" alt="Preview" />
                          <button
                            type="button"
                            onClick={() => setReplyImage(null)}
                            className="absolute -top-1.5 -right-1.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="material-icons text-[10px]">close</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <span className="material-icons text-red-500">report</span> Báo cáo vi phạm
              </h3>
              <button onClick={() => setReportModal(null)} className="text-gray-400 hover:text-gray-600">
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Bạn đang báo cáo nội dung: <span className="italic font-medium">"{reportModal.contentPreview?.substring(0, 50)}..."</span></p>
              <label className="block text-sm font-bold text-gray-700 mb-2">Lý do báo cáo:</label>
              <select
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all mb-6"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="Spam">Spam hoặc gây phiền nhiễu</option>
                <option value="Hate Speech">Ngôn từ gây thù ghét hoặc xúc phạm</option>
                <option value="Inappropriate Content">Nội dung không phù hợp</option>
                <option value="Misleading Information">Thông tin sai lệch</option>
                <option value="Harassment">Quấy rối hoặc bắt nạt</option>
                <option value="Other">Lý do khác</option>
              </select>
              <button
                onClick={() => handleReportSubmit(reportReason)}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg"
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onMouseDown={() => setDeleteConfirm(null)}>
          <div
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <span className="material-icons text-red-500 text-3xl">delete_forever</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Xác nhận xóa</h3>
              <p className="text-sm text-gray-500 mb-6">
                {deleteConfirm.type === 'comment'
                  ? 'Bạn có chắc muốn xóa bình luận này? Hành động này không thể hoàn tác.'
                  : 'Bạn có chắc muốn xóa phản hồi này? Hành động này không thể hoàn tác.'}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {blockConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onMouseDown={() => setBlockConfirm(null)}>
          <div
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                <span className="material-icons text-orange-500 text-3xl">block</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Chặn người dùng</h3>
              <p className="text-sm text-gray-500 mb-2">
                Bạn có chắc muốn chặn <span className="font-bold text-gray-800">{blockConfirm.name}</span>?
              </p>
              <p className="text-xs text-gray-400 mb-6">
                Bạn sẽ không thấy bài viết, bình luận của họ nữa. Họ vẫn hoạt động bình thường với người khác.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setBlockConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmBlock}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                >
                  Chặn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

// Skeleton loader for profile
function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-16 bg-gray-200" />
      <div className="px-4 pb-4 text-center relative">
        <div className="w-16 h-16 rounded-full bg-gray-300 mx-auto absolute -top-8 left-1/2 -translate-x-1/2 border-2 border-white" />
        <div className="mt-10 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export default function JobSeekerDashboard() {
  const [searchParams] = useSearchParams();
  const targetJobId = searchParams.get('jobId');
  const { t } = useTranslation();
  const { user, logout, setUser } = useAuth();
  const { isUserOnline } = useSocket();

  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [profileUpdateOpen, setProfileUpdateOpen] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [activeSocialJob, setActiveSocialJob] = useState(null);

  // Calculate profile completeness
  const profileScore = user ? Math.min(100, [
    user.name, user.avatar, user.headline, user.bio,
    user.niche?.length, user.skills?.length, user.tools?.length,
    user.hourlyRate, user.availability,
    user.languages?.length, user.yearsOfExperience, user.expertiseLevel
  ].filter(Boolean).length * 10) : 0;

  const fetchData = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const targetRole = user?.role === 'client' ? 'freelancer' : 'client';
      const myRole = user?.role || 'freelancer';

      const [jobsRes, targetRes, otherRes] = await Promise.allSettled([
        jobsAPI.getRecommended(),
        usersAPI.getFreelancers({ limit: 8, sort: '-rating', role: targetRole }),
        usersAPI.getFreelancers({ limit: 8, sort: '-rating', role: myRole }),
      ]);

      let jobs = [];
      if (jobsRes.status === 'fulfilled') jobs = jobsRes.value.data.jobs || [];

      // Force fetch target job if missing from current feed
      if (targetJobId && !jobs.some(j => j._id === targetJobId)) {
        try {
          const targetRes = await jobsAPI.getJob(targetJobId);
          if (targetRes.data.job) {
            jobs = [targetRes.data.job, ...jobs];
          }
        } catch (targetErr) {
          console.error('Target job fetch error:', targetErr);
        }
      }

      setRecommendedJobs(jobs);

      let list = [];
      if (targetRes.status === 'fulfilled') list = [...list, ...(targetRes.value.data.users || [])];
      if (otherRes.status === 'fulfilled') list = [...list, ...(otherRes.value.data.users || [])];

      const uniqueList = Array.from(new Map(list.map(u => [u._id, u])).values());
      setFreelancers(uniqueList.filter(u => u._id !== user?._id));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoadingJobs(false);
    }
  }, [user?._id, user?.role, targetJobId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Scroll to target job ifJobID is in URL
  useEffect(() => {
    if (!loadingJobs && targetJobId && recommendedJobs.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`job-${targetJobId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [loadingJobs, targetJobId, recommendedJobs]);

  const handleApplySuccess = () => {
    if (selectedJobForApply) {
      setRecommendedJobs(prev => prev.map(j =>
        j._id === selectedJobForApply._id ? { ...j, hasApplied: true, applicantCount: (j.applicantCount || 0) + 1 } : j
      ));
    }
  };


  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Navbar activeNav="home" showSearch={true} />

      {/* Main 3-Column */}
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Sidebar — Profile Card */}
        <aside className="md:col-span-3 space-y-4">
          {!user ? <ProfileSkeleton /> : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="h-16 bg-gradient-to-r from-blue-400 to-primary relative" />
              <div className="px-4 pb-4 text-center relative">
                {user.avatar
                  ? <img alt="User Profile" className="h-16 w-16 rounded-full border-4 border-white absolute -top-8 left-1/2 transform -translate-x-1/2 object-cover shadow" src={user.avatar} />
                  : <div className="h-16 w-16 rounded-full border-4 border-white absolute -top-8 left-1/2 transform -translate-x-1/2 bg-primary/20 flex items-center justify-center shadow"><span className="material-icons text-primary text-2xl">person</span></div>
                }
                <div className="mt-10">
                  <h2 className="text-base font-semibold hover:underline cursor-pointer">{user.name}</h2>
                  <p className="text-xs text-gray-500 mt-1">{user.headline || 'Cập nhật tiêu đề hồ sơ'}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 py-3 px-4">
                <div className="flex justify-between items-center text-sm font-medium text-gray-500 hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <span>{t('dashboard.profile.profileViewers')}</span>
                  <span className="text-primary font-semibold">{user.profileViews || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-gray-500 hover:bg-gray-50 p-1 rounded cursor-pointer mt-1">
                  <span>{t('dashboard.profile.connections')}</span>
                  <span className="text-primary font-semibold">{user.connections?.length || 0}</span>
                </div>
              </div>
              {/* Profile strength */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-gray-700">{t('dashboard.profile.strength')}</span>
                  <span className="text-xs font-bold text-primary">{profileScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full transition-all duration-700" style={{ width: `${profileScore}%` }} />
                </div>
                {profileScore < 100 && (
                  <Link to="/profile/edit" className="block text-center mt-2 w-full text-xs font-semibold text-primary border border-primary rounded-full py-1 hover:bg-blue-50 transition-colors">
                    {t('dashboard.profile.completeProfile')}
                  </Link>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Main Feed */}
        <section className="md:col-span-6 space-y-4">
          {/* Post Composer */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex space-x-3 mb-3">
              {user?.avatar
                ? <img alt="User" className="h-12 w-12 rounded-full object-cover" src={user.avatar} />
                : <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center"><span className="material-icons text-primary">person</span></div>
              }
              <button className="flex-grow rounded-full border border-gray-300 px-4 text-left text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors bg-white">
                {t('dashboard.startPost')}
              </button>
            </div>
            <div className="flex justify-between items-center pt-1">
              {[
                { icon: 'photo', label: t('dashboard.media'), color: 'text-blue-500' },
                { icon: 'calendar_today', label: t('dashboard.event'), color: 'text-yellow-600' },
                { icon: 'article', label: t('dashboard.writeArticle'), color: 'text-orange-700' },
              ].map(({ icon, label, color }) => (
                <button key={label} className="flex items-center space-x-2 py-2 px-3 hover:bg-gray-100 rounded-md transition-colors">
                  <span className={`material-icons ${color}`}>{icon}</span>
                  <span className="text-sm font-medium text-gray-500">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Jobs section */}
          {loadingJobs ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4 animate-pulse">
              {[1, 2].map(i => <div key={i} className="flex gap-3"><div className="w-10 h-10 bg-gray-200 rounded" /><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-3/4" /><div className="h-2 bg-gray-200 rounded w-1/2" /></div></div>)}
            </div>
          ) : recommendedJobs.slice(0, 10).map(job => (
            <JobCard
              key={job._id}
              job={job}
              t={t}
              onApply={(j) => { setSelectedJobForApply(j); setApplyModalOpen(true); }}
              isHighlighted={job._id === targetJobId}
              onRefresh={fetchData}
              setPreviewImage={setPreviewImage}
              onShare={(j) => { setActiveSocialJob(j); setShareModalOpen(true); }}
              onSend={(j) => { setActiveSocialJob(j); setSendModalOpen(true); }}
            />
          ))}

          {recommendedJobs.length === 0 && !loadingJobs && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="max-w-md mx-auto">
                <span className="material-icons text-5xl text-gray-200 mb-4 block">psychology</span>
                <p className="text-gray-800 font-bold text-lg">AI chưa tìm thấy việc phù hợp 🎯</p>

                {(!user?.niche || user.niche.length === 0) ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4 text-left">
                    <p className="text-sm text-blue-800 font-semibold mb-1">Cần thêm thông tin nghề nghiệp</p>
                    <p className="text-xs text-blue-600 leading-relaxed">Thuật toán AI cần biết **Ngành nghề chính** của bạn để lọc ra các công việc chính xác, tránh hiển thị sai lĩnh vực.</p>
                  </div>
                ) : (!user?.skills || user.skills.length === 0) ? (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-4 text-left">
                    <p className="text-sm text-amber-800 font-semibold mb-1">Thiếu từ khóa kỹ năng</p>
                    <p className="text-xs text-amber-600 leading-relaxed">Bạn đã chọn ngành **{user.niche[0]}**, nhưng AI cần biết các kỹ năng cụ thể (vd: React, Photoshop) để tính điểm phù hợp.</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2 mb-6 leading-relaxed">
                    Hiện tại chưa có công việc nào đạt tiêu chuẩn khớp trên 25% với hồ sơ của bạn. Hãy thử mở rộng ngách chuyên sâu hoặc cập nhật kỹ năng mới.
                  </p>
                )}

                <Link to="/profile/edit" className="block mt-6">
                  <button className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 mx-auto">
                    <span className="material-icons text-sm">edit_note</span>
                    Tối ưu hồ sơ ngay
                  </button>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Right Sidebar */}
        <aside className="md:col-span-3 space-y-4 sticky top-20 h-fit max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pb-4 pr-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4">{t('dashboard.sidebar.peopleYouMayKnow')}</h2>
            <ul className="space-y-4">
              {freelancers
                .filter(f => !(user?.connections?.map(c => c._id || c) || []).includes(f._id))
                .slice(0, 3)
                .map(f => (
                  <li key={f._id} className="flex items-start">
                    <Link to={`/profile/${f._id}`} className="flex-shrink-0 relative">
                      {f.avatar
                        ? <img alt={f.name} className="w-10 h-10 rounded-full mr-3 flex-shrink-0 object-cover" src={f.avatar} />
                        : <div className="w-10 h-10 rounded-full mr-3 flex-shrink-0 bg-primary/20 flex items-center justify-center"><span className="material-icons text-primary text-sm">person</span></div>
                      }
                      {isUserOnline(f._id) && (
                        <span className="absolute bottom-0 right-3 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
                      )}
                    </Link>
                    <div className="flex-grow min-w-0">
                      <Link to={`/profile/${f._id}`} className="block text-sm font-semibold text-gray-900 hover:underline cursor-pointer truncate">
                        {f.name}
                      </Link>
                      <p className="text-xs text-gray-500 mb-1 truncate">{f.headline || f.niche?.join(', ') || 'Freelancer'}</p>
                      {f.rating > 0 && <p className="text-xs text-amber-500">⭐ {f.rating.toFixed(1)}</p>}
                      {sentRequests.includes(f._id) ? (
                        <button disabled className="mt-2 flex items-center justify-center w-fit px-3 py-1 border border-gray-300 bg-gray-50 rounded-full text-gray-400 text-xs font-semibold cursor-not-allowed">
                          <span className="material-icons text-sm mr-1">check</span>Đã gửi yêu cầu
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              await usersAPI.connect(f._id);
                              setSentRequests(prev => [...prev, f._id]);
                            } catch (e) { }
                          }}
                          className="mt-2 flex items-center justify-center w-fit px-3 py-1 border border-gray-400 rounded-full text-gray-500 hover:bg-gray-100 hover:border-gray-900 transition-all text-xs font-semibold"
                        >
                          <span className="material-icons text-sm mr-1">person_add</span>{t('dashboard.sidebar.connect')}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              {freelancers.filter(f => !(user?.connections?.map(c => c._id || c) || []).includes(f._id)).length === 0 && !loadingJobs && (
                <li className="text-sm text-gray-400 text-center py-4">Chưa có người dùng nào phù hợp</li>
              )}
            </ul>
            <Link to="/jobs">
              <button className="mt-4 flex items-center justify-center w-full text-sm font-semibold text-gray-500 hover:bg-gray-100 px-2 py-1 rounded transition-colors">
                {t('dashboard.sidebar.seeAll')}
              </button>
            </Link>
          </div>

          {/* Friends List (Connections) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center justify-between">
              Danh sách bạn bè <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{user?.connections?.length || 0}</span>
            </h2>
            <ul className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {user?.connections?.map(friend => (
                <li key={friend._id} className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 mr-2">
                    <Link to={`/profile/${friend._id}`} className="flex-shrink-0 relative">
                      {friend.avatar
                        ? <img alt={friend.name} className="w-10 h-10 rounded-full mr-3 flex-shrink-0 object-cover" src={friend.avatar} />
                        : <div className="w-10 h-10 rounded-full mr-3 flex-shrink-0 bg-primary/20 flex items-center justify-center"><span className="material-icons text-primary text-sm">person</span></div>
                      }
                      {isUserOnline(friend._id) && (
                        <span className="absolute bottom-0 right-3 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
                      )}
                    </Link>
                    <div className="min-w-0">
                      <Link to={`/profile/${friend._id}`} className="block text-sm font-semibold text-gray-900 hover:underline cursor-pointer truncate">
                        {friend.name}
                      </Link>
                      <p className="text-xs text-gray-500 truncate">{friend.headline || 'Freelancer'}</p>
                    </div>
                  </div>
                  <Link to={`/messages?with=${friend._id}`} className="flex-shrink-0 text-gray-400 hover:text-primary transition-colors p-2 bg-gray-50 hover:bg-blue-50 rounded-full">
                    <span className="material-icons text-xl">chat</span>
                  </Link>
                </li>
              ))}
              {(!user?.connections || user.connections.length === 0) && (
                <li className="text-sm text-gray-400 text-center py-4">Chưa có bạn bè nào</li>
              )}
            </ul>
          </div>

          {/* Footer links */}
          <div className="pt-4 text-center text-xs text-gray-400">
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-2">
              {['Giới thiệu', 'Bảo mật', 'Trợ giúp'].map((item) => (
                <a key={item} className="hover:text-primary hover:underline" href="#">{item}</a>
              ))}
            </div>
            <p>Hope Platform © 2024</p>
            <div className="mt-2"><LanguageSwitcher /></div>
          </div>
        </aside>
      </main>

      {/* Messaging Widget */}
      <div className="fixed bottom-0 right-4 w-72 bg-white border border-gray-200 rounded-t-lg shadow-lg z-50 hidden md:flex flex-col">
        <div className="p-2 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="relative">
              {user?.avatar
                ? <img alt="Avatar" className="w-8 h-8 rounded-full border border-white object-cover" src={user.avatar} />
                : <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><span className="material-icons text-primary text-sm">person</span></div>
              }
              <div className="bg-green-500 w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-white"></div>
            </div>
            <span className="text-sm font-semibold text-gray-900">{t('dashboard.messaging')}</span>
          </div>
          <div className="flex space-x-1 text-gray-500">
            <button className="p-1 hover:bg-gray-200 rounded-full"><span className="material-icons text-sm">open_in_new</span></button>
            <button className="p-1 hover:bg-gray-200 rounded-full"><span className="material-icons text-sm">expand_less</span></button>
          </div>
        </div>
      </div>

      {
        applyModalOpen && selectedJobForApply && (
          <ApplyModal
            job={selectedJobForApply}
            onClose={() => setApplyModalOpen(false)}
            onSuccess={handleApplySuccess}
          />
        )
      }

      {previewImage && (
        <ImageLightbox
          src={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {shareModalOpen && activeSocialJob && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => { setShareModalOpen(false); setActiveSocialJob(null); }}
          jobUrl={`${window.location.origin}/dashboard?jobId=${activeSocialJob._id}`}
          onShared={() => { jobsAPI.shareJob(activeSocialJob._id); fetchData(); }}
        />
      )}

      {sendModalOpen && activeSocialJob && (
        <SendModal
          isOpen={sendModalOpen}
          onClose={() => { setSendModalOpen(false); setActiveSocialJob(null); }}
          jobTitle={activeSocialJob.title}
          jobId={activeSocialJob._id}
          jobUrl={`${window.location.origin}/dashboard?jobId=${activeSocialJob._id}`}
          onSent={() => { jobsAPI.sendJob(activeSocialJob._id); fetchData(); }}
        />
      )}
    </div >
  );
}
