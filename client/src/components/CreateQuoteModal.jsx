import React, { useState } from 'react';
import axios from 'axios';
import { useSWRConfig } from 'swr';
import Modal from './Modal';
import SelectionCard from './SelectionCard';
import PillSelection from './PillSelection';
import { toast } from 'react-hot-toast';

const moodColors = {
    'Neutral': 'bg-slate-900 text-white border-slate-900',
    'Happy': 'bg-yellow-400 text-yellow-900 border-yellow-400',
    'Sad': 'bg-blue-500 text-white border-blue-500',
    'Angry': 'bg-red-500 text-white border-red-500',
    'Hopeful': 'bg-green-500 text-white border-green-500',
    'Anxious': 'bg-purple-500 text-white border-purple-500',
};

const fontOptions = [
    { value: 'font-serif', label: 'Serif', fontClass: 'font-serif' },
    { value: 'font-sans', label: 'Sans', fontClass: 'font-sans' },
    { value: 'font-mono', label: 'Mono', fontClass: 'font-mono' },
    { value: 'font-[cursive]', label: 'Handwriting', fontClass: 'font-[cursive]' },
    { value: 'font-[system-ui]', label: 'System', fontClass: 'font-[system-ui]' },
];

const CreateQuoteModal = ({ isOpen, onClose, identityId }) => {
  const { mutate } = useSWRConfig();
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
  );
};

export default CreateQuoteModal;
