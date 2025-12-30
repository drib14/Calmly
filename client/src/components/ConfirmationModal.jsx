import React from 'react';
import Modal from './Modal';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
        <div className="text-center">
            <h3 className="text-xl font-bold mb-2 text-text">{title}</h3>
            <p className="text-secondary mb-6 text-sm">{message}</p>
            <div className="flex space-x-3">
                <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-surface border border-soft-border text-text font-medium rounded-xl hover:bg-background transition"
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    className={`flex-1 py-3 text-white font-medium rounded-xl transition ${isDanger ? 'bg-danger hover:bg-red-600' : 'bg-accent hover:opacity-90'}`}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </Modal>
  );
};

export default ConfirmationModal;
