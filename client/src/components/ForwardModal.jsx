import React, { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import Avatar from './Avatar';
import { Search, Send, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ForwardModal = ({ isOpen, onClose, message, currentIdentity }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [sending, setSending] = useState(false);

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            try {
                const res = await axios.get(`/search?q=${query}&type=identities`);
                setSearchResults(res.data.identities || []);
            } catch (err) { console.error(err); }
        } else {
            setSearchResults([]);
        }
    };

    const toggleRecipient = (id) => {
        if (selectedRecipients.some(r => r._id === id._id)) {
            setSelectedRecipients(selectedRecipients.filter(r => r._id !== id._id));
        } else {
            setSelectedRecipients([...selectedRecipients, id]);
        }
    };

    const handleForward = async () => {
        if (selectedRecipients.length === 0) return;
        setSending(true);
        try {
            const promises = selectedRecipients.map(recipient => {
                const formData = new FormData();
                formData.append('senderIdentityId', currentIdentity._id);
                formData.append('recipientIdentityId', recipient._id);
                // Forward content
                if (message.content) formData.append('content', message.content);
                // We don't re-upload media for now, just text content forwarding is simplified
                // Real implementation might link existing media or require re-upload logic
                if (message.media?.length > 0) {
                     formData.append('content', (message.content ? message.content + '\n' : '') + '[Forwarded Media]');
                }
                return axios.post('/messages', formData);
            });

            await Promise.all(promises);
            toast.success("Message forwarded");
            onClose();
        } catch (err) {
            toast.error("Failed to forward");
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="w-full max-w-md mx-auto">
                <h3 className="font-serif text-lg font-bold mb-4">Forward Message</h3>
                <div className="mb-4 relative">
                    <Search size={16} className="absolute left-3 top-2.5 text-secondary" />
                    <input
                        className="w-full bg-background border border-soft-border rounded-xl py-2 pl-9 text-sm focus:ring-1 focus:ring-sage focus:outline-none"
                        placeholder="Search people..."
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>

                <div className="max-h-60 overflow-y-auto mb-4 custom-scrollbar space-y-2">
                    {searchResults.map(user => (
                        <div key={user._id} onClick={() => toggleRecipient(user)} className="flex items-center justify-between p-2 hover:bg-background rounded-lg cursor-pointer">
                            <div className="flex items-center space-x-3">
                                <Avatar identity={user} size="sm" />
                                <span className="text-sm font-medium">{user.name}</span>
                            </div>
                            {selectedRecipients.some(r => r._id === user._id) && <Check size={16} className="text-green-500" />}
                        </div>
                    ))}
                    {searchResults.length === 0 && searchQuery.length > 2 && (
                        <p className="text-center text-xs text-secondary py-4">No users found</p>
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-soft-border">
                    <span className="text-xs text-secondary">{selectedRecipients.length} selected</span>
                    <button
                        onClick={handleForward}
                        disabled={sending || selectedRecipients.length === 0}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center space-x-2"
                    >
                        <span>Send</span>
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ForwardModal;
