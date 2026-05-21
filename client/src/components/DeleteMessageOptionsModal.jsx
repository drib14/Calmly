import React from 'react';
import { Trash2, UserX } from 'lucide-react';
import Modal from './Modal';

const DeleteMessageOptionsModal = ({ isOpen, onClose, onDelete, isOwner }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-center mb-4">Delete Message</h3>
                <div className="space-y-2">
                    <button
                        onClick={() => onDelete('me')}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-background hover:bg-surface border border-soft-border transition group"
                    >
                        <div className="text-left">
                            <span className="block font-bold text-sm">Delete for Me</span>
                            <span className="text-xs text-secondary">Remove from your view only</span>
                        </div>
                        <Trash2 size={18} className="text-secondary group-hover:text-red-500 transition" />
                    </button>

                    {isOwner && (
                        <button
                            onClick={() => onDelete('everyone')}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-background hover:bg-surface border border-soft-border transition group"
                        >
                            <div className="text-left">
                                <span className="block font-bold text-sm">Unsend for Everyone</span>
                                <span className="text-xs text-secondary">Remove for all participants</span>
                            </div>
                            <UserX size={18} className="text-secondary group-hover:text-red-500 transition" />
                        </button>
                    )}
                </div>
                <button onClick={onClose} className="w-full py-2 text-sm text-secondary hover:text-text">Cancel</button>
            </div>
        </Modal>
    );
};

export default DeleteMessageOptionsModal;
