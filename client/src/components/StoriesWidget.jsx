import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import axios from 'axios';
import { Plus } from 'lucide-react';
import Avatar from './Avatar';
import Modal from './Modal';
import CreateQuoteModal from './CreateQuoteModal';
import CreateClipModal from './Clips/CreateClipModal';
import QuoteViewerModal from './Quotes/QuoteViewerModal';
import ClipViewerModal from './Clips/ClipViewerModal';
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

const StoriesWidget = () => {
  const { data: quotes, isLoading: qLoading } = useSWR('/quotes/feed', fetcher, { refreshInterval: 30000 });
  const { data: clips, isLoading: cLoading } = useSWR('/clips/feed', fetcher, { refreshInterval: 30000 });
  const { currentIdentity } = useIdentity();

  const [showCreateModal, setShowCreateModal] = useState(false); // For Quotes
  const [showClipCreate, setShowClipCreate] = useState(false); // For Clips (placeholder for now)

  const [quoteViewerOpen, setQuoteViewerOpen] = useState(false);
  const [activeQuotes, setActiveQuotes] = useState([]);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const [clipViewerOpen, setClipViewerOpen] = useState(false);
  const [activeClips, setActiveClips] = useState([]);
  const [clipIndex, setClipIndex] = useState(0);

  // Merge Data Logic
  // We need a list of "Slots" (Identities) that have either a Quote, a Clip, or both.
  // Prioritize "My" slot.

  const myIdentityId = currentIdentity?._id;

  const myQuote = quotes?.find(q => q.identity?._id === myIdentityId);
  const myClips = clips?.filter(c => c.identity?._id === myIdentityId) || [];

  // Group others by Identity
  const othersMap = new Map();

  // Process Quotes
  quotes?.forEach(q => {
      if (q.identity._id === myIdentityId) return;
      if (!othersMap.has(q.identity._id)) {
          othersMap.set(q.identity._id, { identity: q.identity, quote: null, clips: [] });
      }
      othersMap.get(q.identity._id).quote = q;
  });

  // Process Clips
  clips?.forEach(c => {
      if (c.identity._id === myIdentityId) return;
      if (!othersMap.has(c.identity._id)) {
          othersMap.set(c.identity._id, { identity: c.identity, quote: null, clips: [] });
      }
      othersMap.get(c.identity._id).clips.push(c);
  });

  const othersList = Array.from(othersMap.values());

  // Handlers
  const handleCardClick = (item) => {
      if (item.clips && item.clips.length > 0) {
          // Open Clip Viewer
          const allClipsFlat = [
              ...(myClips.length > 0 ? myClips : []),
              ...othersList.flatMap(i => i.clips)
          ];

          // Find start index for this user's first clip
          const startIdx = allClipsFlat.findIndex(c => c.identity._id === item.identity._id);

          setActiveClips(allClipsFlat);
          setClipIndex(startIdx >= 0 ? startIdx : 0);
          setClipViewerOpen(true);
      } else {
          // If no clips, maybe open profile or do nothing?
          // If it's "My" card and no clips, maybe Create Clip?
          if (item.identity._id === myIdentityId) {
             if (item.quote) handleBubbleClick(item.quote);
             else setShowClipCreate(true);
          }
      }
  };

  const handleBubbleClick = (quote) => {
      if (!quote) return;
      // Open Quote Viewer
      const allQuotes = [
          ...(myQuote ? [myQuote] : []),
          ...othersList.filter(i => i.quote).map(i => i.quote)
      ];
      const idx = allQuotes.findIndex(q => q._id === quote._id);
      setActiveQuotes(allQuotes);
      setQuoteIndex(idx >= 0 ? idx : 0);
      setQuoteViewerOpen(true);
  };

  const handleMyCreate = () => {
     // Ask user if they want to create Quote or Clip?
     // For now, let's just open a combined menu or default to Clip since card click implies Clip?
     // Or separate buttons?
     // The "Plus" icon on the card usually implies "Add to Story" (Clip).
     // The Bubble "Plus" implies "Add Note".
     // Since this is the Card click handler:
     setShowClipCreate(true);
  };

  return (
    <div className="mb-6">
        <div className="flex space-x-3 overflow-x-auto pb-4 pt-4 px-6 custom-scrollbar">

            {/* My Slot */}
            <div className="flex-shrink-0 w-28 h-44 relative rounded-xl overflow-hidden cursor-pointer group shadow-sm transition-transform hover:scale-105 border border-soft-border bg-surface">
                 {/* Card Background (Clip or Default) */}
                 <div
                    className={`absolute inset-0 bg-slate-100 ${myClips.length > 0 ? '' : 'bg-gradient-to-br from-slate-100 to-slate-200'}`}
                    onClick={() => myClips.length > 0 ? handleCardClick({ identity: currentIdentity, clips: myClips }) : handleMyCreate()}
                 >
                     {myClips.length > 0 ? (
                         (myClips[0].mediaType === 'video' ? (
                             <video src={myClips[0].mediaUrl} className="w-full h-full object-cover" />
                         ) : (
                             <img src={myClips[0].mediaUrl} className="w-full h-full object-cover" />
                         ))
                     ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                             <Plus size={32} />
                             <span className="text-xs font-bold mt-2">Create</span>
                        </div>
                     )}
                 </div>

                 {/* Quote Bubble (Overlay) */}
                 {myQuote ? (
                     <div
                        className="absolute top-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-xl border border-slate-200 shadow-sm z-10 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); handleBubbleClick(myQuote); }}
                     >
                         <p className="text-[10px] text-center font-serif leading-tight line-clamp-2 text-slate-800">
                             "{myQuote.content}"
                         </p>
                     </div>
                 ) : (
                    // Explicit "Add Note" Button if no quote
                     <div
                        className="absolute top-2 left-2 p-1 bg-white/80 rounded-full shadow-sm cursor-pointer hover:bg-white z-20"
                        onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); }}
                        title="Add Note"
                     >
                         <Plus size={14} className="text-slate-700" />
                     </div>
                 )}

                 {/* Avatar (Bottom Left) with Ring */}
                 <div className="absolute bottom-3 left-3 z-10">
                     <div className={`p-[2px] rounded-full bg-surface ${myClips.some(c => !c.viewed) ? 'border-2 border-fuchsia-500' : 'border border-slate-200'}`}>
                         <Avatar identity={currentIdentity} size="sm" />
                     </div>
                 </div>

                 {/* Label */}
                 <div className="absolute bottom-3 left-12 right-2 z-10">
                     <p className="text-white text-xs font-bold truncate drop-shadow-md">You</p>
                 </div>
            </div>

            {/* Other Slots */}
            {othersList.map((item) => (
                <div
                    key={item.identity._id}
                    className="flex-shrink-0 w-28 h-44 relative rounded-xl overflow-hidden cursor-pointer group shadow-sm transition-transform hover:scale-105 border border-soft-border bg-surface"
                >
                     {/* Card Background */}
                     <div
                        className="absolute inset-0 bg-slate-100"
                        onClick={() => handleCardClick(item)}
                     >
                         {item.clips.length > 0 ? (
                             (item.clips[item.clips.length-1].mediaType === 'video' ? (
                                 <video src={item.clips[item.clips.length-1].mediaUrl} className="w-full h-full object-cover" />
                             ) : (
                                 <img src={item.clips[item.clips.length-1].mediaUrl} className="w-full h-full object-cover" />
                             ))
                         ) : (
                             <div className={`w-full h-full opacity-30 ${item.quote ? getMoodColor(item.quote.mood) : 'bg-slate-200'}`}></div>
                         )}
                     </div>

                     {/* Quote Bubble */}
                     {item.quote && (
                        <div
                            className="absolute top-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-xl border border-slate-200 shadow-sm z-10 hover:bg-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleBubbleClick(item.quote); }}
                        >
                            <p className="text-[10px] text-center font-serif leading-tight line-clamp-2 text-slate-800">
                                "{item.quote.content}"
                            </p>
                        </div>
                     )}

                     {/* Avatar with Ring */}
                     <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
                         <div className={`p-[2px] rounded-full bg-surface ${item.clips.some(c => !c.viewed) ? 'border-2 border-fuchsia-500' : 'border border-slate-200'}`}>
                             <Avatar identity={item.identity} size="sm" />
                         </div>
                     </div>

                     <div className="absolute bottom-3 left-12 right-2 z-10 pointer-events-none">
                         <p className="text-white text-xs font-bold truncate drop-shadow-md">{item.identity.name}</p>
                     </div>
                </div>
            ))}

        </div>

        <CreateQuoteModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            identityId={currentIdentity?._id}
            onCreated={() => { mutate('/quotes/feed'); }}
        />

        <CreateClipModal
            isOpen={showClipCreate}
            onClose={() => setShowClipCreate(false)}
            onCreated={() => mutate('/clips/feed')}
        />

        <QuoteViewerModal
            isOpen={quoteViewerOpen}
            onClose={() => setQuoteViewerOpen(false)}
            quotes={activeQuotes}
            initialIndex={quoteIndex}
        />

        <ClipViewerModal
            isOpen={clipViewerOpen}
            onClose={() => setClipViewerOpen(false)}
            clips={activeClips}
            initialIndex={clipIndex}
        />
    </div>
  );
};

export default StoriesWidget;
