import React, { useEffect, useState, useRef } from 'react';
import Avatar from './Avatar';
import { Eye, Music, Play, Pause, Plus } from 'lucide-react';
import axios from 'axios';
import QuoteAnalyticsModal from './QuoteAnalyticsModal';

// Mood effects (subtle borders/glows for white bubble)
const moodStyles = {
    'Neutral': 'border-gray-200 shadow-sm',
    'Happy': 'border-yellow-300 shadow-yellow-100 ring-1 ring-yellow-200',
    'Sad': 'border-blue-200 shadow-blue-50 ring-1 ring-blue-100',
    'Angry': 'border-red-200 shadow-red-50 ring-1 ring-red-100',
    'Hopeful': 'border-green-200 shadow-green-50 ring-1 ring-green-100',
    'Anxious': 'border-purple-200 shadow-purple-50 ring-1 ring-purple-100',
};

const QuoteBubble = ({ identity, quote, isMe, onQuoteClick, onAvatarClick, size = "lg", align = "center" }) => {
  const hasQuote = !!quote;
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Check for new views (blue badge)
  const hasNewViews = isMe && quote && quote.views && quote.views.length > 0 && (
      !quote.lastCheckedViews ||
      (quote.views[quote.views.length - 1]?.timestamp && new Date(quote.lastCheckedViews) < new Date(quote.views[quote.views.length - 1].timestamp))
  );

  useEffect(() => {
    if (hasQuote && !isMe) {
        // Track View
        const trackView = async () => {
            try {
                await axios.post(`/quotes/${quote._id}/view`);
            } catch (err) {
                // Ignore errors
            }
        };
        trackView();
    }
  }, [hasQuote, isMe, quote?._id]);

  useEffect(() => {
      // Pause audio if quote changes or component unmounts
      return () => {
          if (audioRef.current) {
              audioRef.current.pause();
          }
      };
  }, [quote?._id]);

  const toggleAudio = (e) => {
      e.stopPropagation();
      if (!audioRef.current) return;

      if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
      } else {
          // Pause other audios if any (global event or simple assumption)
          document.querySelectorAll('audio').forEach(el => el !== audioRef.current && el.pause());

          audioRef.current.play();
          setIsPlaying(true);
      }
  };

  const handleAudioEnded = () => {
      setIsPlaying(false);
  };

  // Position: Centered above the avatar, offset adjusted for new design
  const bubblePosition = {
      md: "-top-14",
      lg: "-top-16",
      xl: "-top-20",
  }[size] || "-top-16";

  // Alignment classes
  const alignmentClass = align === "left"
      ? "left-0"
      : "left-1/2 -translate-x-1/2";

  const handleQuoteClick = (e) => {
      e.stopPropagation();
      if (onQuoteClick) onQuoteClick();
  };

  const handleAvatarClick = (e) => {
      e.stopPropagation();
      if (onAvatarClick) onAvatarClick();
  };

  // Base classes for the "Quote" style: White bubble, rounded-2xl, border
  const baseClasses = "bg-white text-slate-800 rounded-2xl px-3 py-2 border";
  const moodStyle = hasQuote ? (moodStyles[quote.mood] || moodStyles['Neutral']) : 'border-gray-200';

  return (
    <div className="relative inline-block group z-10">
      {/* The Quote Bubble */}
      {(hasQuote || isMe) && (
        <div
            className={`absolute ${bubblePosition} ${alignmentClass} z-20 transition-all duration-300 hover:-translate-y-1 origin-bottom cursor-pointer flex flex-col items-center`}
            style={{ width: 'max-content', maxWidth: '160px' }}
            onClick={handleQuoteClick}
        >
            {hasQuote ? (
                <div className={`relative ${baseClasses} ${moodStyle} shadow-sm animate-in fade-in zoom-in duration-300 w-full`}>

                    {/* Content */}
                    <div className="flex flex-col space-y-1">
                         {/* Music Player if present */}
                         {quote.music && (
                             <div className="flex items-center space-x-2 bg-gray-50 rounded-full px-2 py-1 mb-1 border border-gray-100 max-w-full overflow-hidden">
                                 <button
                                    onClick={toggleAudio}
                                    className="flex-shrink-0 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center hover:scale-105 transition"
                                 >
                                     {isPlaying ? <Pause size={8} fill="white" /> : <Play size={8} fill="white" ml={1}/>}
                                 </button>
                                 <div className="flex flex-col overflow-hidden w-full">
                                     <span className="text-[9px] font-bold truncate leading-tight">{quote.music.trackName}</span>
                                     <span className="text-[8px] text-gray-500 truncate leading-tight">{quote.music.artistName}</span>
                                 </div>
                                 <audio ref={audioRef} src={quote.music.previewUrl} onEnded={handleAudioEnded} />
                             </div>
                         )}

                        <div className={`text-xs font-medium leading-snug text-center ${quote.font || ''} break-words whitespace-normal text-slate-700`}>
                            {quote.content}
                        </div>
                    </div>

                    {/* View Count (Owner Only) - Floating outside or tiny inside */}
                    {hasQuote && isMe && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowAnalytics(true);
                            }}
                            className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 border border-gray-100 shadow-sm flex items-center justify-center w-5 h-5 hover:scale-110 transition"
                        >
                             <Eye size={10} className="text-gray-400" />
                             {hasNewViews && (
                                <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-blue-500 rounded-full border border-white"></span>
                             )}
                        </div>
                    )}

                    {/* Tail: Rounded Thought Bubble Style with circles */}
                     <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-[-2px]">
                        <div className={`w-2 h-2 rounded-full bg-white border border-gray-200 ${moodStyle.split(' ')[0]}`}></div>
                        <div className={`w-1 h-1 rounded-full bg-white border border-gray-200 ${moodStyle.split(' ')[0]}`}></div>
                     </div>
                </div>
            ) : (
                /* Empty State (Add Quote) */
                <div className="relative bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-200 px-3 py-1.5 whitespace-nowrap hover:bg-white transition-colors">
                    <div className="text-[10px] font-bold text-gray-500 flex items-center space-x-1">
                        <Plus size={10} />
                        <span>Add Quote</span>
                    </div>
                     <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rotate-45 border-b border-r border-gray-200"></div>
                </div>
            )}
        </div>
      )}

      {/* Avatar */}
      <div onClick={handleAvatarClick} className="cursor-pointer">
          <Avatar identity={identity} size={size} />
      </div>

      {showAnalytics && (
          <QuoteAnalyticsModal quote={quote} onClose={() => setShowAnalytics(false)} />
      )}
    </div>
  );
};

export default QuoteBubble;
