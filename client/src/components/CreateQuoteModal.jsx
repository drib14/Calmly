import React, { useState } from 'react';
import axios from 'axios';
import { useSWRConfig } from 'swr';
import Modal from './Modal';
import SelectionCard from './SelectionCard';
import PillSelection from './PillSelection';
import { toast } from 'react-hot-toast';
import { Clock, Battery, BatteryCharging, BatteryFull, Zap } from 'lucide-react';
import clsx from 'clsx';

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

const CreateQuoteModal = ({ isOpen, onClose, identityId }) => {
  const { mutate } = useSWRConfig();
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Neutral');
  const [font, setFont] = useState('font-serif');
  const [audience, setAudience] = useState('public');
  const [duration, setDuration] = useState(24);
  const [customDuration, setCustomDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
      if (!content.trim()) return;

      const finalDuration = duration === 'custom' ? Number(customDuration) : duration;
      if (!finalDuration || isNaN(finalDuration) || finalDuration <= 0) {
          return toast.error("Invalid duration");
      }

      setSubmitting(true);
      try {
          await axios.post('/quotes', {
              content,
              mood,
              font,
              identityId,
              audience,
              duration: finalDuration
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
          setAudience('public');
          setDuration(24);
      } catch (err) {
          toast.error("Failed to post quote");
      } finally {
          setSubmitting(false);
      }
  };

  const durationOptions = [
      { value: 3, label: '3h', icon: Battery },
      { value: 6, label: '6h', icon: BatteryCharging },
      { value: 12, label: '12h', icon: BatteryFull },
      { value: 24, label: '24h', icon: Clock },
      { value: 'custom', label: '...', icon: Zap },
  ];

  const audienceOptions = [
      { value: 'public', label: 'Public' },
      { value: 'followers', label: 'Followers' },
      { value: 'me', label: 'Only Me' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-bold font-serif">New Note</h3>
                <p className="text-xs text-secondary">Share a thought with your world.</p>
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

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-secondary uppercase mb-2 block">Audience</label>
                    <PillSelection
                        options={audienceOptions}
                        value={audience}
                        onChange={setAudience}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-secondary uppercase mb-2 block">Duration</label>
                    <div className="flex flex-wrap gap-2">
                        {durationOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setDuration(opt.value)}
                                className={clsx(
                                    "p-2 rounded-lg border flex items-center justify-center transition active:scale-95",
                                    duration === opt.value
                                        ? "bg-slate-900 text-white border-slate-900"
                                        : "bg-background text-secondary border-soft-border hover:bg-surface"
                                )}
                                title={opt.label}
                            >
                                <opt.icon size={16} />
                            </button>
                        ))}
                    </div>
                    {duration === 'custom' && (
                            <div className="flex items-center space-x-2 mt-2">
                            <input
                                type="number"
                                className="w-full bg-background border border-soft-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-text"
                                placeholder="Hours"
                                min="1"
                                max="168"
                                value={customDuration}
                                onChange={(e) => setCustomDuration(e.target.value)}
                            />
                            <span className="text-xs text-secondary">hrs</span>
                            </div>
                    )}
                </div>
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
