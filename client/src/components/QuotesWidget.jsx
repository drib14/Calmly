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

  const handleAvatarClick = (quote, index, quotesList) => {
      if (quote.isMe && !quote.content) {
          setShowCreateModal(true);
      } else {
          setViewerQuotes(quotesList);
          setViewerIndex(index);
          setViewerOpen(true);
      }
  };

  return (
    <div className="mb-6">
        <div className="flex space-x-4 overflow-x-auto pb-4 pt-4 px-6 custom-scrollbar">

            {/* My Slot */}
            <div className="flex flex-col items-center space-y-1 min-w-[70px] cursor-pointer group" onClick={() => handleAvatarClick({ isMe: true, ...myQuote }, 0, [myQuote].filter(Boolean))}>
                <div className={`relative p-[3px] rounded-full ${myQuote ? 'bg-gradient-to-tr from-yellow-400 to-fuchsia-600' : 'bg-transparent border border-dashed border-gray-300'}`}>
                    <div className="bg-surface rounded-full p-0.5">
                        <Avatar identity={currentIdentity} size="md" />
                    </div>
                    {!myQuote && (
                        <div className="absolute bottom-0 right-0 bg-slate-900 text-white rounded-full p-0.5 border-2 border-surface">
                            <Plus size={12} />
                        </div>
                    )}
                </div>
                <span className="text-xs font-medium text-secondary truncate w-16 text-center">Your Note</span>
            </div>

            {/* Other Quotes */}
            {otherQuotes.map((quote, idx) => (
                <div
                    key={quote._id}
                    className="flex flex-col items-center space-y-1 min-w-[70px] cursor-pointer"
                    onClick={() => handleAvatarClick(quote, idx, otherQuotes)}
                >
                    <div className={`relative p-[3px] rounded-full ${quote.viewed ? 'bg-gray-200' : 'bg-gradient-to-tr from-yellow-400 to-fuchsia-600'}`}>
                        <div className="bg-surface rounded-full p-0.5">
                            <Avatar identity={quote.identity} size="md" />
                        </div>
                    </div>
                    <span className="text-xs font-medium text-secondary truncate w-16 text-center">{quote.identity.name}</span>
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
