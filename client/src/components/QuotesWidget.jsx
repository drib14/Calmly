import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import axios from 'axios';
import { Send, Trash2, Eye, Music, Play, Pause } from 'lucide-react';
import Avatar from './Avatar';
import Modal from './Modal';
import QuoteBubble from './QuoteBubble';
import CreateQuoteModal from './CreateQuoteModal';
import ReplyQuoteModal from './ReplyQuoteModal';
import { useIdentity } from '../context/IdentityContext';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const fetcher = url => axios.get(url).then(res => res.data);

const moodStyles = {
    'Neutral': 'border-gray-200 shadow-sm',
    'Happy': 'border-yellow-300 shadow-yellow-100 ring-1 ring-yellow-200',
    'Sad': 'border-blue-200 shadow-blue-50 ring-1 ring-blue-100',
    'Angry': 'border-red-200 shadow-red-50 ring-1 ring-red-100',
    'Hopeful': 'border-green-200 shadow-green-50 ring-1 ring-green-100',
    'Anxious': 'border-purple-200 shadow-purple-50 ring-1 ring-purple-100',
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
  const [deletingQuote, setDeletingQuote] = useState(false);

  // Audio Preview state for "My Quote" modal
  const [isPlaying, setIsPlaying] = useState(false);

  const handleDelete = async () => {
      const myQuote = quotes?.find(q => q.identity?._id === currentIdentity?._id);
      if (!myQuote) return;
      setDeletingQuote(true);
      try {
          await axios.delete(`/quotes/${myQuote._id}`);
          toast.success("Note removed");
          mutate('/quotes/feed');
          mutate(`/profile/${currentIdentity.handle.replace('@','')}`); // Refresh profile quote
          setShowMyQuoteOptions(false);
      } catch (err) {
          toast.error("Failed to remove note");
      } finally {
          setDeletingQuote(false);
      }
  };

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
    <div className="mb-2">
        <div className="flex space-x-4 overflow-x-auto pb-4 pt-20 px-6 custom-scrollbar items-end">

            {/* My Slot (Add or View Mine) */}
            <div className="flex flex-col items-center space-y-2 min-w-[70px] relative z-20">
                <QuoteBubble
                    identity={currentIdentity}
                    quote={myQuote}
                    isMe={true}
                    align="center"
                    onQuoteClick={() => myQuote ? setShowMyQuoteOptions(true) : setShowCreateModal(true)}
                    onAvatarClick={() => handleAvatarClick(currentIdentity)}
                />
                <span className="text-xs text-secondary font-medium mt-1">You</span>
            </div>

            {/* Other Quotes */}
            {otherQuotes.map((quote) => (
                <div key={quote._id} className="flex flex-col items-center space-y-2 min-w-[70px] relative z-10">
                    <QuoteBubble
                        identity={quote.identity}
                        quote={quote}
                        onQuoteClick={() => setReplyQuote(quote)}
                        onAvatarClick={() => handleAvatarClick(quote.identity)}
                    />
                    <span className="text-xs text-secondary font-medium truncate w-16 text-center">{quote.identity.name}</span>
                </div>
            ))}
        </div>

        {/* Create Modal */}
        <CreateQuoteModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            identityId={currentIdentity?._id}
            onCreated={() => mutate('/quotes/feed')}
        />

        {/* My Quote Options Modal */}
        <Modal isOpen={showMyQuoteOptions} onClose={() => setShowMyQuoteOptions(false)}>
             <div className="text-center space-y-6">
                 <h3 className="text-lg font-serif font-bold text-text">Your Note</h3>
                 <div className="flex justify-center">
                     {myQuote && (
                        <div className={`relative p-4 rounded-2xl w-full max-w-xs text-center shadow-sm border bg-white ${moodStyles[myQuote.mood] || 'border-gray-200'}`}>
                            {myQuote.music && (
                                <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-3 py-2 mb-3 border border-gray-100">
                                    <img src={myQuote.music.coverUrl} className="w-8 h-8 rounded-md" alt="Cover" />
                                    <div className="flex-1 text-left overflow-hidden">
                                        <p className="text-xs font-bold truncate">{myQuote.music.trackName}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{myQuote.music.artistName}</p>
                                    </div>
                                     <button
                                        onClick={() => {
                                            const audio = document.getElementById('my-quote-audio');
                                            if (audio.paused) { audio.play(); setIsPlaying(true); }
                                            else { audio.pause(); setIsPlaying(false); }
                                        }}
                                        className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center"
                                     >
                                         {isPlaying ? <Pause size={12} /> : <Play size={12} ml={1} />}
                                     </button>
                                     <audio id="my-quote-audio" src={myQuote.music.previewUrl} onEnded={() => setIsPlaying(false)} />
                                </div>
                            )}
                            <div className="text-sm font-medium text-slate-800 break-words">
                                {myQuote.content}
                            </div>
                            <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-400">
                                <Eye size={12} />
                                <span>{myQuote.views?.length || 0} Views</span>
                            </div>
                        </div>
                     )}
                 </div>
                 <div className="grid grid-cols-2 gap-3 pt-2">
                     <button
                        onClick={() => { setShowMyQuoteOptions(false); setShowCreateModal(true); }}
                        className="py-3 rounded-xl bg-gray-100 text-slate-700 font-bold hover:bg-gray-200 transition"
                     >
                         New Note
                     </button>
                     <button
                        onClick={handleDelete}
                        disabled={deletingQuote}
                        className="py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 disabled:opacity-50 transition"
                     >
                         {deletingQuote ? 'Deleting...' : 'Delete Note'}
                     </button>
                 </div>
             </div>
        </Modal>

        {/* Reply Modal */}
        <ReplyQuoteModal
            quote={replyQuote}
            onClose={() => setReplyQuote(null)}
        />
    </div>
  );
};

export default QuotesWidget;
