import React, { useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageViewer = ({ isOpen, onClose, imageSrc, altText = "Image" }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageSrc) return null;

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
          <span className="text-secondary text-sm font-medium ml-2">{altText}</span>
          <div className="flex items-center space-x-4">
            <a
              href={imageSrc}
              download
              className="p-2 text-secondary hover:text-text hover:bg-background/10 rounded-full transition"
              title="Download"
            >
              <Download size={20} />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-secondary hover:text-text hover:bg-background/10 rounded-full transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Image */}
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            <img
              src={imageSrc}
              alt={altText}
              className="max-w-[95vw] max-h-[90vh] object-contain rounded-md shadow-2xl"
            />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageViewer;
