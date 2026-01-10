import React from 'react';
import Modal from './Modal';
import { Trash2 } from 'lucide-react';

const DeleteMessageOptionsModal = ({ isOpen, onClose, onDelete, isOwner }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-text mb-6">Delete Message?</h3>

                <div className="space-y-3">
                    {isOwner && (
                        <button
                            onClick={() => onDelete('everyone')}
                            className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition"
                        >
                            Unsend (Delete for Everyone)
                        </button>
                    )}
                    <button
                        onClick={() => onDelete('me')}
                        className="w-full py-3 bg-surface border border-soft-border text-text rounded-xl font-bold hover:bg-background transition"
                    >
                        Delete for Me
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 text-secondary font-medium hover:text-text"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteMessageOptionsModal;
