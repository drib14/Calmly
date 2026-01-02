import React, { useState } from 'react';
import axios from 'axios';
import { useSWRConfig } from 'swr';
import Modal from './Modal';
import SelectionCard from './SelectionCard';
import PillSelection from './PillSelection';
import { toast } from 'react-hot-toast';

const moodColors = {
    'Neutral': 'bg-white border-gray-200 shadow-sm text-slate-800',
    'Happy': 'bg-white border-yellow-300 shadow-yellow-100 text-slate-800',
    'Sad': 'bg-white border-blue-200 shadow-blue-50 text-slate-800',
    'Angry': 'bg-white border-red-200 shadow-red-50 text-slate-800',
    'Hopeful': 'bg-white border-green-200 shadow-green-50 text-slate-800',
    'Anxious': 'bg-white border-purple-200 shadow-purple-50 text-slate-800',
};

const fontOptions = [
    { value: 'font-serif', label: 'Serif', fontClass: 'font-serif' },
    { value: 'font-sans', label: 'Sans', fontClass: 'font-sans' },
    { value: 'font-mono', label: 'Mono', fontClass: 'font-mono' },
    { value: 'font-[cursive]', label: 'Handwriting', fontClass: 'font-[cursive]' },
    { value: 'font-[system-ui]', label: 'System', fontClass: 'font-[system-ui]' },
];

const CreateQuoteModal = ({ isOpen, onClose, identityId, onCreated }) => {
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
              identityId,
              // music: null // Explicitly no music
          });
          toast.success("Quote posted");
          mutate('/quotes/feed');
          if (onCreated) onCreated();
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
                <h3 className="text-lg font-bold font-serif">New Quote</h3>
                <p className="text-xs text-secondary">Share a thought for 24 hours.</p>
            </div>

            <div className="flex justify-center py-4">
                <div className={`relative p-4 rounded-2xl w-48 text-center text-sm shadow-sm border transition-all ${moodColors[mood]} ${font}`}>
                    {content || "Your thought here..."}
                    <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-[-1px]`}>
                         <div className={`w-2 h-2 rounded-full bg-white border border-gray-200 ${moodColors[mood]?.split(' ')[2]}`}></div>
                         <div className={`w-1 h-1 rounded-full bg-white border border-gray-200 ${moodColors[mood]?.split(' ')[2]}`}></div>
                    </div>
                </div>
            </div>

            <div className="relative">
                <textarea
                    className="w-full bg-background border border-soft-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-text resize-none pb-6"
                    rows="2"
                    placeholder="What's on your mind?"
                    maxLength={60}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div className="absolute bottom-2 right-3 text-xs text-secondary font-medium">
                    {content.length}/60
                </div>
            </div>

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
