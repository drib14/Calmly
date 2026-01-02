import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import axios from 'axios';
import { Plus, Eye, User, Film, X } from 'lucide-react';
import Avatar from './Avatar';
import CreateQuoteModal from './CreateQuoteModal';
import CreateClipModal from './Clips/CreateClipModal';
import UnifiedViewerModal from './Unified/UnifiedViewerModal';
import { useIdentity } from '../context/IdentityContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

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

const AnalyticsDrawer = ({ isOpen, onClose, item }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && item) {
            setLoading(true);
            const endpoint = item.type === 'quote'
                ? `/quotes/${item._id}/details`
                : `/clips/${item._id}/details`;

            axios.get(endpoint)
                .then(res => setDetails(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        } else {
            setDetails(null);
        }
    }, [isOpen, item]);

    // Calculate total views from the item passed (real-time count) + details if available
    const totalViews = details ? details.views.length : (item?.views?.length || 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-[70] max-h-[60vh] overflow-hidden flex flex-col shadow-2xl border-t border-soft-border md:max-w-md md:mx-auto"
                    >
                        {/* Handle Bar */}
                        <div className="flex justify-center pt-3 pb-1" onClick={onClose}>
                            <div className="w-12 h-1.5 bg-slate-300 rounded-full cursor-pointer"></div>
                        </div>

                        {/* Header */}
                        <div className="px-6 py-4 flex justify-between items-center border-b border-soft-border">
                            <div>
                                <h3 className="text-lg font-serif font-bold text-text">Audience</h3>
                                <div className="flex items-center space-x-2 text-secondary text-sm">
                                    <Eye size={14} />
                                    <span>{totalViews} Total Views</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-background rounded-full transition">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {loading ? (
                                <div className="text-center py-8 text-secondary">Loading insights...</div>
                            ) : details && details.views && details.views.length > 0 ? (
                                <div className="space-y-3">
                                    {details.views.map((view, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 hover:bg-background rounded-xl transition">
                                            <div className="flex items-center space-x-3">
                                                {/* Use placeholder avatar logic since View usually only has User ID unless populated deeply */}
                                                {/* Backend populates 'views.user' with username. Profile image might be missing if not populated. */}
                                                {/* We'll use a generic avatar or initials if avatar missing */}
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                                    {view.user?.username ? view.user.username[0].toUpperCase() : <User size={16}/>}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-text">{view.user?.username || 'Unknown User'}</p>
                                                    <p className="text-xs text-secondary">{view.viewedAt ? formatDistanceToNow(new Date(view.viewedAt), { addSuffix: true }) : 'Recently'}</p>
                                                </div>
                                            </div>
                                            {/* Blue Badge for New Viewer logic would go here if we tracked 'new' specifically per session */}
                                            {/* For now, we assume all in this list are viewers */}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                        <Eye size={32} />
                                    </div>
                                    <p className="text-secondary font-medium">No views yet.</p>
                                    <p className="text-xs text-slate-400">Share your story to reach more people.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const StoriesWidget = () => {
  const { data: quotes, isLoading: qLoading } = useSWR('/quotes/feed', fetcher, { refreshInterval: 30000 });
  const { data: clips, isLoading: cLoading } = useSWR('/clips/feed', fetcher, { refreshInterval: 30000 });
  const { currentIdentity } = useIdentity();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showClipCreate, setShowClipCreate] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [unifiedStories, setUnifiedStories] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [analyticsItem, setAnalyticsItem] = useState(null);

  // Profile Click Dropdown State
  const [dropdownOpen, setDropdownOpen] = useState(null);

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
      setDrawerOpen(true);
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
      if (!story) return null;

      const hasContent = story.items && story.items.length > 0;
      const lastItem = hasContent ? story.items[story.items.length - 1] : null;
      const isQuote = lastItem?.type === 'quote';
      const isClip = lastItem?.type === 'clip';

      const borderClass = hasContent
        ? (!story.items.every(i => i.viewed) ? 'border-[3px] border-fuchsia-500' : 'border border-slate-300')
        : 'border border-soft-border';

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
                           {/* Avatar + Quote Bubble Overlay Logic */}
                            <div className={`absolute inset-0 opacity-10 ${getMoodColor(lastItem.mood)}`}></div>

                            {/* Avatar Centered */}
                            <div className="mb-2">
                                <Avatar identity={story.identity} size="md" />
                            </div>

                            {/* Mini Quote Bubble */}
                           <div className={`relative p-2 rounded-xl text-[9px] text-center font-serif leading-tight text-white shadow-sm w-full ${getMoodColor(lastItem.mood)} border border-white/20`}>
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

               {/* Eye Icon + Count for Analytics (My Story Only) */}
               {isMe && hasContent && (
                   <div className="absolute bottom-11 left-2 z-30" onClick={(e) => handleAnalyticsClick(e, lastItem)}>
                       <div className="flex items-center space-x-1 bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm hover:bg-black/80 transition cursor-pointer border border-white/10">
                           <Eye size={10} className="text-white" />
                           <span className="text-[10px] font-bold text-white">{lastItem.views?.length || 0}</span>
                       </div>
                   </div>
               )}

               <div className="absolute bottom-3 left-3 z-20" onClick={(e) => toggleDropdown(e, story.identity._id)}>
                   <div className={`p-[2px] rounded-full bg-surface shadow-sm ${hasContent && !story.items.every(i => i.viewed) ? 'border-2 border-fuchsia-500' : 'border border-soft-border'}`}>
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
                   <p className="text-white text-xs font-bold truncate drop-shadow-md filter shadow-black">
                       {isMe ? 'You' : story.identity.name}
                   </p>
               </div>
          </div>
      );
  };

  return (
    <div className="mb-8 relative z-10">
        <div className="flex space-x-3 overflow-x-auto pb-4 pt-4 px-1 custom-scrollbar" onClick={() => setDropdownOpen(null)}>
            {/* Guard against null myStory explicitly */}
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

        <AnalyticsDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            item={analyticsItem}
        />
    </div>
  );
};

export default StoriesWidget;
