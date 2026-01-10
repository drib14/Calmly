import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import Modal from './Modal';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ReportMessageModal = ({ isOpen, onClose, messageId }) => {
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) return toast.error("Please provide a reason.");
        setSubmitting(true);
        try {
            await axios.post(`/messages/${messageId}/report`, { reason });
            toast.success("Report submitted.");
            onClose();
            setReason('');
        } catch (err) {
            toast.error("Failed to report message.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-4 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <Flag size={24} />
                </div>
                <h3 className="text-lg font-bold text-text mb-2">Report Message</h3>
                <p className="text-secondary text-sm mb-4">Why are you reporting this message?</p>

                <textarea
                    className="w-full bg-background border border-soft-border rounded-xl p-3 text-sm focus:ring-2 ring-slate-900 outline-none resize-none mb-6 text-text"
                    rows="3"
                    placeholder="Describe the issue..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />

                <div className="flex space-x-3">
                    <button onClick={onClose} disabled={submitting} className="flex-1 py-3 bg-background text-text font-medium rounded-xl hover:bg-surface transition border border-soft-border">Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition disabled:opacity-50">
                        {submitting ? 'Sending...' : 'Report'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ReportMessageModal;
