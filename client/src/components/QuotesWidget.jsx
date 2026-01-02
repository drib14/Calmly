import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import axios from 'axios';
import { Plus } from 'lucide-react';
import Avatar from './Avatar';
import Modal from './Modal';
import CreateQuoteModal from './CreateQuoteModal';
import QuoteViewerModal from './Quotes/QuoteViewerModal';
import { useIdentity } from '../context/IdentityContext';
import { useNavigate } from 'react-router-dom';

const fetcher = url => axios.get(url).then(res => res.data);

const getMoodColor = (mood) => {
    switch(mood) {
        case 'Happy': return 'bg-yellow-400';
        case 'Sad': return 'bg-blue-500';
        case 'Angry': return 'bg-red-500';
        case 'Hopeful': return 'bg-green-500';
        case 'Anxious': return 'bg-purple-500';
        default: return 'bg-slate-900';
    }
};

const QuotesWidget = () => {
  const { data: quotes, isLoading } = useSWR('/quotes/feed', fetcher, { refreshInterval: 30000 });
  const { currentIdentity } = useIdentity();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerQuotes, setViewerQuotes] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const myQuote = quotes?.find(q => q.identity?._id === currentIdentity?._id);
  const otherQuotes = quotes?.filter(q => q.identity?._id !== currentIdentity?._id) || [];

  // Combine for viewer navigation (My Quote first if exists)
  const allViewerQuotes = myQuote ? [myQuote, ...otherQuotes] : otherQuotes;

  const handleAvatarClick = (quote, clickedIndex) => {
      if (quote.identity?._id === currentIdentity?._id && !quote.content) {
          setShowCreateModal(true);
      } else {
          // Find index in the combined list
          const realIndex = allViewerQuotes.findIndex(q => q._id === quote._id);
          setViewerQuotes(allViewerQuotes);
          setViewerIndex(realIndex >= 0 ? realIndex : 0);
          setViewerOpen(true);
      }
  };

  return (
    <div className="mb-6">
        <div className="flex space-x-3 overflow-x-auto pb-4 pt-4 px-6 custom-scrollbar">

            {/* My Slot (Card Style) */}
            <div
                className="flex-shrink-0 w-24 h-36 relative rounded-xl overflow-hidden cursor-pointer group shadow-sm transition-transform hover:scale-105 border border-soft-border bg-surface"
                onClick={() => handleAvatarClick({ identity: currentIdentity, ...myQuote })}
            >
                {/* Background / Gradient */}
                <div className={`absolute inset-0 ${myQuote ? 'bg-gradient-to-br from-slate-100 to-slate-200' : 'bg-gray-50'}`}>
                    {myQuote?.music && <div className="absolute top-2 right-2 text-slate-400"><Plus size={10}/></div>} {/* Just a placeholder icon */}
                </div>

                {/* Avatar */}
                <div className="absolute top-3 left-3 p-[2px] rounded-full bg-surface border border-soft-border">
                     <Avatar identity={currentIdentity} size="sm" />
                </div>

                {/* Content/Add Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent pt-6">
                    <p className="text-white text-xs font-bold truncate">Your Note</p>
                    {!myQuote && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="text-slate-800" />
                        </div>
                    )}
                </div>

                {!myQuote && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white rounded-full p-1 shadow-sm border border-gray-200">
                            <Plus size={20} className="text-slate-700" />
                        </div>
                    </div>
                )}
            </div>

            {/* Other Quotes (Card Style) */}
            {otherQuotes.map((quote) => (
                <div
                    key={quote._id}
                    className={`flex-shrink-0 w-24 h-36 relative rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-105 shadow-sm border ${quote.viewed ? 'border-gray-200 opacity-90' : 'border-fuchsia-500 ring-1 ring-fuchsia-500'}`}
                    onClick={() => handleAvatarClick(quote)}
                >
                    <div className="absolute inset-0 bg-slate-100">
                        {/* Maybe show quote preview? or just mood color */}
                        <div className={`w-full h-full opacity-30 ${getMoodColor(quote.mood)}`}></div>
                    </div>

                    <div className="absolute top-3 left-3">
                        <div className={`p-[2px] rounded-full bg-surface ${quote.viewed ? '' : 'border-2 border-fuchsia-500'}`}>
                            <Avatar identity={quote.identity} size="sm" />
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent pt-6">
                        <p className="text-white text-xs font-bold truncate">{quote.identity.name}</p>
                    </div>
                </div>
            ))}
        </div>

        <CreateQuoteModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            identityId={currentIdentity?._id}
            onCreated={() => mutate('/quotes/feed')}
        />

        <QuoteViewerModal
            isOpen={viewerOpen}
            onClose={() => setViewerOpen(false)}
            quotes={viewerQuotes}
            initialIndex={viewerIndex}
        />
    </div>
  );
};

export default QuotesWidget;
