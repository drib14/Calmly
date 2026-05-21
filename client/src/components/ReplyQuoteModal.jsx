import React, { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import Avatar from './Avatar';
import { Send, Globe, Users, Lock, Clock, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useIdentity } from '../context/IdentityContext';
import { useNavigate } from 'react-router-dom';
import { useSWRConfig } from 'swr';
import clsx from 'clsx';

const moodColors = {
    'Neutral': 'bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700',
    'Melancholy': 'bg-blue-50 text-blue-900 border-blue-100 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-900',
    'Happy': 'bg-yellow-50 text-yellow-900 border-yellow-100 dark:bg-yellow-950 dark:text-yellow-100 dark:border-yellow-900',
    'Sad': 'bg-indigo-50 text-indigo-900 border-indigo-100 dark:bg-indigo-950 dark:text-indigo-100 dark:border-indigo-900',
    'Angry': 'bg-red-50 text-red-900 border-red-100 dark:bg-red-950 dark:text-red-100 dark:border-red-900',
    'Hopeful': 'bg-emerald-50 text-emerald-900 border-emerald-100 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-900',
    'Anxious': 'bg-purple-50 text-purple-900 border-purple-100 dark:bg-purple-950 dark:text-purple-100 dark:border-purple-900',
    'Peaceful': 'bg-teal-50 text-teal-900 border-teal-100 dark:bg-teal-950 dark:text-teal-100 dark:border-teal-900',
    'Numb': 'bg-gray-50 text-gray-900 border-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700',
    'Grateful': 'bg-orange-50 text-orange-900 border-orange-100 dark:bg-orange-950 dark:text-orange-100 dark:border-orange-900',
};

const ReplyQuoteModal = ({ quote, onClose, onCreateNew }) => {
  const { currentIdentity, identities } = useIdentity();
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();

  const isOwner = identities?.some(id => id._id === quote?.identity?._id);

  const handleReply = async () => {
      if (!replyText.trim() || !quote) return;
      setReplying(true);
      try {
          const formData = new FormData();
          formData.append('senderIdentityId', currentIdentity._id);
          formData.append('recipientIdentityId', quote.identity._id);
          formData.append('content', replyText);

          // Send structured reply data
          const replyData = {
              quoteId: quote._id,
              content: quote.content,
              mood: quote.mood,
              font: quote.font,
              identity: {
                  name: quote.identity.name,
                  handle: quote.identity.handle,
                  avatar: quote.identity.avatar
              }
          };
          formData.append('replyToQuote', JSON.stringify(replyData));

          await axios.post('/messages', formData);
          toast.success("Reply sent");
          onClose();
          setReplyText('');
      } catch (err) {
          toast.error("Failed to send reply");
      } finally {
          setReplying(false);
      }
  };

  const handleDelete = async () => {
    try {
        await axios.delete(`/quotes/${quote._id}`);
        toast.success("Quote deleted");
        mutate('/quotes/feed');
        mutate(key => typeof key === 'string' && key.startsWith('/profile/'), undefined, { revalidate: true });
        onClose();
    } catch (err) {
        toast.error("Failed to delete");
    }
  };

  const goToProfile = () => {
      onClose();
      navigate(`/profile/${quote.identity.handle.replace('@', '')}`);
  };

  if (!quote) return null;

  // Calculate Expiry Hours
  const now = new Date();
  const expires = new Date(quote.expireAt);
  const diffMs = expires - now;
  const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));

  const moodStyle = moodColors[quote.mood] || moodColors['Neutral'];

  return (
    <Modal isOpen={!!quote} onClose={onClose}>
        <div className="flex flex-col h-full min-h-[300px]">
            {/* Top Left: Profile, Name, Audience, Timestamp */}
            <div className="flex items-start space-x-3 mb-6">
                <div onClick={goToProfile} className="cursor-pointer hover:opacity-80 transition">
                    <Avatar identity={quote.identity} size="md" />
                </div>
                <div>
                    <h3 onClick={goToProfile} className="text-sm font-bold text-text cursor-pointer hover:underline">{quote.identity.name}</h3>
                    <div className="flex items-center text-xs text-secondary font-medium space-x-2 mt-0.5">
                        <div title={`Audience: ${quote.audience}`} className="flex items-center space-x-1">
                            {quote.audience === 'public' && <Globe size={11} />}
                            {quote.audience === 'followers' && <Users size={11} />}
                            {quote.audience === 'me' && <Lock size={11} />}
                            <span className="capitalize">{quote.audience}</span>
                        </div>
                        <span>•</span>
                        <span>{formatShortTime(quote.createdAt)}</span>
                        {hoursLeft > 0 && (
                             <>
                                <span>•</span>
                                <span className="flex items-center space-x-1">
                                     <Clock size={11} />
                                     <span>{hoursLeft}h left</span>
                                </span>
                             </>
                        )}
                    </div>
                </div>
            </div>

            {/* Center: Content with Mood Background */}
            <div className={clsx(
                "flex-1 flex items-center justify-center p-8 rounded-3xl mb-6 relative overflow-hidden transition-all shadow-inner border",
                moodStyle
            )}>
                 <div className={clsx("text-center text-xl md:text-2xl font-serif leading-relaxed break-words font-medium", quote.font)}>
                    "{quote.content}"
                </div>
            </div>

            {/* Bottom: Action Buttons */}
            <div>
                {isOwner ? (
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { onClose(); if (onCreateNew) onCreateNew(); }}
                            className="py-3 bg-background border border-soft-border text-text hover:bg-surface rounded-xl font-bold transition flex items-center justify-center space-x-2 active:scale-95"
                        >
                            <Plus size={16} />
                            <span>New Quote</span>
                        </button>
                        <button
                            onClick={handleDelete}
                            className="py-3 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-xl font-bold transition flex items-center justify-center space-x-2 active:scale-95"
                        >
                            <Trash2 size={16} />
                            <span>Delete</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <div className="flex-1 bg-surface rounded-xl border border-soft-border p-1 pl-3 flex items-center shadow-sm focus-within:ring-2 ring-slate-200 dark:ring-slate-700 transition-all">
                            <input
                                className="flex-1 bg-transparent border-none outline-none text-sm text-text placeholder:text-secondary h-full py-2"
                                placeholder={`Reply to ${quote.identity.name}...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                                autoFocus
                            />
                            <button
                                onClick={handleReply}
                                disabled={replying || !replyText.trim()}
                                className="p-2 bg-text text-background rounded-lg hover:opacity-90 disabled:opacity-50 transition active:scale-95"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </Modal>
  );
};

// Helper for relative time (duplicate of dateUtils but local for now or import it)
function formatShortTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = (now - date) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default ReplyQuoteModal;
