import React from 'react';
import Avatar from './Avatar';
import { Plus } from 'lucide-react';

const moodColors = {
    'Neutral': 'bg-slate-100 text-slate-900 border-slate-200',
    'Happy': 'bg-yellow-100 text-yellow-900 border-yellow-200',
    'Sad': 'bg-blue-100 text-blue-900 border-blue-200',
    'Angry': 'bg-red-100 text-red-900 border-red-200',
    'Hopeful': 'bg-green-100 text-green-900 border-green-200',
    'Anxious': 'bg-purple-100 text-purple-900 border-purple-200',
};

const NoteBubble = ({ identity, quote, isMe, onClick, size = "lg" }) => {
  const hasQuote = !!quote;

  // Size mapping for the bubble positioning
  const bubblePosition = {
      md: "-top-8 -right-2",
      lg: "-top-10 -right-4",
      xl: "-top-12 -right-2", // Profile header size
  }[size] || "-top-10 -right-4";

  return (
    <div className="relative inline-block group cursor-pointer" onClick={onClick}>
      {/* The Note Bubble */}
      {(hasQuote || isMe) && (
        <div className={`absolute ${bubblePosition} z-20 transition-transform duration-200 hover:-translate-y-1 origin-bottom-left`}>
            {hasQuote ? (
                <div className={`
                    relative px-3 py-2 rounded-2xl rounded-bl-none shadow-sm border text-[11px] leading-tight max-w-[100px] text-center
                    ${moodColors[quote.mood] || moodColors['Neutral']} ${quote.font || ''}
                    line-clamp-3 animate-in fade-in zoom-in duration-300
                `}>
                    {quote.content}
                    {/* Small dot/tail connecting to avatar */}
                    <div className={`absolute -bottom-1 -left-1 w-2 h-2 rounded-full ${moodColors[quote.mood]?.split(' ')[0] || 'bg-slate-100'}`}></div>
                    <div className={`absolute -bottom-2 -left-2 w-1 h-1 rounded-full ${moodColors[quote.mood]?.split(' ')[0] || 'bg-slate-100'}`}></div>
                </div>
            ) : (
                /* Empty State (Add Note) */
                <div className="relative px-3 py-2 rounded-2xl rounded-bl-none shadow-sm border bg-surface border-soft-border text-[10px] text-secondary whitespace-nowrap">
                    <span className="opacity-70">Share a thought...</span>
                    <div className="absolute -top-2 -right-2 bg-accent text-white rounded-full p-0.5 border-2 border-surface shadow-sm">
                        <Plus size={10} />
                    </div>
                    {/* Tail */}
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-surface border border-soft-border"></div>
                </div>
            )}
        </div>
      )}

      {/* Avatar */}
      <Avatar identity={identity} size={size} />
    </div>
  );
};

export default NoteBubble;
