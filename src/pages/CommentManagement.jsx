import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const CommentManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await adminAPI.getReports();
      setReports(res.data.reports);
      setLoading(false);
    } catch (err) {
      console.error('Fetch reports error:', err);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status, resolution) => {
    try {
      await adminAPI.updateReport(id, { status, resolution });
      setReports(reports.map(r => r._id === id ? { ...r, status, resolution } : r));
    } catch (err) {
      alert('Lỗi khi cập nhật trạng thái báo cáo');
    }
  };

  const handleBanUser = async (user, duration) => {
    let banUntil = null;
    let isPermanentlyBanned = false;

    if (duration === 'perm') {
      isPermanentlyBanned = true;
    } else {
      banUntil = new Date();
      banUntil.setDate(banUntil.getDate() + parseInt(duration));
    }

    const reason = prompt('Lý do khóa tài khoản:');
    if (!reason) return;

    try {
      await adminAPI.banUser(user._id, { banUntil, isPermanentlyBanned, reason });
      alert(`Đã khóa tài khoản ${user.name}`);
    } catch (err) {
      alert('Lỗi khi khóa người dùng');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn người dùng này và toàn bộ dữ liệu liên quan? Hành động này không thể hoàn tác.')) return;
    try {
      await adminAPI.deleteUser(userId);
      alert('Đã xóa người dùng thành công');
      fetchReports(); // Refresh as some reports might have belonged to this user
    } catch (err) {
      alert('Lỗi khi xóa người dùng');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Đang tải dữ liệu báo cáo...</div>;

  const filteredReports = reports.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quản lý báo cáo nội dung</h2>
          <p className="text-sm text-slate-500 mt-1">Xem xét các khiếu nại và hành động vi phạm từ cộng đồng</p>
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'resolved', 'dismissed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Chờ xử lý' : f === 'resolved' ? ' Đã giải quyết' : 'Đã bác bỏ'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-100 dark:border-slate-700">
            <tr>
              <th className="px-6 py-4">Người báo cáo</th>
              <th className="px-6 py-4">Đối tượng bị báo cáo</th>
              <th className="px-6 py-4">Nội dung / Lý do</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
            {filteredReports.map((report) => (
              <tr key={report._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={report.reporter?.avatar || 'https://via.placeholder.com/150'} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{report.reporter?.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{report.reporter?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={report.accusedUser?.avatar || 'https://via.placeholder.com/150'} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{report.accusedUser?.name}</p>
                      <button
                        onClick={() => handleDeleteUser(report.accusedUser?._id)}
                        className="text-[10px] text-red-500 hover:text-red-700 hover:underline font-bold"
                      >
                        Xóa vĩnh viễn
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <p className="text-xs font-bold text-primary mb-1 capitalize">[{report.type}]</p>
                  <p className="text-slate-600 dark:text-slate-400 italic line-clamp-2">"{report.contentPreview}"</p>
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
                    <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase mb-0.5">Lý do:</p>
                    <p className="text-xs text-red-800 dark:text-red-300 font-medium">{report.reason}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${report.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      report.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {report.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-y-2">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleUpdateStatus(report._id, 'resolved', 'Đã xử lý nội dung vi phạm')}
                      className="p-1.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500 rounded-xl hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors"
                      title="Chấp nhận báo cáo"
                    >
                      <span className="material-icons text-sm">check_circle</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(report._id, 'dismissed', 'Nội dung không vi phạm')}
                      className="p-1.5 bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                      title="Bác bỏ báo cáo"
                    >
                      <span className="material-icons text-sm">cancel</span>
                    </button>
                  </div>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleBanUser(report.accusedUser, 7)} className="text-[10px] bg-red-500 text-white px-2 py-1 rounded-xl hover:bg-red-600 font-bold shadow-sm shadow-red-500/20 transition-all">Ban 7d</button>
                    <button onClick={() => handleBanUser(report.accusedUser, 'perm')} className="text-[10px] bg-slate-900 dark:bg-black text-white px-2 py-1 rounded-xl hover:bg-black dark:hover:bg-slate-800 font-bold shadow-sm transition-all">Perm</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredReports.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 italic">Không có báo cáo nào phù hợp</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommentManagement;
