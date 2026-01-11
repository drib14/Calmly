import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import axios from 'axios';
import { Send, Trash2 } from 'lucide-react';
import Avatar from './Avatar';
import Modal from './Modal';
import NoteBubble from './NoteBubble';
import CreateQuoteModal from './CreateQuoteModal';
import ReplyQuoteModal from './ReplyQuoteModal';
import { useIdentity } from '../context/IdentityContext';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const fetcher = url => axios.get(url).then(res => res.data);

const moodColors = {
    'Neutral': 'bg-slate-100 text-slate-900 border-slate-200',
    'Happy': 'bg-yellow-100 text-yellow-900 border-yellow-200',
    'Sad': 'bg-blue-100 text-blue-900 border-blue-200',
    'Angry': 'bg-red-100 text-red-900 border-red-200',
    'Hopeful': 'bg-green-100 text-green-900 border-green-200',
    'Anxious': 'bg-purple-100 text-purple-900 border-purple-200',
};

const QuotesWidget = () => {
  const { data: quotes, isLoading } = useSWR('/quotes/feed', fetcher, { refreshInterval: 30000 });
  const { currentIdentity } = useIdentity();
  const navigate = useNavigate();
  const location = useLocation();

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Reply Modal State
  const [replyQuote, setReplyQuote] = useState(null);

  // My Quote Options Modal
  const [showMyQuoteOptions, setShowMyQuoteOptions] = useState(false);

  // Avatar Click Handler
  const handleAvatarClick = (identity) => {
      const path = location.pathname;
      if (path.includes('/chat') || path.includes('/messages')) {
          // In Chat/Messages page: Open conversation
          navigate('/chat', { state: { startConversationWith: identity } });
      } else {
          // Default: Go to Profile
          navigate(`/profile/${identity.handle.replace('@', '')}`);
      }
  };

  const myQuote = quotes?.find(q => q.identity?._id === currentIdentity?._id);
  const otherQuotes = quotes?.filter(q => q.identity?._id !== currentIdentity?._id) || [];

  return (
    <div className="mb-8">
        <div className="flex space-x-6 overflow-x-auto pb-8 pt-12 px-2 custom-scrollbar items-end">

            {/* My Slot (Add or View Mine) */}
            <div className="flex flex-col items-center space-y-2 min-w-[80px] relative z-10">
                <NoteBubble
                    identity={currentIdentity}
                    quote={myQuote}
                    isMe={true}
                    onQuoteClick={() => myQuote ? setShowMyQuoteOptions(true) : setShowCreateModal(true)}
                    onAvatarClick={() => handleAvatarClick(currentIdentity)}
                />
                <span className="text-xs text-secondary font-medium mt-1">Your Quote</span>
            </div>

            {/* Other Quotes */}
            {otherQuotes.map((quote) => (
                <div key={quote._id} className="flex flex-col items-center space-y-2 min-w-[80px] relative">
                    <NoteBubble
                        identity={quote.identity}
                        quote={quote}
                        onQuoteClick={() => setReplyQuote(quote)}
                        onAvatarClick={() => handleAvatarClick(quote.identity)}
                    />
                    <span className="text-xs text-secondary font-medium truncate w-20 text-center">{quote.identity.name}</span>
                </div>
            ))}
        </div>

        {/* Create Modal */}
        <CreateQuoteModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            identityId={currentIdentity?._id}
        />

        {/* Reply Modal / View Modal */}
        <ReplyQuoteModal
            quote={showMyQuoteOptions ? myQuote : replyQuote}
            onClose={() => {
                setReplyQuote(null);
                setShowMyQuoteOptions(false);
            }}
            onCreateNew={() => {
                setShowMyQuoteOptions(false);
                setShowCreateModal(true);
            }}
        />
    </div>
  );
};

export default QuotesWidget;
