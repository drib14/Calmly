import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';
import Avatar from './Avatar';
import { Send, MoreHorizontal, Flag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useIdentity } from '../context/IdentityContext';
import { formatDistanceToNow, addHours } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import QuoteBubbleShape from './QuoteBubbleShape';

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
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef(null);

  useEffect(() => {
      const handleClickOutside = (event) => {
          if (optionsRef.current && !optionsRef.current.contains(event.target)) {
              setShowOptions(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReply = async () => {
      if (!replyText.trim() || !quote) return;
      setReplying(true);
      try {
          const formData = new FormData();
          formData.append('senderIdentityId', currentIdentity._id);
          formData.append('recipientIdentityId', quote.identity._id);
          formData.append('content', `Replying to your note: "${quote.content}"\n\n${replyText}`);

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

  const handleReport = async () => {
      if (!currentIdentity) return toast.error("Login to report");
      try {
          await axios.post(`/quotes/${quote._id}/report`, { reason: 'Inappropriate content' });
          toast.success("Report submitted");
          setShowOptions(false);
      } catch (err) {
          toast.error("Failed to report quote");
      }
  };

  if (!quote) return null;

  return (
    <Modal isOpen={!!quote} onClose={onClose}>
        <div className="space-y-4">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                    <Avatar identity={quote.identity} />
                    <div>
                        <p className="text-sm font-bold text-text">{quote.identity.name}</p>
                        <p className="text-xs text-secondary">{quote.identity.handle}</p>
                    </div>
                </div>
                {/* Options */}
                <div className="relative" ref={optionsRef}>
                    <button onClick={() => setShowOptions(!showOptions)} className="text-secondary hover:text-text transition p-1">
                        <MoreHorizontal size={18} />
                    </button>
                    <AnimatePresence>
                        {showOptions && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 top-6 bg-surface border border-soft-border shadow-lg rounded-lg p-1 z-20 min-w-[120px]"
                            >
                                <button onClick={handleReport} className="flex items-center space-x-2 w-full px-2 py-1.5 text-xs font-medium text-secondary hover:bg-background rounded hover:text-text">
                                    <Flag size={12} /> <span>Report</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Quote Bubble Display */}
            <div className="flex justify-center py-2">
                 <div className={`relative w-48 h-32 flex items-center justify-center`}>
                     <QuoteBubbleShape
                        className={`absolute inset-0 w-full h-full drop-shadow-sm transition-colors duration-300 ${
                            (quote.mood === 'Neutral' ? 'fill-slate-100 stroke-slate-200' :
                            quote.mood === 'Happy' ? 'fill-yellow-100 stroke-yellow-200' :
                            quote.mood === 'Sad' ? 'fill-blue-100 stroke-blue-200' :
                            quote.mood === 'Angry' ? 'fill-red-100 stroke-red-200' :
                            quote.mood === 'Hopeful' ? 'fill-green-100 stroke-green-200' :
                            quote.mood === 'Anxious' ? 'fill-purple-100 stroke-purple-200' : 'fill-white stroke-slate-200')
                        }`}
                        style={{ strokeWidth: '2px' }}
                    />
                     <div className={`relative z-10 px-6 pb-4 text-[11px] text-center leading-tight line-clamp-3 w-full ${
                         quote.mood === 'Neutral' ? 'text-slate-900' :
                         quote.mood === 'Happy' ? 'text-yellow-900' :
                         quote.mood === 'Sad' ? 'text-blue-900' :
                         quote.mood === 'Angry' ? 'text-red-900' :
                         quote.mood === 'Hopeful' ? 'text-green-900' :
                         quote.mood === 'Anxious' ? 'text-purple-900' : 'text-slate-900'
                     } ${quote.font || ''}`}>
                         {quote.content}
                     </div>
                 </div>
            </div>

            {/* Time Info */}
            <div className="text-center text-[10px] text-secondary">
                <span>Posted {formatDistanceToNow(new Date(quote.createdAt))} ago</span>
                <span className="mx-1">•</span>
                <span>Expires in {formatDistanceToNow(addHours(new Date(quote.createdAt), 24))}</span>
            </div>

            <textarea
                className="w-full bg-background border border-soft-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-text resize-none"
                rows="3"
                placeholder={`Reply to ${quote.identity.name}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
            />

            <button
                onClick={handleReply}
                disabled={replying || !replyText.trim()}
                className="w-full bg-text text-background py-3 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center space-x-2"
            >
                {replying ? <span>Sending...</span> : <><span>Send Reply</span><Send size={16}/></>}
            </button>
        </div>
    </Modal>
  );
};

export default ReplyQuoteModal;
