import React from 'react';

const ShareModal = ({ isOpen, onClose, jobUrl, onShared }) => {
  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(jobUrl);
  const platforms = [
    { name: 'Facebook', icon: 'facebook', color: 'bg-[#1877F2]', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { name: 'X', icon: 'close', color: 'bg-black', url: `https://twitter.com/intent/tweet?url=${encodedUrl}` },
    { name: 'LinkedIn', icon: 'work', color: 'bg-[#0A66C2]', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { name: 'WhatsApp', icon: 'chat', color: 'bg-[#25D366]', url: `https://api.whatsapp.com/send?text=${encodedUrl}` },
  ];

  const handlePlatformClick = (url) => {
    window.open(url, '_blank', 'width=600,height=400');
    onShared();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jobUrl);
    alert('Đã sao chép liên kết vào bộ nhớ tạm!');
    onShared();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <span className="material-icons text-primary">share</span> Chia sẻ bài viết
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            {platforms.map(p => (
              <button
                key={p.name}
                onClick={() => handlePlatformClick(p.url)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`${p.color} text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <span className="material-icons text-xl">{p.icon}</span>
                </div>
                <span className="text-[10px] font-medium text-gray-600">{p.name}</span>
              </button>
            ))}
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500 truncate flex-1">{jobUrl}</span>
            <button
              onClick={copyToClipboard}
              className="bg-primary text-white text-[10px] px-3 py-1.5 rounded-lg font-bold hover:bg-primary-dark transition-colors"
            >
              Sao chép
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center">Sao chép liên kết để gửi cho bạn bè</p>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
