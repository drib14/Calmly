import React, { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import Avatar from './Avatar';
import { Send, Globe, Users, Lock, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useIdentity } from '../context/IdentityContext';
import clsx from 'clsx';

const moodColors = {
    'Neutral': 'bg-slate-100 text-slate-900 border-slate-200',
    'Happy': 'bg-yellow-100 text-yellow-900 border-yellow-200',
    'Sad': 'bg-blue-100 text-blue-900 border-blue-200',
    'Angry': 'bg-red-100 text-red-900 border-red-200',
    'Hopeful': 'bg-green-100 text-green-900 border-green-200',
    'Anxious': 'bg-purple-100 text-purple-900 border-purple-200',
};

const ReplyQuoteModal = ({ quote, onClose }) => {
  const { currentIdentity } = useIdentity();
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

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

  if (!quote) return null;

  // Calculate Expiry Hours
  const now = new Date();
  const expires = new Date(quote.expireAt);
  const diffMs = expires - now;
  const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));

  return (
    <Modal isOpen={!!quote} onClose={onClose}>
        <div className="relative pt-2 pb-2">
            {/* Header: User Info Top Left + Audience Icon */}
            <div className="flex items-start space-x-3 mb-8">
                <Avatar identity={quote.identity} size="md" />
                <div>
                    <h3 className="text-sm font-bold text-text">{quote.identity.name}</h3>
                    <div className="flex items-center text-xs text-secondary font-medium space-x-1">
                        <span>{formatShortTime(quote.createdAt)}</span>
                        <span>•</span>
                        {/* Audience Icon Inline */}
                        <div title={`Audience: ${quote.audience}`}>
                            {quote.audience === 'public' && <Globe size={12} />}
                            {quote.audience === 'followers' && <Users size={12} />}
                            {quote.audience === 'me' && <Lock size={12} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Center: Content & Reply */}
            <div className="text-center mb-8">
                {/* Expires Header */}
                {hoursLeft > 0 && (
                     <div className="flex items-center justify-center space-x-1 text-xs font-bold text-secondary uppercase tracking-widest mb-4">
                         <Clock size={12} />
                         <span>Expires in {hoursLeft} hrs</span>
                     </div>
                )}

                {/* Quote Content */}
                <div className={clsx("text-xl md:text-2xl font-serif text-text mb-8 px-4 leading-relaxed break-words", quote.font)}>
                    "{quote.content}"
                </div>

                {/* Reply Input */}
                <div className="bg-surface rounded-2xl border border-soft-border p-2 flex items-center shadow-sm max-w-sm mx-auto">
                    <input
                        className="flex-1 bg-transparent border-none outline-none text-sm px-3 text-text placeholder:text-secondary"
                        placeholder={`Reply to ${quote.identity.name}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                    />
                </div>
            </div>

            {/* Action Buttons (Footer) */}
            <div className="flex items-center justify-center space-x-4 border-t border-soft-border pt-4">
                 <button
                    onClick={handleReply}
                    disabled={replying || !replyText.trim()}
                    className="flex-1 py-3 bg-text text-background rounded-xl font-bold disabled:opacity-50 flex items-center justify-center space-x-2 transition hover:opacity-90 active:scale-95"
                >
                    {replying ? <span>Sending...</span> : <><span>Send Reply</span><Send size={16}/></>}
                </button>
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
