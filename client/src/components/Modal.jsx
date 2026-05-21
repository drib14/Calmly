import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({ isOpen, onClose, children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={onClose} // Close on backdrop click
        >
          {/* Mobile Drawer / Desktop Modal */}
          <motion.div
            initial={{ y: "100%", opacity: 0, scale: 1 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-surface w-full md:w-full md:max-w-sm shadow-xl relative border-t md:border border-soft-border max-h-[85vh] md:max-h-[90vh] overflow-y-auto custom-scrollbar rounded-t-3xl md:rounded-3xl p-6 pb-safe md:pb-6"
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking content
            style={{ marginBottom: 0 }} // Ensure it sits at bottom on mobile
          >
            {/* Mobile Drag Indicator */}
            <div className="md:hidden w-12 h-1.5 bg-soft-border rounded-full mx-auto mb-6 opacity-50" />

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
