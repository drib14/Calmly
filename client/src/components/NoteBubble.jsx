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
      md: "-top-6 -right-2",
      lg: "-top-8 -right-4",
      xl: "-top-10 -right-6",
  }[size] || "-top-8 -right-4";

  const handleQuoteClick = (e) => {
      e.stopPropagation();
      if (onQuoteClick) onQuoteClick();
  };

  const handleAvatarClick = (e) => {
      e.stopPropagation();
      if (onAvatarClick) onAvatarClick();
  };

  // Get tail color from mood class (bg-...)
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
                <div className={`relative ${bubbleClasses} rounded-2xl shadow-sm border max-w-[100px] animate-in fade-in zoom-in duration-300`}>
                    <div className={`px-3 py-2 text-[11px] leading-tight text-center ${quote.font || ''} line-clamp-3`}>
                        {quote.content}
                    </div>

                    {/* Tail: Bottom-Left pointing to avatar */}
                    <div className={`
                        absolute -bottom-1.5 left-2 w-3 h-3
                        ${bgClass}
                        border-b border-r ${borderClass}
                        rotate-45 transform
                    `}></div>
                </div>
            ) : (
                /* Empty State (Add Note) */
                <div className={`relative ${bubbleClasses} rounded-2xl shadow-sm border whitespace-nowrap`}>
                    <div className="px-3 py-2 text-[10px] opacity-70">
                        Share a thought...
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
