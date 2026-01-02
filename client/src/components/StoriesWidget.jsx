import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import axios from 'axios';
import { Plus, Eye, MoreHorizontal, User, Film, FileText, Image as ImageIcon } from 'lucide-react';
import Avatar from './Avatar';
import Modal from './Modal';
import CreateQuoteModal from './CreateQuoteModal';
import CreateClipModal from './Clips/CreateClipModal';
import UnifiedViewerModal from './Unified/UnifiedViewerModal';
import QuoteAnalyticsModal from './QuoteAnalyticsModal';
import { useIdentity } from '../context/IdentityContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false); // For Quotes
  const [showClipCreate, setShowClipCreate] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [unifiedStories, setUnifiedStories] = useState([]);

  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsItem, setAnalyticsItem] = useState(null);

  // Profile Click Dropdown State
  const [dropdownOpen, setDropdownOpen] = useState(null); // Identity ID

  // Merge Data Logic
  const myIdentityId = currentIdentity?._id;

  const processStories = () => {
      const map = new Map();

      const getEntry = (identity) => {
          if (!map.has(identity._id)) {
              map.set(identity._id, { identity, items: [], lastUpdated: 0 });
          }
          return map.get(identity._id);
      };

      quotes?.forEach(q => {
          const entry = getEntry(q.identity);
          entry.items.push({ ...q, type: 'quote' });
          if (new Date(q.createdAt).getTime() > entry.lastUpdated) entry.lastUpdated = new Date(q.createdAt).getTime();
      });

      clips?.forEach(c => {
          const entry = getEntry(c.identity);
          entry.items.push({ ...c, type: 'clip' });
          if (new Date(c.createdAt).getTime() > entry.lastUpdated) entry.lastUpdated = new Date(c.createdAt).getTime();
      });

      map.forEach(entry => {
          entry.items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });

      let stories = Array.from(map.values());
      stories.sort((a, b) => b.lastUpdated - a.lastUpdated);

      const myStoryIndex = stories.findIndex(s => s.identity._id === myIdentityId);
      let myStory = null;
      if (myStoryIndex !== -1) {
          myStory = stories.splice(myStoryIndex, 1)[0];
      }

      // If no story for me, create placeholder. Ensure currentIdentity exists.
      if (!myStory && currentIdentity) {
          myStory = { identity: currentIdentity, items: [], lastUpdated: 0 };
      }

      return { myStory, others: stories };
  };

  const { myStory, others } = processStories();

  const handleStoryClick = (story, isMe = false) => {
      if (story.items.length === 0) {
          if (isMe) setShowClipCreate(true);
          return;
      }

      const fullList = [myStory, ...others].filter(s => s && s.items.length > 0);
      const idx = fullList.findIndex(s => s.identity._id === story.identity._id);

      setUnifiedStories(fullList);
      setActiveStoryIndex(idx >= 0 ? idx : 0);
      setViewerOpen(true);
  };

  const handleAnalyticsClick = (e, item) => {
      e.stopPropagation();
      setAnalyticsItem(item);
      setAnalyticsOpen(true);
  };

  const toggleDropdown = (e, id) => {
      e.stopPropagation();
      setDropdownOpen(dropdownOpen === id ? null : id);
  };

  const handleViewProfile = (handle) => {
      navigate(`/profile/${handle}`);
      setDropdownOpen(null);
  };

  const renderCard = (story, isMe = false) => {
      // Fix: Guard against null story to prevent crash
      if (!story) return null;

      const hasContent = story.items && story.items.length > 0;
      const lastItem = hasContent ? story.items[story.items.length - 1] : null;
      const isQuote = lastItem?.type === 'quote';
      const isClip = lastItem?.type === 'clip';

      const borderClass = isClip ? 'border-[3px] border-fuchsia-500' : 'border border-soft-border';

      return (
          <div
              key={story.identity._id}
              className={`flex-shrink-0 w-28 h-44 relative rounded-xl overflow-hidden cursor-pointer group shadow-sm transition-transform hover:scale-105 bg-surface ${borderClass}`}
              onClick={() => handleStoryClick(story, isMe)}
          >
               <div className="absolute inset-0 bg-surface flex items-center justify-center">
                   {isClip ? (
                       lastItem.mediaType === 'video' ? (
                           <video src={lastItem.mediaUrl} className="w-full h-full object-cover" muted />
                       ) : (
                           <img src={lastItem.mediaUrl} className="w-full h-full object-cover" />
                       )
                   ) : isQuote ? (
                       <div className="w-full h-full flex flex-col items-center justify-center p-2 relative bg-surface">
                           {/* Blurred Mood Background */}
                           <div className={`absolute inset-0 opacity-20 ${getMoodColor(lastItem.mood)}`}></div>
                           <Avatar identity={story.identity} size="md" />
                           <div className={`relative mt-2 p-1.5 rounded-xl text-[8px] text-center font-serif leading-tight text-white shadow-sm max-w-full ${getMoodColor(lastItem.mood)}`}>
                               <span className="line-clamp-2">"{lastItem.content}"</span>
                               <div className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 ${getMoodColor(lastItem.mood)}`}></div>
                           </div>
                       </div>
                   ) : (
                       // Empty State (For "Me") - Create
                       <div className="w-full h-full flex flex-col items-center justify-center text-secondary bg-surface">
                           <Plus size={32} />
                           <span className="text-xs font-bold mt-2 text-text">Create</span>
                       </div>
                   )}
               </div>

               {/* Eye Icon for Analytics (My Story Only) - Bottom Left - No Count Text */}
               {isMe && hasContent && (
                   <div className="absolute bottom-10 left-2 z-30" onClick={(e) => handleAnalyticsClick(e, lastItem)}>
                       <div className="flex items-center justify-center bg-black/50 p-1.5 rounded-full backdrop-blur-sm hover:bg-black/70 transition">
                           <Eye size={12} className="text-white" />
                       </div>
                   </div>
               )}

               <div className="absolute bottom-3 left-3 z-20" onClick={(e) => toggleDropdown(e, story.identity._id)}>
                   <div className={`p-[2px] rounded-full bg-surface ${hasContent && !story.items.every(i => i.viewed) ? 'border-2 border-fuchsia-500' : 'border border-soft-border'}`}>
                       <Avatar identity={story.identity} size="sm" />
                   </div>
                   <AnimatePresence>
                       {dropdownOpen === story.identity._id && (
                           <motion.div
                               initial={{ opacity: 0, scale: 0.9, y: 10 }}
                               animate={{ opacity: 1, scale: 1, y: 0 }}
                               exit={{ opacity: 0, scale: 0.9, y: 10 }}
                               className="absolute bottom-10 left-0 w-32 bg-surface border border-soft-border shadow-xl rounded-xl overflow-hidden flex flex-col z-50"
                               onClick={(e) => e.stopPropagation()}
                           >
                               <button
                                   onClick={() => handleViewProfile(story.identity.handle)}
                                   className="flex items-center space-x-2 px-3 py-2 text-xs font-bold text-text hover:bg-background text-left transition-colors"
                               >
                                   <User size={12} /> <span>View Profile</span>
                               </button>
                               {hasContent && (
                                   <button
                                       onClick={() => { setDropdownOpen(null); handleStoryClick(story, isMe); }}
                                       className="flex items-center space-x-2 px-3 py-2 text-xs font-bold text-text hover:bg-background text-left transition-colors"
                                   >
                                       <Film size={12} /> <span>View Story</span>
                                   </button>
                               )}
                           </motion.div>
                       )}
                   </AnimatePresence>
               </div>

               <div className="absolute bottom-3 left-12 right-2 z-10 pointer-events-none">
                   <p className="text-white text-xs font-bold truncate drop-shadow-md">
                       {isMe ? 'You' : story.identity.name}
                   </p>
               </div>
          </div>
      );
  };

  return (
    <div className="mb-6 relative z-10">
        <div className="flex space-x-3 overflow-x-auto pb-4 pt-4 px-6 custom-scrollbar" onClick={() => setDropdownOpen(null)}>
            {/* Guard against null myStory explicitly, although renderCard handles it */}
            {myStory && renderCard(myStory, true)}

            {others.map(story => renderCard(story))}
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

        <UnifiedViewerModal
            isOpen={viewerOpen}
            onClose={() => setViewerOpen(false)}
            stories={unifiedStories}
            initialStoryIndex={activeStoryIndex}
        />

        <QuoteAnalyticsModal
            isOpen={analyticsOpen}
            onClose={() => setAnalyticsOpen(false)}
            item={analyticsItem}
        />
    </div>
  );
};

export default StoriesWidget;
