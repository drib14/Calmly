import React, { useState } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import Modal from './Modal';
import Avatar from './Avatar';
import { Search, Send, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useIdentity } from '../context/IdentityContext';

const ShareModal = ({ isOpen, onClose, post }) => {
  const { currentIdentity } = useIdentity();
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(null);

  // Suggested Users (All identities)
  const { data: suggestedUsers } = useSWR(isOpen ? '/search?q=&type=identities' : null, async (url) => {
      try {
          const res = await axios.get(url);
          return res.data.identities || [];
      } catch (err) { return []; }
  });

  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (e) => {
      setSearchQuery(e.target.value);
      if (e.target.value.length > 2) {
          try {
              const res = await axios.get(`/search?q=${e.target.value}&type=identities`);
              setSearchResults(res.data.identities || []);
          } catch (err) {
              console.error(err);
          }
      } else {
          setSearchResults([]);
      }
  };

  const handleSend = async (recipient) => {
      if (!currentIdentity) return toast.error("Select an identity first");
      setSending(recipient._id);

      try {
          await axios.post('/messages', {
              senderIdentityId: currentIdentity._id,
              recipientIdentityId: recipient._id,
              content: '', // Empty content, just shared post
              sharedPostId: post._id
          });
          toast.success(`Sent to ${recipient.name}`);
      } catch (err) {
          console.error(err);
          toast.error("Failed to send");
      } finally {
          setSending(null);
      }
  };

  const displayedUsers = searchQuery.length > 2 ? searchResults : suggestedUsers;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
        <div className="w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-serif font-bold text-text">Share as Message</h3>
                <button onClick={onClose} className="text-secondary hover:text-text"><X size={20}/></button>
            </div>

            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-2.5 text-secondary" />
                <input
                    className="w-full bg-background border border-soft-border rounded-xl py-2 pl-9 text-sm focus:ring-1 focus:ring-accent text-text placeholder-secondary outline-none"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={handleSearch}
                    autoFocus
                />
            </div>

            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {displayedUsers?.length === 0 && (
                    <p className="text-center text-secondary text-sm py-4">No users found.</p>
                )}

                {/* Horizontal Layout for initial suggestions, Vertical for search */}
                {searchQuery.length <= 2 && displayedUsers && displayedUsers.length > 0 ? (
                     <div className="grid grid-cols-3 gap-4 p-2">
                        {displayedUsers.map(user => (
                            <div key={user._id} onClick={() => handleSend(user)} className="flex flex-col items-center p-2 hover:bg-background rounded-xl cursor-pointer transition text-center group">
                                <Avatar identity={user} size="md" />
                                <p className="text-xs font-bold text-text mt-2 truncate w-full">{user.name}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 ${sending === user._id ? 'bg-green-100 text-green-600' : 'bg-surface border border-soft-border text-secondary group-hover:border-text group-hover:text-text'}`}>
                                    {sending === user._id ? 'Sent' : 'Send'}
                                </span>
                            </div>
                        ))}
                     </div>
                ) : (
                    <div className="space-y-2">
                        {displayedUsers?.map(user => (
                            <div key={user._id} className="flex items-center justify-between p-2 hover:bg-background rounded-xl transition">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <Avatar identity={user} size="sm" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-text truncate">{user.name}</p>
                                        <p className="text-[10px] text-secondary truncate">{user.handle}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSend(user)}
                                    disabled={sending === user._id}
                                    className="px-3 py-1.5 bg-surface border border-soft-border text-xs font-bold text-text rounded-full hover:bg-background transition disabled:opacity-50"
                                >
                                    {sending === user._id ? 'Sent' : 'Send'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </Modal>
  );
};

export default ShareModal;
