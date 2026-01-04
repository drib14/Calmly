import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSWRConfig } from 'swr';
import Modal from './Modal';
import SelectionCard from './SelectionCard';
import PillSelection from './PillSelection';
import QuoteBubbleShape from './QuoteBubbleShape';
import { toast } from 'react-hot-toast';

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

const placeholders = [
    "What's on your mind? (Max 60 chars)",
    "Share a thought...",
    "Today's vibe...",
    "Feeling...",
    "Thinking about..."
];

const CreateQuoteModal = ({ isOpen, onClose, identityId }) => {
  const { mutate } = useSWRConfig();
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Neutral');
  const [font, setFont] = useState('font-serif');
  const [submitting, setSubmitting] = useState(false);
  const [placeholder, setPlaceholder] = useState(placeholders[0]);

  useEffect(() => {
      if (isOpen) {
          setPlaceholder(placeholders[Math.floor(Math.random() * placeholders.length)]);
      }
  }, [isOpen]);

  const handleCreate = async () => {
      if (!content.trim()) return;
      setSubmitting(true);
      try {
          await axios.post('/quotes', {
              content,
              mood,
              font,
              identityId
          });
          toast.success("Quote posted");
          mutate('/quotes/feed');
          // We can't easily guess the handle here without props, but mutating /quotes/feed is usually enough for the widget.
          // For profile page, we might need to invalidate specific keys or let SWR revalidate on focus.
          // Or we can pass an onSuccess callback.
          mutate(key => typeof key === 'string' && key.startsWith('/profile/'), undefined, { revalidate: true });

          onClose();
          setContent('');
          setMood('Neutral');
      } catch (err) {
          toast.error("Failed to post quote");
      } finally {
          setSubmitting(false);
      }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-bold font-serif text-text">New Quote</h3>
                <p className="text-xs text-secondary">Share a thought for 24 hours.</p>
            </div>

            <div className="flex justify-center py-4">
                {/* Note Bubble Preview */}
                <div className={`relative w-48 h-32 flex items-center justify-center`}>
                     <QuoteBubbleShape
                        className={`absolute inset-0 w-full h-full drop-shadow-sm transition-colors duration-300 ${
                            moodColors[mood].replace('bg-', 'fill-').replace('border-', 'stroke-')
                        }`}
                        style={{ strokeWidth: '2px' }}
                    />
                    <div className={`relative z-10 px-6 pb-4 text-[11px] text-center leading-tight line-clamp-3 w-full ${moodColors[mood].split(' ')[1]} ${font}`}>
                        {content || placeholder}
                    </div>
                </div>
            </div>

            <textarea
                className="w-full bg-background border border-soft-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-text resize-none"
                rows="2"
                placeholder={placeholder}
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
  );
};

export default CreateQuoteModal;
