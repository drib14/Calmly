import React, { useState } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import Modal from './Modal';
import Avatar from './Avatar';
import { Search, Send, X, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useIdentity } from '../context/IdentityContext';

const ShareModal = ({ isOpen, onClose, post }) => {
  const { currentIdentity, identities } = useIdentity();
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState([]);

  // Suggested Users (All identities)
  const { data: suggestedUsersRaw } = useSWR(isOpen ? '/search?q=&type=identities' : null, async (url) => {
      try {
          const res = await axios.get(url);
          return res.data.identities || [];
      } catch (err) { return []; }
  });

  // Filter out my own identities
  const suggestedUsers = suggestedUsersRaw?.filter(u => !identities?.some(id => id._id === u._id)) || [];

  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (e) => {
      setSearchQuery(e.target.value);
      if (e.target.value.length > 2) {
          try {
              const res = await axios.get(`/search?q=${e.target.value}&type=identities`);
              const results = res.data.identities || [];
              setSearchResults(results.filter(u => !identities?.some(id => id._id === u._id)));
          } catch (err) {
              console.error(err);
          }
      } else {
          setSearchResults([]);
      }
  };

  const toggleRecipient = (user) => {
      if (selectedRecipients.some(r => r._id === user._id)) {
          setSelectedRecipients(selectedRecipients.filter(r => r._id !== user._id));
      } else {
          setSelectedRecipients([...selectedRecipients, user]);
      }
  };

  const handleBatchSend = async () => {
      if (!currentIdentity) return toast.error("Select an identity first");
      if (selectedRecipients.length === 0) return;

      setSending(true);

      try {
          const promises = selectedRecipients.map(recipient =>
               axios.post('/messages', {
                  senderIdentityId: currentIdentity._id,
                  recipientIdentityId: recipient._id,
                  content: message,
                  sharedPost: post._id
              })
          );

          await Promise.all(promises);

          toast.success(`Shared with ${selectedRecipients.length} users`);
          setMessage('');
          setSelectedRecipients([]);
          onClose();
      } catch (err) {
          console.error(err);
          toast.error("Failed to send");
      } finally {
          setSending(false);
      }
  };

  const displayedUsers = searchQuery.length > 2 ? searchResults : suggestedUsers;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
        <div className="w-full max-w-md flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-lg font-serif font-bold text-text">Share as Message</h3>
                <button onClick={onClose} className="text-secondary hover:text-text"><X size={20}/></button>
            </div>

            <div className="relative mb-4 flex-shrink-0">
                <Search size={16} className="absolute left-3 top-2.5 text-secondary" />
                <input
                    className="w-full bg-background border border-soft-border rounded-xl py-2 pl-9 text-sm focus:ring-1 focus:ring-accent text-text placeholder-secondary outline-none"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={handleSearch}
                    autoFocus
                />
            </div>

            {/* Message Input - Only visible if recipients selected? No, let user type whenever */}
            <div className="mb-4 flex-shrink-0">
                <input
                    className="w-full bg-surface border border-soft-border rounded-xl py-2 px-3 text-sm focus:ring-1 focus:ring-accent text-text placeholder-secondary outline-none"
                    placeholder="Add a message (optional)..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[200px]">
                {displayedUsers?.length === 0 && (
                    <p className="text-center text-secondary text-sm py-4">No users found.</p>
                )}

                {/* Horizontal Layout for initial suggestions, Vertical for search */}
                {searchQuery.length <= 2 && displayedUsers && displayedUsers.length > 0 ? (
                     <div className="grid grid-cols-3 gap-4 p-2">
                        {displayedUsers.map(user => {
                            const isSelected = selectedRecipients.some(r => r._id === user._id);
                            return (
                                <div key={user._id} onClick={() => toggleRecipient(user)} className={`flex flex-col items-center p-2 rounded-xl cursor-pointer transition text-center group border ${isSelected ? 'bg-accent/10 border-accent' : 'border-transparent hover:bg-background'}`}>
                                    <div className="relative">
                                        <Avatar identity={user} size="md" />
                                        {isSelected && (
                                            <div className="absolute -bottom-1 -right-1 bg-accent text-white rounded-full p-0.5 border-2 border-surface">
                                                <Check size={10} strokeWidth={4} />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs font-bold text-text mt-2 truncate w-full">{user.name}</p>
                                </div>
                            );
                        })}
                     </div>
                ) : (
                    <div className="space-y-2">
                        {displayedUsers?.map(user => {
                            const isSelected = selectedRecipients.some(r => r._id === user._id);
                            return (
                                <div key={user._id} onClick={() => toggleRecipient(user)} className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer border ${isSelected ? 'bg-accent/10 border-accent' : 'border-transparent hover:bg-background'}`}>
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <Avatar identity={user} size="sm" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-text truncate">{user.name}</p>
                                            <p className="text-[10px] text-secondary truncate">{user.handle}</p>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${isSelected ? 'bg-accent border-accent text-white' : 'border-soft-border'}`}>
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="pt-4 mt-2 border-t border-soft-border flex-shrink-0">
                 <button
                    onClick={handleBatchSend}
                    disabled={sending || selectedRecipients.length === 0}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 disabled:opacity-50 hover:bg-slate-800 transition active:scale-95"
                 >
                     <span>Send to {selectedRecipients.length > 0 ? `${selectedRecipients.length} people` : ''}</span>
                     <Send size={16} />
                 </button>
            </div>
        </div>
    </Modal>
  );
};

export default ShareModal;
