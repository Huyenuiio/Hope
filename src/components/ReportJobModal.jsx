import React, { useState } from 'react';

export default function ReportJobModal({ job, onClose, onSubmit }) {
  const [reason, setReason] = useState('scam');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ reason, description });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="material-icons text-red-500">report_problem</span>
              Báo cáo công việc
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <span className="material-icons">close</span>
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-sm font-semibold text-gray-700 truncate">{job.title}</p>
            <p className="text-xs text-gray-500 mt-1 truncate">Đăng bởi: {job.client?.name || 'Khách hàng'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lý do báo cáo</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              >
                <option value="scam">Lừa đảo / Giả mạo</option>
                <option value="inappropriate">Nội dung không phù hợp</option>
                <option value="spam">Spam / Quảng cáo</option>
                <option value="misleading">Thông tin sai lệch</option>
                <option value="other">Lý do khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Chi tiết (không bắt buộc)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả thêm về dấu hiệu vi phạm..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all min-h-[100px] resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 px-4 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Gửi báo cáo</>
                )}
              </button>
            </div>
          </form>

          <p className="mt-4 text-[10px] text-gray-400 text-center italic">
            Báo cáo của bạn sẽ được giữ bí mật và xử lý bởi đội ngũ quản trị viên trong vòng 24h.
          </p>
        </div>
      </div>
    </div>
  );
}
