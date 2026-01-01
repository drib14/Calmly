import React, { useEffect, useState } from 'react';
import Avatar from './Avatar';
import { Plus, Eye } from 'lucide-react';
import axios from 'axios';
import QuoteAnalyticsModal from './QuoteAnalyticsModal';

const moodColors = {
    'Neutral': 'bg-slate-900 text-white border-slate-900',
    'Happy': 'bg-yellow-400 text-yellow-900 border-yellow-400',
    'Sad': 'bg-blue-500 text-white border-blue-500',
    'Angry': 'bg-red-500 text-white border-red-500',
    'Hopeful': 'bg-green-500 text-white border-green-500',
    'Anxious': 'bg-purple-500 text-white border-purple-500',
};

const QuoteBubble = ({ identity, quote, isMe, onQuoteClick, onAvatarClick, size = "lg" }) => {
  const hasQuote = !!quote;
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Check for new views (blue badge)
  // Logic: If there are views, and (no last check time OR last check time < latest view time)
  const hasNewViews = isMe && quote?.views?.length > 0 && (
      !quote.lastCheckedViews ||
      (quote.views[quote.views.length - 1].timestamp && new Date(quote.lastCheckedViews) < new Date(quote.views[quote.views.length - 1].timestamp))
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
      {/* The Quote Bubble */}
      {(hasQuote || isMe) && (
        <div
            className={`absolute ${bubblePosition} z-20 transition-transform duration-200 hover:-translate-y-1 origin-bottom cursor-pointer min-w-[max-content] flex justify-center max-w-[200px]`}
            onClick={handleQuoteClick}
        >
            {hasQuote ? (
                <div className={`relative ${bubbleClasses} rounded-3xl shadow-lg border px-4 py-3 animate-in fade-in zoom-in duration-300 w-full`}>
                    <div className={`text-sm font-medium leading-tight text-center ${quote.font || ''} break-words`}>
                        {quote.content}
                    </div>

                    {/* View Count */}
                    {hasQuote && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isMe) setShowAnalytics(true);
                            }}
                            className="flex justify-center mt-1 items-center space-x-1 opacity-70 hover:opacity-100 transition-opacity relative"
                        >
                            <div className="relative">
                                <Eye size={10} />
                                {hasNewViews && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></span>
                                )}
                            </div>
                            <span className="text-[10px]">{quote.views?.length || 0}</span>
                        </div>
                    )}

                    {/* Tail: Two dots style (Thought bubble-ish) or Simple Point */}
                     <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 ${bgClass} rotate-45 transform rounded-sm`}></div>
                </div>
            ) : (
                /* Empty State (Add Quote) */
                <div className={`relative ${bubbleClasses} rounded-full shadow-sm border px-3 py-1.5 whitespace-nowrap`}>
                    <div className="text-[10px] font-bold opacity-80">
                        + Quote
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

      {showAnalytics && (
          <QuoteAnalyticsModal quote={quote} onClose={() => setShowAnalytics(false)} />
      )}
    </div>
  );
};

export default QuoteBubble;
