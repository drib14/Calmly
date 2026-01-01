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

const NoteBubble = ({ identity, quote, isMe, onQuoteClick, onAvatarClick, size = "lg" }) => {
  const hasQuote = !!quote;

  // Position: Top-Right of Avatar (approx 1 o'clock)
  const bubblePosition = {
      md: "-top-8 -right-4",
      lg: "-top-10 -right-6",
      xl: "-top-12 -right-8",
  }[size] || "-top-10 -right-6";

  const handleQuoteClick = (e) => {
      e.stopPropagation();
      if (onQuoteClick) onQuoteClick();
  };

  const handleAvatarClick = (e) => {
      e.stopPropagation();
      if (onAvatarClick) onAvatarClick();
  };

  // Get tail color from mood class (bg-...)
  // We need to extract the color class to apply to the tail
  // moodColors value format: 'bg-color text-color border-color'
  const bubbleClasses = hasQuote
    ? (moodColors[quote.mood] || moodColors['Neutral'])
    : 'bg-surface border-soft-border text-secondary';

  // Extract bg class for tail
  const bgClass = bubbleClasses.split(' ').find(c => c.startsWith('bg-')) || 'bg-slate-100';
  const borderClass = bubbleClasses.split(' ').find(c => c.startsWith('border-')) || 'border-slate-200';

  return (
    <div className="relative inline-block group">
      {/* The Note Bubble */}
      {(hasQuote || isMe) && (
        <div
            className={`absolute ${bubblePosition} z-20 transition-transform duration-200 hover:-translate-y-1 origin-bottom-left cursor-pointer`}
            onClick={handleQuoteClick}
        >
            {hasQuote ? (
                <div className={`
                    relative px-3 py-2 rounded-2xl shadow-sm border text-[11px] leading-tight max-w-[100px] text-center
                    ${bubbleClasses} ${quote.font || ''}
                    line-clamp-3 animate-in fade-in zoom-in duration-300
                `}>
                    {quote.content}

                    {/* Tail: Bottom-Left pointing to avatar */}
                    {/* Creating a small tail using pseudo-element style div */}
                    <div className={`
                        absolute -bottom-1.5 left-2 w-3 h-3
                        ${bgClass}
                        border-b border-r ${borderClass}
                        rotate-45 transform
                    `}></div>
                </div>
            ) : (
                /* Empty State (Add Note) */
                <div className={`
                    relative px-3 py-2 rounded-2xl shadow-sm border text-[10px] whitespace-nowrap
                    ${bubbleClasses}
                `}>
                    <span className="opacity-70">Share a thought...</span>
                    <div className="absolute -top-2 -right-2 bg-accent text-white rounded-full p-0.5 border-2 border-surface shadow-sm">
                        <Plus size={10} />
                    </div>
                    {/* Tail */}
                    <div className={`
                        absolute -bottom-1.5 left-2 w-3 h-3
                        ${bgClass}
                        border-b border-r ${borderClass}
                        rotate-45 transform
                    `}></div>
                </div>
            )}
        </div>
      )}

      {/* Avatar */}
      <div onClick={handleAvatarClick} className="cursor-pointer">
          <Avatar identity={identity} size={size} />
      </div>
    </div>
  );
};

export default NoteBubble;
