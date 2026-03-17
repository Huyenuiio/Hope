import React from 'react';

const ImageLightbox = ({ src, onClose }) => {
  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300 transition-all"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all"
      >
        <span className="material-icons text-3xl">close</span>
      </button>

      <div
        className="relative max-w-[95vw] max-h-[95vh] animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt="Preview"
          className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl"
        />
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none border border-white/10 rounded"></div>
      </div>
    </div>
  );
};

export default ImageLightbox;
