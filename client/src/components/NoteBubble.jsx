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

  // Position: Right of Avatar
  // "right" means we push it to the right side.
  // The parent is `relative inline-block`.
  // If we want it strictly on the right side: `left-full top-0 ml-2`.

  const bubbleContainerClass = {
      md: "left-[50px] -top-2",
      lg: "left-[70px] -top-2",
      xl: "left-[90px] -top-2",
  }[size] || "left-[70px] -top-2";

  const handleQuoteClick = (e) => {
      e.stopPropagation();
      if (onQuoteClick) onQuoteClick();
  };

  const handleAvatarClick = (e) => {
      e.stopPropagation();
      if (onAvatarClick) onAvatarClick();
  };

  const bubbleClasses = hasQuote
    ? (moodColors[quote.mood] || moodColors['Neutral'])
    : 'bg-surface border-soft-border text-secondary';

  const bgClass = bubbleClasses.split(' ').find(c => c.startsWith('bg-')) || 'bg-slate-100';
  const borderClass = bubbleClasses.split(' ').find(c => c.startsWith('border-')) || 'border-slate-200';

  return (
    <div className="relative inline-block group">
      {/* The Note Bubble */}
      {(hasQuote || isMe) && (
        <div
            className={`absolute ${bubbleContainerClass} z-20 transition-transform duration-200 hover:-translate-y-1 origin-left cursor-pointer w-[120px]`}
            onClick={handleQuoteClick}
        >
            {hasQuote ? (
                <div className={`
                    relative px-3 py-2 rounded-xl shadow-sm border text-[11px] leading-tight text-left
                    ${bubbleClasses} ${quote.font || ''}
                    line-clamp-3 animate-in fade-in zoom-in duration-300
                `}>
                    {quote.content}

                    {/* Tail: Pointing Left (to the avatar) */}
                    {/* Positioned on the left edge, centered vertically */}
                    <div className={`
                        absolute top-1/2 -left-1.5 w-3 h-3
                        ${bgClass}
                        border-l border-b ${borderClass}
                        rotate-45 transform -translate-y-1/2
                    `}></div>
                </div>
            ) : (
                /* Empty State (Add Note) */
                <div className={`
                    relative px-3 py-2 rounded-xl shadow-sm border text-[10px] whitespace-nowrap
                    ${bubbleClasses}
                `}>
                    <span className="opacity-70">Share a thought...</span>
                    <div className="absolute -top-2 -right-2 bg-accent text-white rounded-full p-0.5 border-2 border-surface shadow-sm">
                        <Plus size={10} />
                    </div>

                     {/* Tail: Pointing Left */}
                     <div className={`
                        absolute top-1/2 -left-1.5 w-3 h-3
                        ${bgClass}
                        border-l border-b ${borderClass}
                        rotate-45 transform -translate-y-1/2
                    `}></div>
                </div>
            )}
        </div>
      )}

      {/* Avatar */}
      <div onClick={handleAvatarClick} className="cursor-pointer relative z-30">
          <Avatar identity={identity} size={size} />
      </div>
    </div>
  );
};

export default NoteBubble;
