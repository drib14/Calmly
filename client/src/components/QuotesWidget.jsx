import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import axios from 'axios';
import { Plus, X, Smile, Type } from 'lucide-react';
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
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Neutral');
  const [font, setFont] = useState('font-serif');
  const [submitting, setSubmitting] = useState(false);

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
          setShowModal(false);
          setContent('');
          setMood('Neutral');
      } catch (err) {
          toast.error("Failed to post quote");
      } finally {
          setSubmitting(false);
      }
  };

  const myQuote = quotes?.find(q => q.identity?._id === currentIdentity?._id);

  return (
    <div className="mb-8">
        <div className="flex space-x-4 overflow-x-auto pb-4 custom-scrollbar items-start">
            {/* Add Quote Button (Self) */}
            <div className="flex flex-col items-center space-y-2 min-w-[80px] cursor-pointer group" onClick={() => setShowModal(true)}>
                <div className="relative">
                    <Avatar identity={currentIdentity} size="lg" />
                    <div className="absolute -bottom-1 -right-1 bg-accent text-white rounded-full p-1 border-2 border-surface">
                        <Plus size={12} />
                    </div>
                </div>
                <span className="text-xs text-secondary font-medium">Add Quote</span>
            </div>

            {/* Quote List */}
            {quotes?.map((quote) => (
                <div key={quote._id} className="flex flex-col items-center space-y-2 min-w-[100px] max-w-[120px] group relative">
                    <div className="relative">
                        <div className={`
                            absolute -top-12 left-1/2 -translate-x-1/2 w-32 p-2 rounded-xl text-[10px] text-center shadow-sm border
                            ${moodColors[quote.mood] || moodColors['Neutral']} ${quote.font}
                            opacity-100 transition-all z-10 line-clamp-3 leading-tight
                        `}>
                            {quote.content}
                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-b border-r ${moodColors[quote.mood]?.split(' ')[0]} ${moodColors[quote.mood]?.split(' ')[2] || 'border-slate-200'} bg-inherit`}></div>
                        </div>
                        <Avatar identity={quote.identity} size="lg" />
                    </div>
                    <span className="text-xs text-secondary font-medium truncate w-full text-center">{quote.identity.name}</span>
                </div>
            ))}
        </div>

        {/* Create Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="text-lg font-bold font-serif">Share a Thought</h3>
                    <p className="text-xs text-secondary">Visible for 24 hours.</p>
                </div>

                {/* Preview */}
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
                    {submitting ? 'Posting...' : 'Share Quote'}
                </button>
            </div>
        </Modal>
    </div>
  );
};

export default QuotesWidget;
