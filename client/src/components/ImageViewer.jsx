import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageViewer = ({ isOpen, onClose, imageSrc, images = [], initialIndex = 0, altText = "Image" }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Sync internal state if props change (e.g. opening different image)
  useEffect(() => {
      if (isOpen) {
          if (images.length > 0) {
              setCurrentIndex(initialIndex);
          } else {
              setCurrentIndex(0);
          }
      }
  }, [isOpen, initialIndex, images]);

  const currentImage = images.length > 0 ? images[currentIndex] : imageSrc;
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
  }, [isOpen, onClose, hasMultiple, currentIndex]); // depend on currentIndex for proper next/prev

  const handleNext = (e) => {
      if(e) e.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e) => {
      if(e) e.stopPropagation();
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!isOpen || !currentImage) return null;

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
            <a
              href={currentImage}
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

        {/* Image */}
        <motion.div
            key={currentImage} // Force re-render for animation on change
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            <img
              src={currentImage}
              alt={altText}
              className="max-w-[95vw] max-h-[90vh] object-contain rounded-md shadow-2xl"
            />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageViewer;
