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

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu báo cáo...</div>;

  const filteredReports = reports.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Quản lý báo cáo nội dung</h2>
        <div className="flex gap-2">
          {['all', 'pending', 'resolved', 'dismissed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === f ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Chờ xử lý' : f === 'resolved' ? ' Đã giải quyết' : 'Đã bác bỏ'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
            <tr>
              <th className="px-6 py-4">Người báo cáo</th>
              <th className="px-6 py-4">Đối tượng bị báo cáo</th>
              <th className="px-6 py-4">Nội dung / Lý do</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {filteredReports.map((report) => (
              <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={report.reporter?.avatar || 'https://via.placeholder.com/150'} className="w-8 h-8 rounded-full border border-gray-100" />
                    <div>
                      <p className="font-bold text-gray-900">{report.reporter?.name}</p>
                      <p className="text-[10px] text-gray-400">{report.reporter?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={report.accusedUser?.avatar || 'https://via.placeholder.com/150'} className="w-8 h-8 rounded-full border border-gray-100" />
                    <div>
                      <p className="font-bold text-gray-900">{report.accusedUser?.name}</p>
                      <button
                        onClick={() => handleDeleteUser(report.accusedUser?._id)}
                        className="text-[10px] text-red-500 hover:underline font-medium"
                      >
                        Xóa vĩnh viễn
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <p className="text-xs font-bold text-primary mb-1 capitalize">[{report.type}]</p>
                  <p className="text-gray-600 italic line-clamp-2">"{report.contentPreview}"</p>
                  <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-[10px] font-bold text-red-600 uppercase mb-0.5">Lý do:</p>
                    <p className="text-xs text-red-800 font-medium">{report.reason}</p>
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
                      className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                      title="Chấp nhận báo cáo"
                    >
                      <span className="material-icons text-sm">check_circle</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(report._id, 'dismissed', 'Nội dung không vi phạm')}
                      className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100"
                      title="Bác bỏ báo cáo"
                    >
                      <span className="material-icons text-sm">cancel</span>
                    </button>
                  </div>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleBanUser(report.accusedUser, 7)} className="text-[10px] bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 font-bold">Ban 7d</button>
                    <button onClick={() => handleBanUser(report.accusedUser, 'perm')} className="text-[10px] bg-black text-white px-2 py-1 rounded hover:bg-gray-800 font-bold">Perm</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredReports.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">Không có báo cáo nào phù hợp</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommentManagement;
