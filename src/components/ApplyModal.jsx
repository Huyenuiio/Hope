import { useState } from 'react';
import { jobsAPI } from '../services/api';

export default function ApplyModal({ job, onClose, onSuccess }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverLetter.trim()) { setError('Vui lòng viết thư giới thiệu'); return; }
    setLoading(true);
    setError('');
    try {
      await jobsAPI.applyToJob(job._id, { coverLetter, proposedRate: parseFloat(proposedRate) || undefined });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="font-bold text-lg text-gray-900">Ứng tuyển</h2>
            <p className="text-sm text-gray-500 mt-0.5">{job.title}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><span className="material-icons text-gray-400">close</span></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Thư giới thiệu *</label>
            <textarea
              rows={4}
              value={coverLetter}
              onChange={e => setCoverLetter(e.target.value)}
              placeholder="Giới thiệu bản thân và tại sao bạn phù hợp với công việc này..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Mức phí đề xuất (tùy chọn)</label>
            <div className="relative">
              <input
                type="number"
                value={proposedRate}
                onChange={e => setProposedRate(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg p-3 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="absolute right-3 top-3 text-sm text-gray-400">{job.budget?.currency || 'VND'}</span>
            </div>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {loading ? 'Đang gửi...' : 'Gửi đơn ứng tuyển'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
