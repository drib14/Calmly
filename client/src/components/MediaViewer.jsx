import React, { useEffect, useState } from 'react';
import { X, Download, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MediaPlayer from './MediaPlayer';
import { toast } from 'react-hot-toast';

const MediaViewer = ({ isOpen, onClose, imageSrc, images = [], initialIndex = 0, altText = "Media", actions = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showOptions, setShowOptions] = useState(false);

  // Sync internal state if props change (e.g. opening different image)
  useEffect(() => {
      if (isOpen) {
          if (images.length > 0) {
              setCurrentIndex(initialIndex);
          } else {
              setCurrentIndex(0);
          }
          setShowOptions(false);
      }
  }, [isOpen, initialIndex, images]);

  // Determine current item (URL or Object)
  // Logic from Profile.jsx: normalized media items are objects or strings
  const rawCurrent = images.length > 0 ? images[currentIndex] : imageSrc;

  // Normalize to { url, type }
  let currentMedia = { url: '', type: 'image' };
  if (typeof rawCurrent === 'string') {
      currentMedia.url = rawCurrent;
      // Simple detection
      if (rawCurrent.match(/\.(mp4|webm|mov)$/i)) {
          currentMedia.type = 'video';
      }
  } else if (rawCurrent && typeof rawCurrent === 'object') {
      currentMedia = rawCurrent;
  }

  const hasMultiple = images.length > 1;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasMultiple) handleNext();
      if (e.key === 'ArrowLeft' && hasMultiple) handlePrev();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, hasMultiple, currentIndex]);

  const handleNext = (e) => {
      if(e) e.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e) => {
      if(e) e.stopPropagation();
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleDownload = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const url = currentMedia.url;
      if (!url) return;

      const toastId = toast.loading('Downloading...');

      try {
          // Attempt to fetch blob to force download
          const response = await fetch(url);
          if (!response.ok) throw new Error('Download failed');

          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = blobUrl;
          // Extract filename from URL or default
          const filename = url.split('/').pop().split('?')[0] || `download-${Date.now()}`;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);

          toast.success('Downloaded', { id: toastId });
      } catch (err) {
          console.error("Download Error:", err);
          // Fallback to direct link opening if fetch fails (e.g. CORS)
          const a = document.createElement('a');
          a.href = url;
          a.download = '';
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.error('Started download (fallback)', { id: toastId });
      }
  };

  if (!isOpen || !currentMedia.url) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-surface/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Toolbar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-[70]" onClick={(e) => e.stopPropagation()}>
          <span className="text-secondary text-sm font-medium ml-2">{altText} {hasMultiple ? `(${currentIndex + 1}/${images.length})` : ''}</span>
          <div className="flex items-center space-x-4">

            {/* Actions Menu */}
            {actions.length > 0 && (
                <div className="relative">
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="p-2 text-secondary hover:text-text hover:bg-background/10 rounded-full transition"
                    >
                        <MoreVertical size={20} />
                    </button>
                    {showOptions && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-soft-border rounded-xl shadow-xl overflow-hidden py-1 z-[80]">
                            {actions.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => { action.onClick(currentMedia.url); setShowOptions(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-text hover:bg-background transition"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <button
              onClick={handleDownload}
              className="p-2 text-secondary hover:text-text hover:bg-background/10 rounded-full transition"
              title="Download"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-secondary hover:text-text hover:bg-background/10 rounded-full transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Navigation Buttons */}
        {hasMultiple && (
            <>
                <button
                    onClick={handlePrev}
                    className="absolute left-4 z-[70] p-3 rounded-full bg-black/20 hover:bg-black/40 text-white transition backdrop-blur-md"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={handleNext}
                    className="absolute right-4 z-[70] p-3 rounded-full bg-black/20 hover:bg-black/40 text-white transition backdrop-blur-md"
                >
                    <ChevronRight size={24} />
                </button>
            </>
        )}

        {/* Media Content */}
        <motion.div
            key={currentMedia.url} // Force re-render for animation on change
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden w-full h-full"
            onClick={(e) => { e.stopPropagation(); setShowOptions(false); }}
        >
            {currentMedia.type === 'video' ? (
                <div className="w-full max-w-5xl max-h-[85vh] aspect-video">
                    <MediaPlayer src={currentMedia.url} />
                </div>
            ) : (
                <img
                  src={currentMedia.url}
                  alt={altText}
                  className="max-w-[95vw] max-h-[85vh] object-contain rounded-md shadow-2xl"
                />
            )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MediaViewer;
