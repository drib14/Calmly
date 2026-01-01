import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import axios from 'axios';
import { Plus, X, Smile, Type, Send, Trash2 } from 'lucide-react';
import Avatar from './Avatar';
import Modal from './Modal';
import SelectionCard from './SelectionCard';
import PillSelection from './PillSelection';
import { useIdentity } from '../context/IdentityContext';
import { toast } from 'react-hot-toast';

const fetcher = url => axios.get(url).then(res => res.data);

const moodColors = {
    'Neutral': 'bg-slate-100 text-slate-900 border-slate-200',
    'Happy': 'bg-yellow-100 text-yellow-900 border-yellow-200',
    'Sad': 'bg-blue-100 text-blue-900 border-blue-200',
    'Angry': 'bg-red-100 text-red-900 border-red-200',
    'Hopeful': 'bg-green-100 text-green-900 border-green-200',
    'Anxious': 'bg-purple-100 text-purple-900 border-purple-200',
};

const fontOptions = [
    { value: 'font-serif', label: 'Serif', fontClass: 'font-serif' },
    { value: 'font-sans', label: 'Sans', fontClass: 'font-sans' },
    { value: 'font-mono', label: 'Mono', fontClass: 'font-mono' },
    { value: 'font-[cursive]', label: 'Handwriting', fontClass: 'font-[cursive]' },
    { value: 'font-[system-ui]', label: 'System', fontClass: 'font-[system-ui]' },
];

