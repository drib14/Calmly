import React from 'react';
import Avatar from './Avatar';
import { Plus } from 'lucide-react';

const moodColors = {
    'Neutral': 'bg-slate-900 text-white border-slate-900',
    'Happy': 'bg-yellow-400 text-yellow-900 border-yellow-400',
    'Sad': 'bg-blue-500 text-white border-blue-500',
    'Angry': 'bg-red-500 text-white border-red-500',
    'Hopeful': 'bg-green-500 text-white border-green-500',
    'Anxious': 'bg-purple-500 text-white border-purple-500',
};

const NoteBubble = ({ identity, quote, isMe, onQuoteClick, onAvatarClick, size = "lg" }) => {
  const hasQuote = !!quote;

  // Position: Centered above the avatar
  const bubblePosition = {
      md: "-top-10 left-1/2 -translate-x-1/2",
      lg: "-top-12 left-1/2 -translate-x-1/2",
      xl: "-top-14 left-1/2 -translate-x-1/2",
  }[size] || "-top-12 left-1/2 -translate-x-1/2";

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

  // Extract bg class for tail
  const bgClass = bubbleClasses.split(' ').find(c => c.startsWith('bg-')) || 'bg-slate-900';
  const borderClass = bubbleClasses.split(' ').find(c => c.startsWith('border-')) || 'border-slate-900';

  return (
    <div className="relative inline-block group">
      {/* The Note Bubble */}
      {(hasQuote || isMe) && (
        <div
            className={`absolute ${bubblePosition} z-20 transition-transform duration-200 hover:-translate-y-1 origin-bottom cursor-pointer min-w-[120px] flex justify-center`}
            onClick={handleQuoteClick}
        >
            {hasQuote ? (
                <div className={`relative ${bubbleClasses} rounded-3xl shadow-lg border px-4 py-3 animate-in fade-in zoom-in duration-300`}>
                    <div className={`text-sm font-medium leading-tight text-center ${quote.font || ''} line-clamp-3 max-w-[180px]`}>
                        {quote.content}
                    </div>

                    {/* Tail: Two dots style (Thought bubble-ish) or Simple Point */}
                     <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 ${bgClass} rotate-45 transform rounded-sm`}></div>
                </div>
            ) : (
                /* Empty State (Add Note) */
                <div className={`relative ${bubbleClasses} rounded-full shadow-sm border px-3 py-1.5 whitespace-nowrap`}>
                    <div className="text-[10px] font-bold opacity-80">
                        + Note
                    </div>
                    <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 ${bgClass} rotate-45 transform`}></div>
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
