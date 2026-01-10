import React, { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import Avatar from './Avatar';
import { Search, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ForwardModal = ({ isOpen, onClose, message, currentIdentity }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [sending, setSending] = useState(false);

    const handleSearch = async (val) => {
        setQuery(val);
        if (val.length > 2) {
            try {
                const res = await axios.get(`/search?q=${val}&type=identities`);
                setResults(res.data.identities || []);
            } catch (e) { console.error(e); }
        } else {
            setResults([]);
        }
    };

    const handleSend = async (recipientId) => {
        if (sending) return;
        setSending(true);
        try {
            const formData = new FormData();
            formData.append('senderIdentityId', currentIdentity._id);
            formData.append('recipientIdentityId', recipientId);
            formData.append('content', message.content || '');

            if (message.sharedPost) {
                formData.append('sharedPostId', message.sharedPost._id || message.sharedPost);
            }

            await axios.post('/messages', formData);
            toast.success("Forwarded");
            onClose();
        } catch (err) {
            toast.error("Failed to forward");
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-4">
                <h3 className="font-bold text-lg mb-4 text-center text-text">Forward Message</h3>
                <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-3 text-secondary" />
                    <input
                        className="w-full bg-background border border-soft-border rounded-xl py-2 pl-9 text-sm focus:outline-none text-text"
                        placeholder="Search users..."
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                    {results.map(user => (
                        <div key={user._id} className="flex items-center justify-between p-2 hover:bg-background rounded-lg">
                            <div className="flex items-center space-x-3">
                                <Avatar identity={user} size="sm" />
                                <span className="text-sm font-bold text-text">{user.name}</span>
                            </div>
                            <button
                                onClick={() => handleSend(user._id)}
                                disabled={sending}
                                className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 p-2 rounded-full hover:opacity-90 disabled:opacity-50"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    ))}
                    {results.length === 0 && query.length > 2 && (
                        <p className="text-center text-secondary text-sm py-4">No users found</p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ForwardModal;
