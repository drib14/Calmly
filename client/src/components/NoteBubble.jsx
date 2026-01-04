import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';

const moodColors = {
    'Neutral': 'bg-slate-100 text-slate-900 border-slate-200',
    'Happy': 'bg-yellow-100 text-yellow-900 border-yellow-200',
    'Sad': 'bg-blue-100 text-blue-900 border-blue-200',
    'Angry': 'bg-red-100 text-red-900 border-red-200',
    'Hopeful': 'bg-green-100 text-green-900 border-green-200',
    'Anxious': 'bg-purple-100 text-purple-900 border-purple-200',
};

const placeholders = [
    "Share a thought...",
    "What's on your mind?",
    "Feeling...?",
    "Today's vibe?",
    "Thinking about...",
    "Current mood..."
];

const NoteBubble = ({ identity, quote, isMe, onQuoteClick, onAvatarClick, size = "lg" }) => {
  const hasQuote = !!quote;
  const [placeholder, setPlaceholder] = useState("Share a thought...");

  useEffect(() => {
      setPlaceholder(placeholders[Math.floor(Math.random() * placeholders.length)]);
  }, []);

  // Position: Top-Right of Avatar
  // Adjust position closer to avatar for CSS bubble
  const bubblePosition = {
      md: "-top-10 -right-8",
      lg: "-top-12 -right-10",
      xl: "-top-14 -right-12",
  }[size] || "-top-12 -right-10";

  const handleQuoteClick = (e) => {
      e.stopPropagation();
      if (onQuoteClick) onQuoteClick();
  };

  const handleAvatarClick = (e) => {
      e.stopPropagation();
      if (onAvatarClick) onAvatarClick();
  };

  const bubbleClass = hasQuote
    ? (moodColors[quote.mood] || moodColors['Neutral'])
    : 'bg-surface border-soft-border text-secondary';

  // Extract tail colors
  const bgClass = bubbleClass.split(' ').find(c => c.startsWith('bg-')) || 'bg-slate-100';
  const borderClass = bubbleClass.split(' ').find(c => c.startsWith('border-')) || 'border-slate-200';

  return (
    <div className="relative inline-block group">
      {/* The Note Bubble (CSS Rectangular) */}
      {(hasQuote || isMe) && (
        <div
            className={`absolute ${bubblePosition} z-20 transition-transform duration-200 hover:-translate-y-1 origin-bottom-left cursor-pointer`}
            onClick={handleQuoteClick}
        >
            <div className={`
                relative px-3 py-2 rounded-2xl shadow-sm border text-[10px] leading-tight text-center
                min-w-[80px] max-w-[120px] w-fit
                ${bubbleClass} ${hasQuote && quote.font ? quote.font : ''}
            `}>
                {hasQuote ? quote.content : <span className="opacity-70">{placeholder}</span>}

                {/* Tail - Bottom Left */}
                <div className={`
                    absolute -bottom-1.5 left-3 w-3 h-3
                    ${bgClass}
                    border-b border-r ${borderClass}
                    rotate-45 transform
                `}></div>
            </div>
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
