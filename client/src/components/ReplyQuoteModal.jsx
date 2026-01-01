import React, { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import Avatar from './Avatar';
import { Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useIdentity } from '../context/IdentityContext';

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
          formData.append('replyToQuote', JSON.stringify({
            content: quote.content,
            mood: quote.mood,
            font: quote.font,
            identityName: quote.identity.name
          }));

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

  return (
    <Modal isOpen={!!quote} onClose={onClose}>
        <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-2">
                <Avatar identity={quote.identity} />
                <div>
                    <p className="text-sm font-bold text-text">{quote.identity.name}</p>
                    <p className="text-xs text-secondary">{quote.identity.handle}</p>
                </div>
            </div>

            <div className={`p-4 rounded-xl text-sm border ${moodColors[quote.mood] || moodColors['Neutral']} ${quote.font} mb-4`}>
                {quote.content}
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