const QuotesWidget = () => {
  const { data: quotes, isLoading } = useSWR('/quotes/feed', fetcher, { refreshInterval: 30000 });
  const { currentIdentity } = useIdentity();

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Neutral');
  const [font, setFont] = useState('font-serif');
  const [submitting, setSubmitting] = useState(false);

  // Reply Modal State
  const [replyQuote, setReplyQuote] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  // My Quote Options Modal
  const [showMyQuoteOptions, setShowMyQuoteOptions] = useState(false);
  const [deletingQuote, setDeletingQuote] = useState(false);

  const handleCreate = async () => {
      if (!content.trim()) return;
      setSubmitting(true);
      try {
          await axios.post('/quotes', {
              content,
              mood,
              font,
              identityId: currentIdentity._id
          });
          toast.success("Quote posted");
          mutate('/quotes/feed');
          setShowCreateModal(false);
          setContent('');
          setMood('Neutral');
      } catch (err) {
          toast.error("Failed to post quote");
      } finally {
          setSubmitting(false);
      }
  };

  const handleReply = async () => {
      if (!replyText.trim() || !replyQuote) return;
      setReplying(true);
      try {
          // Send message with context
          const formData = new FormData();
          formData.append('senderIdentityId', currentIdentity._id);
          formData.append('recipientIdentityId', replyQuote.identity._id);
          formData.append('content', `Replying to your note: "${replyQuote.content}"\n\n${replyText}`);

          await axios.post('/messages', formData);
          toast.success("Reply sent");
          setReplyQuote(null);
          setReplyText('');
      } catch (err) {
          toast.error("Failed to send reply");
      } finally {
          setReplying(false);
      }
  };

  const handleDelete = async () => {
      const myQuote = quotes?.find(q => q.identity?._id === currentIdentity?._id);
      if (!myQuote) return;
      setDeletingQuote(true);
      try {
          await axios.delete(`/quotes/${myQuote._id}`);
          toast.success("Quote removed");
          mutate('/quotes/feed');
          setShowMyQuoteOptions(false);
      } catch (err) {
          toast.error("Failed to remove quote");
      } finally {
          setDeletingQuote(false);
      }
  };

  const myQuote = quotes?.find(q => q.identity?._id === currentIdentity?._id);
  const otherQuotes = quotes?.filter(q => q.identity?._id !== currentIdentity?._id) || [];

  return (
    <div className="mb-8">
        <div className="flex space-x-6 overflow-x-auto pb-8 pt-12 px-2 custom-scrollbar items-end">

            {/* My Slot (Add or View Mine) */}
            <div className="flex flex-col items-center space-y-2 min-w-[80px] cursor-pointer group relative z-10">
                {myQuote ? (
                    <div className="relative group" onClick={() => setShowMyQuoteOptions(true)}>
                         <div className={`
                            absolute -top-14 left-1/2 -translate-x-1/2 w-32 p-2 rounded-xl text-[10px] text-center shadow-sm border scale-100 group-hover:scale-105 transition-transform
                            ${moodColors[myQuote.mood] || moodColors['Neutral']} ${myQuote.font}
                            z-20 line-clamp-3 leading-tight
                        `}>
                            {myQuote.content}
                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-b border-r ${moodColors[myQuote.mood]?.split(' ')[0]} ${moodColors[myQuote.mood]?.split(' ')[2] || 'border-slate-200'} bg-inherit`}></div>
                        </div>
                        <Avatar identity={currentIdentity} size="lg" />
                        <div className="absolute -bottom-1 -right-1 bg-surface text-secondary rounded-full p-0.5 border border-soft-border shadow-sm">
                            <div className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold">You</div>
                        </div>
                    </div>
                ) : (
                    <div className="relative group" onClick={() => setShowCreateModal(true)}>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface border border-soft-border px-3 py-1.5 rounded-xl shadow-sm text-[10px] text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            Share a thought
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-b border-r border-soft-border bg-surface"></div>
                        </div>
                        <Avatar identity={currentIdentity} size="lg" />
                        <div className="absolute -bottom-1 -right-1 bg-accent text-white rounded-full p-1 border-2 border-surface">
                            <Plus size={12} />
                        </div>
                    </div>
                )}
                <span className="text-xs text-secondary font-medium mt-1">Your Note</span>
            </div>

            {/* Other Quotes */}
            {otherQuotes.map((quote) => (
                <div key={quote._id} className="flex flex-col items-center space-y-2 min-w-[80px] group relative cursor-pointer" onClick={() => setReplyQuote(quote)}>
                    <div className="relative hover:-translate-y-1 transition-transform duration-200">
                        <div className={`
                            absolute -top-14 left-1/2 -translate-x-1/2 w-32 p-2 rounded-xl text-[10px] text-center shadow-sm border
                            ${moodColors[quote.mood] || moodColors['Neutral']} ${quote.font}
                            z-10 line-clamp-3 leading-tight
                        `}>
                            {quote.content}
                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-b border-r ${moodColors[quote.mood]?.split(' ')[0]} ${moodColors[quote.mood]?.split(' ')[2] || 'border-slate-200'} bg-inherit`}></div>
                        </div>
                        <Avatar identity={quote.identity} size="lg" />
                    </div>
                    <span className="text-xs text-secondary font-medium truncate w-20 text-center">{quote.identity.name}</span>
                </div>
            ))}
        </div>

        {/* Create Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="text-lg font-bold font-serif">New Note</h3>
                    <p className="text-xs text-secondary">Share a thought for 24 hours.</p>
                </div>

                <div className="flex justify-center py-4">
                    <div className={`relative p-4 rounded-2xl w-48 text-center text-sm shadow-sm border transition-all ${moodColors[mood]} ${font}`}>
                        {content || "Your thought here..."}
                        <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-b border-r bg-inherit ${moodColors[mood]?.split(' ')[2] || 'border-slate-200'}`}></div>
                    </div>
                </div>

                <textarea
                    className="w-full bg-background border border-soft-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-text resize-none"
                    rows="2"
                    placeholder="What's on your mind? (Max 60 chars)"
                    maxLength={60}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />

                <div>
                    <label className="text-xs font-bold text-secondary uppercase mb-2 block">Mood</label>
                    <PillSelection
                        options={Object.keys(moodColors).map(k => ({ value: k, label: k }))}
                        value={mood}
                        onChange={setMood}
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-secondary uppercase mb-2 block">Style</label>
                    <SelectionCard
                        options={fontOptions}
                        value={font}
                        onChange={setFont}
                        columns={2}
                        layout="grid"
                    />
                </div>

                <button
                    onClick={handleCreate}
                    disabled={submitting || !content.trim()}
                    className="w-full bg-text text-background py-3 rounded-xl font-bold disabled:opacity-50"
                >
                    {submitting ? 'Posting...' : 'Share'}
                </button>
            </div>
        </Modal>

        {/* My Quote Options Modal */}
        <Modal isOpen={showMyQuoteOptions} onClose={() => setShowMyQuoteOptions(false)}>
             <div className="text-center space-y-4">
                 <h3 className="text-lg font-bold text-text">Your Note</h3>
                 <div className="flex justify-center">
                     {myQuote && (
                        <div className={`relative p-4 rounded-2xl w-48 text-center text-sm shadow-sm border ${moodColors[myQuote.mood]} ${myQuote.font}`}>
                            {myQuote.content}
                        </div>
                     )}
                 </div>
                 <div className="grid grid-cols-2 gap-3 pt-4">
                     <button
                        onClick={() => { setShowMyQuoteOptions(false); setShowCreateModal(true); setContent(myQuote?.content || ''); }}
                        className="py-3 rounded-xl bg-background border border-soft-border font-medium hover:bg-surface text-text"
                     >
                         Leave a new note
                     </button>
                     <button
                        onClick={handleDelete}
                        disabled={deletingQuote}
                        className="py-3 rounded-xl bg-red-50 text-red-500 font-medium hover:bg-red-100 disabled:opacity-50"
                     >
                         {deletingQuote ? 'Deleting...' : 'Delete note'}
                     </button>
                 </div>
             </div>
        </Modal>

        {/* Reply Modal */}
        <Modal isOpen={!!replyQuote} onClose={() => setReplyQuote(null)}>
            {replyQuote && (
                <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-2">
                        <Avatar identity={replyQuote.identity} />
                        <div>
                            <p className="text-sm font-bold text-text">{replyQuote.identity.name}</p>
                            <p className="text-xs text-secondary">{replyQuote.identity.handle}</p>
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl text-sm border ${moodColors[replyQuote.mood] || moodColors['Neutral']} ${replyQuote.font} mb-4`}>
                        {replyQuote.content}
                    </div>

                    <textarea
                        className="w-full bg-background border border-soft-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-text resize-none"
                        rows="3"
                        placeholder={`Reply to ${replyQuote.identity.name}...`}
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
            )}
        </Modal>
    </div>
  );
};

export default QuotesWidget;
