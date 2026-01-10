import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import Modal from './Modal';
import { Bell } from 'lucide-react';

const AnnouncementModal = () => {
    const { data: announcement } = useSWR('/settings/system', url => axios.get(url).then(res => res.data));
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (announcement?.active && announcement?.text) {
            // Check session storage to see if already dismissed in this session
            const dismissed = sessionStorage.getItem('announcementDismissed');
            if (dismissed !== announcement.text) { // Simple check: if text changed, show again? Or just ID.
                // We don't have ID for announcement, so using text as hash.
                setIsOpen(true);
            }
        }
    }, [announcement]);

    const handleClose = () => {
        setIsOpen(false);
        if (announcement?.text) {
            sessionStorage.setItem('announcementDismissed', announcement.text);
        }
    };

    if (!announcement?.active || !announcement?.text) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className="text-center p-4">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={32} />
                </div>
                <h3 className="text-xl font-bold text-text mb-4">System Announcement</h3>
                <div className="bg-surface border border-soft-border rounded-xl p-4 mb-6 text-left">
                    <p className="text-text whitespace-pre-wrap leading-relaxed">{announcement.text}</p>
                </div>
                <button
                    onClick={handleClose}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition"
                >
                    Got it
                </button>
            </div>
        </Modal>
    );
};

export default AnnouncementModal;
