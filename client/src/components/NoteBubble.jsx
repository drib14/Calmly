import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';

const moodColors = {
    'Neutral': 'fill-slate-100 text-slate-900 stroke-slate-200',
    'Happy': 'fill-yellow-100 text-yellow-900 stroke-yellow-200',
    'Sad': 'fill-blue-100 text-blue-900 stroke-blue-200',
    'Angry': 'fill-red-100 text-red-900 stroke-red-200',
    'Hopeful': 'fill-green-100 text-green-900 stroke-green-200',
    'Anxious': 'fill-purple-100 text-purple-900 stroke-purple-200',
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
  const bubblePosition = {
      md: "-top-12 -right-10",
      lg: "-top-14 -right-12",
      xl: "-top-16 -right-14",
  }[size] || "-top-14 -right-12";

  const handleQuoteClick = (e) => {
      e.stopPropagation();
      if (onQuoteClick) onQuoteClick();
  };

  const handleAvatarClick = (e) => {
      e.stopPropagation();
      if (onAvatarClick) onAvatarClick();
  };

  const colorClass = hasQuote
    ? (moodColors[quote.mood] || moodColors['Neutral'])
    : 'fill-surface stroke-soft-border text-secondary';

  // Extract classes
  const fillClass = colorClass.split(' ').find(c => c.startsWith('fill-')) || 'fill-white';
  const strokeClass = colorClass.split(' ').find(c => c.startsWith('stroke-')) || 'stroke-slate-200';
  const textClass = colorClass.split(' ').find(c => c.startsWith('text-')) || 'text-slate-900';

  return (
    <div className="relative inline-block group">
      {/* The Note Cloud Bubble */}
      {(hasQuote || isMe) && (
        <div
            className={`absolute ${bubblePosition} z-20 transition-transform duration-200 hover:-translate-y-1 origin-bottom-left cursor-pointer w-32 h-24 flex items-center justify-center`}
            onClick={handleQuoteClick}
        >
            <svg
                viewBox="0 0 120 100"
                className={`absolute inset-0 w-full h-full drop-shadow-sm ${fillClass} ${strokeClass} transition-colors duration-300`}
                preserveAspectRatio="none"
            >
                {/* Cloud Shape */}
                <path
                    strokeWidth="2"
                    d="M30,75
                       Q10,75 10,55
                       Q10,35 30,30
                       Q40,10 60,10
                       Q80,10 90,30
                       Q110,35 110,55
                       Q110,75 90,75
                       Q80,75 75,75
                       L30,75 Z"
                />
                {/* Trailing Circles */}
                <circle cx="25" cy="85" r="5" strokeWidth="2" />
                <circle cx="15" cy="95" r="3" strokeWidth="2" />
            </svg>

            <div className={`relative z-10 px-4 pb-2 text-[10px] text-center leading-tight line-clamp-3 max-w-[80%] ${textClass} ${hasQuote && quote.font ? quote.font : ''}`}>
                {hasQuote ? quote.content : <span className="opacity-70">{placeholder}</span>}
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
