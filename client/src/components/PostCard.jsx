import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { formatShortTime } from '../utils/dateUtils';
import { MessageCircle, Heart, Repeat, MoreHorizontal, Send, Trash2, Flag, User, X, Globe, Lock, EyeOff, Eye, Image as ImageIcon, Reply, ChevronLeft, ChevronRight, Edit3, ShieldAlert, BellOff, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import useSWR from 'swr';
import { useIdentity } from '../context/IdentityContext';
import { useSettings } from '../hooks/useSettings';
import { useClickOutside } from '../hooks/useClickOutside';
import Avatar from './Avatar';
import MediaPlayer from './MediaPlayer';
import MediaViewer from './MediaViewer';
import CommentItem from './CommentItem';
import CommentsSection from './CommentsSection';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import ShareModal from './ShareModal';
import ReactorsModal from './ReactorsModal';
import EditPostModal from './EditPostModal';
import { Share2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import ReactDOM from 'react-dom';

const PostCard = ({ post, mutate }) => {
  const { currentIdentity, identities } = useIdentity();
  const { settings } = useSettings();
  const [expanded, setExpanded] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReactorsModal, setShowReactorsModal] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  // Image Viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const [showAnonError, setShowAnonError] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [reporting, setReporting] = useState(false);

  // Touch State
  const touchStartRef = useRef(null);
  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);

  const optionsRef = useRef(null);
  const shareRef = useRef(null);
  const navigate = useNavigate();

  // SWR for Comments (Real-time polling when expanded)
  const { data: comments, mutate: mutateComments } = useSWR(
      expanded ? `/comments/${post._id}` : null,
      async (url) => {
          const res = await axios.get(url);
          return res.data;
      },
      { refreshInterval: 3000 }
  );

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (post.likes) {
        setIsLiked(post.likes.some(l => l.identity === currentIdentity?._id || l.identity?._id === currentIdentity?._id));
        setLikeCount(post.likes.length);
    }
  }, [post.likes, currentIdentity]);

  const isReposted = post.reposts?.some(r => r.identity === currentIdentity?._id || r.identity?._id === currentIdentity?._id);
  const isOwner = post.identity?._id === currentIdentity?._id;

  // Safe Mode Logic
  const triggeringMoods = ['Melancholy', 'Angry', 'Anxious', 'Numb'];
  const isTriggering = triggeringMoods.includes(post.mood);
  const shouldBlur = settings?.enableSafeMode && isTriggering && !isRevealed && !isOwner;

  // Close options/share on outside click
  useClickOutside(optionsRef, () => setShowOptions(false));
  useClickOutside(shareRef, () => setShowShareMenu(false));

  const handleLike = async () => {
      if (!currentIdentity) return toast.error("Select an identity first");

      // Optimistic Update
      const previousLiked = isLiked;
      const previousCount = likeCount;

      setIsLiked(!previousLiked);
      setLikeCount(previousLiked ? previousCount - 1 : previousCount + 1);

      if (!previousLiked) {
          setShowHeartAnimation(true);
          setTimeout(() => setShowHeartAnimation(false), 1000);
      }

      try {
          await axios.put(`/posts/${post._id}/like`, { identityId: currentIdentity._id });
          mutate(); // Sync with server
      } catch (err) {
          // Revert on error
          console.error(err);
          setIsLiked(previousLiked);
          setLikeCount(previousCount);
          toast.error("Failed to update like");
      }
  };

  const interactionsEnabled = post.identity?.user?.settings?.enableReactions !== false;
  const commentsEnabled = post.identity?.user?.settings?.enableComments !== false;

  const handleRepost = async () => {
      if (!currentIdentity) return toast.error("Select an identity first");
      setIsReposting(true);
      try {
          await axios.put(`/posts/${post._id}/repost`, { identityId: currentIdentity._id });
          mutate();
          toast.success("Reposted!");
      } catch (err) { console.error(err); }
      finally { setIsReposting(false); }
  };


  const handleDelete = async () => {
      setDeleting(true);
      try {
          await axios.delete(`/posts/${post._id}`);
          toast.success("Post deleted");
          mutate();
      } catch (err) {
          console.error(err);
          toast.error("Failed to delete post");
      }
      setDeleting(false);
      setShowDeleteModal(false);
  };

  const handleReport = async () => {
      setReporting(true);
      try {
          await axios.post(`/posts/${post._id}/report`, { reason: reportReason });
          toast.success("Report submitted");
          setShowReportModal(false);
          setReportReason('');
      } catch (err) {
          console.error(err);
          toast.error("Failed to submit report");
      }
      setReporting(false);
  };

  const handleHide = async () => {
      try {
          await axios.put(`/posts/${post._id}/hide`);
          mutate();
          toast.success(post.hidden ? "Post visible on profile" : "Post hidden from feed");
      } catch (err) {
          toast.error("Failed to update visibility");
      }
      setShowOptions(false);
  };

  const handleUserHide = async () => {
      try {
          await axios.post('/settings/hide-post', { postId: post._id });
          mutate();
          toast.success("Post hidden from your feed");
      } catch (err) {
          toast.error("Failed to hide post");
      }
      setShowOptions(false);
  };

  const handleBlockUser = async () => {
      try {
          await axios.post('/settings/block-user', { identityId: post.identity._id });
          mutate();
          toast.success(`Blocked ${post.identity.name}`);
      } catch (err) {
          toast.error("Failed to block user");
      }
      setShowOptions(false);
  };

  const handleProfileClick = (e) => {
      e.stopPropagation();
      const myRealIdentity = identities?.find(i => i.type === 'real');
      const isMyPost = identities?.some(i => i._id === post.identity?._id);

      if (post.identity?.type === 'anonymous') {
          if (isMyPost && myRealIdentity) {
              navigate(`/profile/${myRealIdentity.handle.replace('@', '')}`);
              return;
          } else {
            setShowAnonError(true);
            return;
          }
      }

      if (post.identity?.handle) {
          navigate(`/profile/${post.identity.handle.replace('@', '')}`);
      }
  };

  const handleCopyLink = () => {
      const link = `${window.location.origin}/profile/${post.identity?.handle?.replace('@', '') || 'anon'}`;
      navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard");
      setShowShareMenu(false);
  };

  const openViewer = (src) => {
      setViewerImage(src);
      setViewerOpen(true);
  };

  const getTypeStyles = () => {
      switch (post.type) {
          case 'poetry': return 'border-l-4 border-l-purple-400';
          case 'letter': return 'border-l-4 border-l-amber-400';
          case 'confession': return 'border-l-4 border-l-slate-800';
          case 'mood': return 'border-l-4 border-l-blue-400';
          default: return '';
      }
  };

  // Touch Handlers
  const handleTouchStart = (e) => {
      touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
      if (!touchStartRef.current) return;

      const touchEnd = e.changedTouches[0].clientX;
      const diff = touchStartRef.current - touchEnd;

      if (Math.abs(diff) > 50) {
          if (diff > 0) {
              setCurrentMediaIndex((prev) => (prev === post.media.length - 1 ? 0 : prev + 1));
          } else {
              setCurrentMediaIndex((prev) => (prev === 0 ? post.media.length - 1 : prev - 1));
          }
      }

      touchStartRef.current = null;
  };

  const handleTap = (urlToView = null) => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;

      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
          if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
          handleLike();
          lastTapRef.current = 0;
      } else {
          lastTapRef.current = now;
          if (urlToView) {
              tapTimeoutRef.current = setTimeout(() => {
                  openViewer(urlToView);
              }, DOUBLE_TAP_DELAY);
          }
      }
  };

  // Get reactor avatars
  const reactorAvatars = post.likes
      ?.map(l => l.identity)
      .filter((id, index, self) => id && self.findIndex(i => i?._id === id._id) === index) || [];

  const displayReactors = reactorAvatars.length > 3 ? reactorAvatars.slice(0, 3) : reactorAvatars;
  const extraCount = reactorAvatars.length > 3 ? reactorAvatars.length - 3 : 0;

  return (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx(
            "bg-surface/30 backdrop-blur-md text-text p-5 md:p-6 rounded-3xl shadow-sm border border-white/20 dark:border-white/10 mb-6 relative transition-all hover:shadow-md",
            getTypeStyles(),
            (showOptions || showShareMenu) ? "z-30" : "z-0"
        )}
    >
      {/* ... (Existing Header, Content, Action Bar code remains unchanged) ... */}

      {/* Repost Indicator */}
      {post.reposts && post.reposts.length > 0 && post.reposts[0].identity && (
          <div className="flex items-center space-x-2 mb-3 text-xs text-secondary font-medium">
              <Repeat size={12} />
              <span>Reposted by</span>
              <div className="flex items-center space-x-1">
                  <Avatar identity={post.reposts[0].identity} size="sm" />
                  <span>{post.reposts[0].identity.name}</span>
              </div>
              {post.reposts.length > 1 && <span>and {post.reposts.length - 1} others</span>}
          </div>
      )}

      {/* Header - Z-Index 30 to stay above Safe Mode Overlay */}
      <div className="flex justify-between items-start mb-4 relative z-30">
        <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
           <div onClick={handleProfileClick} className="cursor-pointer flex-shrink-0 active:scale-95 transition-transform">
               <Avatar identity={post.identity} />
           </div>
           <div className="min-w-0 flex-1">
               <p onClick={handleProfileClick} className="text-sm font-bold text-text cursor-pointer hover:underline decoration-slate-400 underline-offset-2 truncate">
                   {post.identity?.name || 'Unknown'}
               </p>
               <div className="text-[11px] text-secondary font-medium uppercase tracking-wide flex items-center flex-wrap gap-x-2 gap-y-1">
                   <span>{post.identity?.type || 'Guest'}</span>
                   <span>•</span>
                   <span className="whitespace-nowrap">{formatShortTime(post.createdAt)}</span>

                   {/* Visibility Icon */}
                   {post.visibility === 'public' && <Globe size={12} className="text-secondary flex-shrink-0" />}
                   {post.visibility === 'unlisted' && <EyeOff size={12} className="text-secondary flex-shrink-0" />}
                   {post.visibility === 'private' && <Lock size={12} className="text-secondary flex-shrink-0" />}

                   {post.type !== 'mood' && (
                       <>
                        <span>•</span>
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap">{post.type === 'confession' ? 'Post' : post.type}</span>
                       </>
                   )}
               </div>
           </div>
        </div>

        <div className="relative" ref={optionsRef}>
            <button onClick={() => setShowOptions(!showOptions)} className="text-secondary hover:text-text transition p-2 active:scale-95">
                <MoreHorizontal size={20} />
            </button>

            <AnimatePresence>
                {showOptions && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-8 bg-surface border border-soft-border shadow-lg rounded-xl p-1 z-10 min-w-[160px]"
                    >
                        {isOwner ? (
                            <>
                                <button onClick={() => { setShowEditModal(true); setShowOptions(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg active:bg-surface">
                                    <Edit3 size={14} /> <span>Edit Post</span>
                                </button>
                                <button onClick={handleHide} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg active:bg-surface">
                                    {post.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                                    <span>{post.hidden ? 'Unhide Post' : 'Archive Post'}</span>
                                </button>
                                <div className="h-px bg-soft-border my-1" />
                                <button onClick={() => { setShowDeleteModal(true); setShowOptions(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-red-500 hover:bg-background rounded-lg active:bg-red-50">
                                    <Trash2 size={14} /> <span>Delete Post</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={handleUserHide} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg active:bg-surface">
                                    <EyeOff size={14} /> <span>Hide this post</span>
                                </button>
                                <button onClick={handleBlockUser} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg active:bg-surface">
                                    <ShieldAlert size={14} /> <span>Block User</span>
                                </button>
                                <div className="h-px bg-soft-border my-1" />
                                <button onClick={() => { setShowReportModal(true); setShowOptions(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-red-500 hover:bg-background rounded-lg active:bg-red-50">
                                    <Flag size={14} /> <span>Report Content</span>
                                </button>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="md:pl-13 relative">
          {shouldBlur && (
              <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/60 dark:bg-black/60 flex flex-col items-center justify-center rounded-xl p-4 text-center">
                  <EyeOff className="text-secondary mb-2" size={32} />
                  <p className="text-sm font-bold text-text mb-1">Content Hidden (Safe Mode)</p>
                  <p className="text-xs text-secondary mb-4">This post contains a mood that might be triggering.</p>
                  <button
                      onClick={() => setIsRevealed(true)}
                      className="px-4 py-2 bg-surface border border-soft-border rounded-full text-xs font-bold text-text hover:bg-background transition active:scale-95"
                  >
                      Reveal Content
                  </button>
              </div>
          )}

          {post.type === 'letter' ? (
              <div
                  onClick={() => handleTap()}
                  className={clsx(
                  "p-6 md:p-8 rounded-lg mb-4 shadow-sm relative overflow-hidden cursor-pointer",
                  // Apply dynamic styles based on paper type
                  post.letterFields?.paperType === 'parchment' ? 'bg-[#f0e6d2] text-[#5c4b35] border-[#e6dcc0]' :
                  post.letterFields?.paperType === 'classic' ? 'bg-amber-50 text-amber-900 border-amber-100' :
                  post.letterFields?.paperType === 'lined' ? 'bg-white text-slate-800 border-blue-100' :
                  post.letterFields?.paperType === 'dark' ? 'bg-slate-900 text-slate-200 border-slate-800' :
                  post.letterFields?.paperType === 'flower' ? 'bg-rose-50 text-rose-900 border-rose-100' :
                  'bg-white border-slate-200'
              )}>
                  {/* Texture Overlays */}
                  {post.letterFields?.paperType === 'parchment' && <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>}
                  {post.letterFields?.paperType === 'lined' && <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]"></div>}
                  {post.letterFields?.paperType === 'dark' && <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>}
                  {post.letterFields?.paperType === 'flower' && <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/flowers.png')]"></div>}

                  <div className="relative z-10">
                    <div className="font-serif text-lg font-bold mb-6 border-b border-current/20 pb-2">{post.letterFields?.header}</div>
                    <div className="font-serif text-base leading-loose whitespace-pre-wrap mb-8">{post.content}</div>
                    <div className="font-serif text-lg font-bold text-right italic">{post.letterFields?.footer}</div>
                  </div>
              </div>
          ) : post.type === 'poetry' ? (
              <div
                onClick={() => handleTap()}
                className={clsx(
                    "p-6 md:p-10 rounded-2xl mb-4 shadow-inner min-h-[200px] flex flex-col justify-center overflow-hidden cursor-pointer",
                    post.style?.backgroundColor,
                    post.style?.align,
                    post.style?.font
                )}
              >
                  {post.title && <h3 className="text-2xl font-bold mb-6 opacity-80">{post.title}</h3>}
                  <div className="whitespace-pre-wrap leading-loose text-lg opacity-90">{post.content}</div>
              </div>
          ) : (
              <>
                  {post.title && <h3 className="text-lg font-serif font-bold mb-2 text-text">{post.title}</h3>}
                  <div
                      onClick={() => handleTap()}
                      className="text-text leading-relaxed whitespace-pre-wrap font-serif text-[15px] mb-4 cursor-pointer"
                  >
                      {post.content}
                  </div>

                  {/* Media Display */}
                  {post.media && post.media.length > 0 && (
                      <div
                          className="relative mb-4 group -mx-5 md:-mx-6"
                          onTouchStart={handleTouchStart}
                          onTouchEnd={handleTouchEnd}
                      >
                          {/* Heart Animation Overlay */}
                          <AnimatePresence>
                              {showHeartAnimation && (
                                  <motion.div
                                      initial={{ opacity: 0, scale: 0 }}
                                      animate={{ opacity: 1, scale: 1.5 }}
                                      exit={{ opacity: 0, scale: 0 }}
                                      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                                  >
                                      <Heart className="w-24 h-24 text-white fill-white drop-shadow-lg" />
                                  </motion.div>
                              )}
                          </AnimatePresence>

                          {/* Single Media: Dynamic Height (No Background Spacing) */}
                          {post.media.length === 1 ? (
                              <div className="w-full flex justify-center">
                                   {post.media[0].type === 'video' ? (
                                        <div className="w-full max-h-[70vh]">
                                            <MediaPlayer src={post.media[0].url} />
                                        </div>
                                   ) : (
                                       <img
                                           src={post.media[0].url}
                                           className="max-w-full max-h-[70vh] w-auto h-auto object-contain cursor-pointer rounded-lg"
                                           onClick={(e) => { handleTap(post.media[0].url); }}
                                       />
                                   )}
                              </div>
                          ) : (
                              /* Multi-Media Carousel: Fixed Max Width */
                              <div className="overflow-hidden relative bg-black aspect-[4/5] flex items-center justify-center w-full">
                                  {/* Main Content */}
                                  <div className="w-full h-full flex items-center justify-center">
                                      <AnimatePresence mode="wait">
                                          <motion.div
                                              key={currentMediaIndex}
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              exit={{ opacity: 0 }}
                                              transition={{ duration: 0.2 }}
                                              className="w-full h-full flex items-center justify-center"
                                          >
                                              {post.media[currentMediaIndex].type === 'video' ? (
                                                  <div className="w-full h-full">
                                                      <MediaPlayer src={post.media[currentMediaIndex].url} />
                                                  </div>
                                              ) : (
                                                  <img
                                                      src={post.media[currentMediaIndex].url}
                                                      className="w-full h-full object-contain cursor-pointer"
                                                      onClick={(e) => { handleTap(post.media[currentMediaIndex].url); }}
                                                  />
                                              )}
                                          </motion.div>
                                      </AnimatePresence>
                                  </div>

                                  {/* Navigation Chevrons */}
                                  <>
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              setCurrentMediaIndex((prev) => (prev === 0 ? post.media.length - 1 : prev - 1));
                                          }}
                                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/40 transition shadow-sm z-10 active:scale-90"
                                      >
                                          <ChevronLeft size={24} />
                                      </button>
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              setCurrentMediaIndex((prev) => (prev === post.media.length - 1 ? 0 : prev + 1));
                                          }}
                                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/40 transition shadow-sm z-10 active:scale-90"
                                      >
                                          <ChevronRight size={24} />
                                      </button>

                                      {/* Multi-media Indicator */}
                                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white z-10 pointer-events-none">
                                          {currentMediaIndex + 1}/{post.media.length}
                                      </div>

                                      {/* Pagination Dots */}
                                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
                                          {post.media.map((_, idx) => (
                                              <div
                                                  key={idx}
                                                  className={clsx(
                                                      "w-1.5 h-1.5 rounded-full transition-all shadow-sm",
                                                      idx === currentMediaIndex ? "bg-white scale-125" : "bg-white/50"
                                                  )}
                                              />
                                          ))}
                                      </div>
                                  </>
                              </div>
                          )}
                      </div>
                  )}
              </>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-background text-secondary rounded-full text-xs font-medium border border-soft-border">
                  {post.mood}
              </span>
              {post.tags?.map(tag => (
                   <span key={tag} className="px-3 py-1 bg-background text-secondary rounded-full text-xs font-medium border border-soft-border">
                   #{tag}
               </span>
              ))}
          </div>
      </div>

      {/* Action Bar */}
      <div className="pt-4 border-t border-soft-border">
          {/* Reactor Avatars & Text - Clickable */}
          {reactorAvatars.length > 0 && interactionsEnabled && (
              <button
                  onClick={() => setShowReactorsModal(true)}
                  className="flex items-center mb-3 text-xs text-secondary hover:text-text transition-colors text-left group"
              >
                  <div className="flex -space-x-1.5 mr-2">
                    {displayReactors.map((identity) => (
                        <div key={identity._id} className="w-5 h-5 rounded-full ring-2 ring-surface z-0 relative">
                            <Avatar identity={identity} size="xs" />
                        </div>
                    ))}
                    {extraCount > 0 && (
                        <div className="w-5 h-5 rounded-full bg-surface border border-soft-border flex items-center justify-center text-[9px] font-bold text-secondary z-0 relative ring-2 ring-surface">
                            +{extraCount}
                        </div>
                    )}
                  </div>
                  <span className="group-hover:underline decoration-slate-400 underline-offset-2">
                      <span className="font-bold text-text">{reactorAvatars[0].name}</span>
                      {reactorAvatars.length > 1 ? (
                          <> and <span className="font-bold text-text">{reactorAvatars.length - 1} others</span> like this moment</>
                      ) : (
                          <> likes this moment</>
                      )}
                  </span>
              </button>
          )}

          <div className="flex items-center justify-between">
            <div className="flex space-x-6 relative">
                {interactionsEnabled && (
                    <button
                      onClick={handleLike}
                      className={clsx(
                          "flex items-center space-x-2 transition group active:scale-95",
                          isLiked ? "text-red-500" : "text-secondary hover:text-red-500"
                      )}
                    >
                        <Heart size={20} className={clsx("transition-transform group-active:scale-90", isLiked && "fill-current")} />
                        <span className="text-xs font-bold">{likeCount}</span>
                    </button>
                )}

                {commentsEnabled && (
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="flex items-center space-x-2 text-secondary hover:text-blue-500 transition group active:scale-95"
                    >
                        <MessageCircle size={20} />
                        <span className="text-xs font-bold">{comments ? comments.length : (post.commentCount || 0)}</span>
                    </button>
                )}

                <button
                  onClick={handleRepost}
                  className={clsx("flex items-center space-x-2 transition group active:scale-95", isReposted ? "text-green-500" : "text-secondary hover:text-green-500")}
                >
                    <Repeat size={20} className={clsx("transition-transform", isReposting && "animate-spin")} />
                    <span className="text-xs font-bold">{post.reposts?.length || 0}</span>
                </button>

                <div className="relative" ref={shareRef}>
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center space-x-2 text-secondary hover:text-text transition group active:scale-95"
                    >
                        <Share2 size={20} />
                    </button>

                    <AnimatePresence>
                        {showShareMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute left-0 top-8 bg-surface border border-soft-border shadow-lg rounded-xl p-1 z-10 min-w-[160px]"
                            >
                                <button onClick={handleCopyLink} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg transition active:bg-surface">
                                    <LinkIcon size={14} /> <span>Copy Link</span>
                                </button>
                                <button
                                  onClick={() => { setShowShareModal(true); setShowShareMenu(false); }}
                                  className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg transition active:bg-surface"
                                >
                                    <Send size={14} /> <span>Share as Message</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
          </div>
      </div>

      {/* Comments Area - Desktop Inline */}
      <div className="hidden md:block">
          <AnimatePresence>
              {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                      <div className="mt-4 pt-4 border-t border-soft-border bg-background/50 -mx-6 px-6 pb-6">
                           <CommentsSection
                                comments={comments}
                                postId={post._id}
                                mutateComments={mutateComments}
                                isOwner={isOwner}
                                identities={identities}
                                currentIdentity={currentIdentity}
                                openViewer={openViewer}
                           />
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>
      </div>

      {/* Comments Area - Mobile Drawer */}
      <div className="md:hidden">
            {ReactDOM.createPortal(
                <AnimatePresence>
                    {expanded && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setExpanded(false)}
                                className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm md:hidden"
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed bottom-0 left-0 right-0 top-0 bg-surface z-[70] border-t border-soft-border shadow-2xl flex flex-col md:hidden"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b border-soft-border">
                                    <h3 className="font-bold text-lg text-text">Comments</h3>
                                    <button onClick={() => setExpanded(false)} className="p-2 bg-background rounded-full hover:bg-soft-border transition">
                                        <X size={20} className="text-text" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-hidden p-4 pt-0 flex flex-col mt-4">
                                    <div className="flex-1 overflow-hidden">
                                        <CommentsSection
                                            comments={comments}
                                            postId={post._id}
                                            mutateComments={mutateComments}
                                            isOwner={isOwner}
                                            identities={identities}
                                            currentIdentity={currentIdentity}
                                            openViewer={openViewer}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
      </div>

      {/* Anon Error Modal */}
      <Modal isOpen={showAnonError} onClose={() => setShowAnonError(false)}>
          <div className="text-center">
              <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-3">
                  <User size={24} className="text-secondary" />
              </div>
              <h3 className="text-lg font-serif font-bold text-text">Identity Protected</h3>
              <p className="text-sm text-secondary mt-2">This user has chosen to remain anonymous. Their profile is hidden to respect their privacy.</p>
              <button onClick={() => setShowAnonError(false)} className="mt-4 text-xs font-bold text-text hover:underline">Close</button>
          </div>
      </Modal>

      {/* Delete Modal */}
      <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete this moment?"
          message="This action cannot be undone. Are you sure you want to let this go?"
          confirmText={deleting ? 'Deleting...' : 'Delete'}
          isDanger={true}
      />

      {/* Edit Modal */}
      {isOwner && (
          <EditPostModal
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
              post={post}
              mutate={mutate}
          />
      )}

      {/* Report Modal */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)}>
          <div className="text-center">
              <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-4 text-secondary">
                  <Flag size={24} />
              </div>
              <h3 className="text-xl font-serif font-bold text-text mb-2">Report Content</h3>
              <p className="text-secondary text-sm mb-4">Why are you reporting this post?</p>

              <textarea
                  className="w-full bg-background border border-soft-border rounded-xl p-3 text-sm focus:ring-2 ring-slate-900 outline-none resize-none mb-6 text-text"
                  rows="3"
                  placeholder="Please describe the issue..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
              />

              <div className="flex space-x-3">
                  <button onClick={() => setShowReportModal(false)} disabled={reporting} className="flex-1 py-3 bg-background text-text font-medium rounded-xl hover:bg-surface transition disabled:opacity-50 border border-soft-border active:scale-95">Cancel</button>
                  <button onClick={handleReport} disabled={reporting} className="flex-1 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition disabled:opacity-50 active:scale-95">
                    {reporting ? 'Reporting...' : 'Submit Report'}
                  </button>
              </div>
          </div>
      </Modal>

      {/* Share Modal */}
      <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          post={post}
      />

      {/* Reactors Modal */}
      <ReactorsModal
          isOpen={showReactorsModal}
          onClose={() => setShowReactorsModal(false)}
          reactors={reactorAvatars}
      />

      <MediaViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        imageSrc={viewerImage}
      />

    </motion.div>
  );
};

export default PostCard;
