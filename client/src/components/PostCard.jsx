import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Heart, Repeat, MoreHorizontal, Send, Trash2, Flag, User, X, Globe, Lock, EyeOff, Image as ImageIcon, Reply, Edit3, Ban, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import useSWR from 'swr';
import { useIdentity } from '../context/IdentityContext';
import { useSettings } from '../hooks/useSettings';
import Avatar from './Avatar';
import MediaPlayer from './MediaPlayer';
import ImageViewer from './ImageViewer';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import ShareModal from './ShareModal';
import { Share2, Link as LinkIcon, ExternalLink } from 'lucide-react';

const PostCard = ({ post, mutate }) => {
  const { currentIdentity, identities } = useIdentity();
  const { settings } = useSettings();
  const [expanded, setExpanded] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // Image Viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState(null);

  // Comment Input State
  const [newComment, setNewComment] = useState('');
  const [commentMedia, setCommentMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Modals
  const [showAnonError, setShowAnonError] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [reporting, setReporting] = useState(false);

  // Comment Actions State
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [commentToReport, setCommentToReport] = useState(null);

  const optionsRef = useRef(null);
  const shareRef = useRef(null);
  const commentOptionsRef = useRef(null);
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

  const isLiked = post.likes?.some(l => l.identity === currentIdentity?._id || l.identity?._id === currentIdentity?._id);
  const isReposted = post.reposts?.some(r => r.identity === currentIdentity?._id || r.identity?._id === currentIdentity?._id);
  const isOwner = post.identity._id === currentIdentity?._id;

  // Safe Mode Logic
  const triggeringMoods = ['Melancholy', 'Angry', 'Anxious', 'Numb'];
  const isTriggering = triggeringMoods.includes(post.mood);
  const shouldBlur = settings?.enableSafeMode && isTriggering && !isRevealed && !isOwner;

  // Close options/share on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
      if (shareRef.current && !shareRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
      if (commentOptionsRef.current && !commentOptionsRef.current.contains(event.target)) {
        setActiveCommentId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLike = async () => {
      if (!currentIdentity) return toast.error("Select an identity first");
      try {
          await axios.put(`/posts/${post._id}/like`, { identityId: currentIdentity._id });
          mutate(); // Update post data
      } catch (err) { console.error(err); }
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

  const handleCommentLike = async (commentId) => {
      if (!currentIdentity) return toast.error("Select an identity first");
      try {
          await axios.put(`/comments/${commentId}/like`, { identityId: currentIdentity._id });
          mutateComments();
      } catch (err) { console.error(err); }
  };

  const handleCommentFile = (e) => {
      const file = e.target.files[0];
      if (file) {
          setCommentMedia(file);
          setMediaPreview(URL.createObjectURL(file));
      }
  };

  const submitComment = async () => {
      if (!newComment.trim() && !commentMedia) return;
      if (!currentIdentity) return toast.error("Select an identity first");

      setSubmittingComment(true);
      try {
          const formData = new FormData();
          formData.append('content', newComment);
          formData.append('identityId', currentIdentity._id);
          if (commentMedia) formData.append('media', commentMedia);
          if (replyTo) formData.append('parentCommentId', replyTo.id);

          await axios.post(`/comments/${post._id}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });

          setNewComment('');
          setCommentMedia(null);
          setMediaPreview(null);
          setReplyTo(null);

          mutateComments();
          toast.success(replyTo ? "Reply sent" : "Comment added");
      } catch (err) {
          console.error(err);
          toast.error("Failed to post comment");
      } finally {
          setSubmittingComment(false);
      }
  };

  const handleHidePost = async () => {
      try {
          await axios.post('/settings/hide-post', { postId: post._id });
          toast.success("Post hidden");
          if (mutate) mutate(); // Refresh feed
      } catch (err) {
          toast.error("Failed to hide post");
      }
      setShowOptions(false);
  };

  const handleBlockUser = async () => {
      if (!currentIdentity) return toast.error("Login to block users");
      try {
          await axios.post('/settings/block-user', { userId: post.identity.user._id || post.identity.user });
          toast.success("User blocked");
          setShowOptions(false);
          if (mutate) mutate();
      } catch (err) {
          toast.error("Failed to block user");
      }
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
          if (commentToReport) {
              await axios.post(`/comments/${commentToReport}/report`, { reason: reportReason });
          } else {
              await axios.post(`/posts/${post._id}/report`, { reason: reportReason });
          }
          toast.success("Report submitted");
          setShowReportModal(false);
          setReportReason('');
          setCommentToReport(null);
      } catch (err) {
          console.error(err);
          toast.error("Failed to submit report");
      }
      setReporting(false);
  };

  const handleDeleteComment = async () => {
      if (!commentToDelete) return;
      setDeleting(true);
      try {
          await axios.delete(`/comments/${commentToDelete}`);
          toast.success("Comment deleted");
          mutateComments();
      } catch (err) {
          toast.error("Failed to delete comment");
      }
      setDeleting(false);
      setCommentToDelete(null);
      setShowDeleteModal(false); // Reuse modal logic or create new
  };

  const handleProfileClick = (e) => {
      e.stopPropagation();
      const myRealIdentity = identities?.find(i => i.type === 'real');
      const isMyPost = identities?.some(i => i._id === post.identity._id);

      if (post.identity.type === 'anonymous') {
          if (isMyPost && myRealIdentity) {
              navigate(`/profile/${myRealIdentity.handle.replace('@', '')}`);
              return;
          } else {
            setShowAnonError(true);
            return;
          }
      }

      if (post.identity.handle) {
          navigate(`/profile/${post.identity.handle.replace('@', '')}`);
      }
  };

  const handleCopyLink = () => {
      const link = `${window.location.origin}/profile/${post.identity.handle?.replace('@', '') || 'anon'}`;
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

  return (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx(
            "bg-surface text-text p-5 md:p-6 rounded-3xl shadow-sm border border-soft-border mb-6 relative transition-all hover:shadow-md",
            getTypeStyles()
        )}
    >
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

      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative">
        <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
           <div onClick={handleProfileClick} className="cursor-pointer flex-shrink-0">
               <Avatar identity={post.identity} />
           </div>
           <div className="min-w-0 flex-1">
               <p onClick={handleProfileClick} className="text-sm font-bold text-text cursor-pointer hover:underline decoration-slate-400 underline-offset-2 truncate">
                   {post.identity.name}
               </p>
               <div className="text-[11px] text-secondary font-medium uppercase tracking-wide flex items-center flex-wrap gap-x-2 gap-y-1">
                   <span>{post.identity.type}</span>
                   <span>•</span>
                   <span className="whitespace-nowrap">{formatDistanceToNow(new Date(post.createdAt))} ago</span>

                   {/* Visibility Icon */}
                   {post.visibility === 'public' && <Globe size={12} className="text-secondary flex-shrink-0" />}
                   {post.visibility === 'unlisted' && <EyeOff size={12} className="text-secondary flex-shrink-0" />}
                   {post.visibility === 'private' && <Lock size={12} className="text-secondary flex-shrink-0" />}

                   {post.type !== 'mood' && (
                       <>
                        <span>•</span>
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap">{post.type}</span>
                       </>
                   )}
               </div>
           </div>
        </div>

        <div className="relative" ref={optionsRef}>
            <button onClick={() => setShowOptions(!showOptions)} className="text-secondary hover:text-text transition p-2">
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
                                <button onClick={() => { toast('Edit feature coming soon!'); setShowOptions(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg">
                                    <Edit3 size={14} /> <span>Edit Post</span>
                                </button>
                                <button onClick={() => { setShowDeleteModal(true); setShowOptions(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-red-500 hover:bg-background rounded-lg">
                                    <Trash2 size={14} /> <span>Delete Post</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={handleHidePost} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg">
                                    <EyeOff size={14} /> <span>Hide Post</span>
                                </button>
                                <button onClick={handleBlockUser} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg">
                                    <Ban size={14} /> <span>Block User</span>
                                </button>
                                <button onClick={() => { setShowReportModal(true); setShowOptions(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-secondary hover:bg-background rounded-lg hover:text-text">
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
                      className="px-4 py-2 bg-surface border border-soft-border rounded-full text-xs font-bold text-text hover:bg-background transition"
                  >
                      Reveal Content
                  </button>
              </div>
          )}

          {post.type === 'letter' ? (
              <div className={clsx(
                  "p-6 md:p-8 rounded-lg mb-4 shadow-sm relative overflow-hidden",
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
                className={clsx(
                    "p-6 md:p-10 rounded-2xl mb-4 shadow-inner min-h-[200px] flex flex-col justify-center overflow-hidden",
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
                  <div className="text-text leading-relaxed whitespace-pre-wrap font-serif text-[15px] mb-4">
                      {post.content}
                  </div>

                  {/* Media Grid */}
                  {post.media && post.media.length > 0 && (
                      <div className={clsx("grid gap-2 mb-4 rounded-2xl overflow-hidden", post.media.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                          {post.media.map((file, idx) => (
                              file.type === 'video' ? (
                                  <MediaPlayer key={idx} src={file.url} />
                              ) : (
                                  <img
                                    key={idx}
                                    src={file.url}
                                    className="w-full h-full object-cover aspect-square cursor-pointer hover:opacity-90 transition"
                                    onClick={() => openViewer(file.url)}
                                  />
                              )
                          ))}
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

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-soft-border">
          <div className="flex space-x-6 relative">
              {interactionsEnabled && (
                  <button
                    onClick={handleLike}
                    className={clsx(
                        "flex items-center space-x-2 transition group",
                        isLiked ? "text-red-500" : "text-secondary hover:text-red-500"
                    )}
                  >
                      <Heart size={20} className={clsx("transition-transform group-active:scale-90", isLiked && "fill-current")} />
                      <span className="text-xs font-bold">{post.likes?.length || 0}</span>
                  </button>
              )}

              {commentsEnabled && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center space-x-2 text-secondary hover:text-blue-500 transition group"
                  >
                      <MessageCircle size={20} />
                      <span className="text-xs font-bold">{comments ? comments.length : (post.commentCount || 0)}</span>
                  </button>
              )}

              <button
                onClick={handleRepost}
                className={clsx("flex items-center space-x-2 transition group", isReposted ? "text-green-500" : "text-secondary hover:text-green-500")}
              >
                  <Repeat size={20} className={clsx("transition-transform", isReposting && "animate-spin")} />
                  <span className="text-xs font-bold">{post.reposts?.length || 0}</span>
              </button>

              <div className="relative" ref={shareRef}>
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center space-x-2 text-secondary hover:text-text transition group"
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
                              <button onClick={handleCopyLink} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg transition">
                                  <LinkIcon size={14} /> <span>Copy Link</span>
                              </button>
                              <button
                                onClick={() => { setShowShareModal(true); setShowShareMenu(false); }}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg transition"
                              >
                                  <Send size={14} /> <span>Share as Message</span>
                              </button>
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>
          </div>
      </div>

      {/* Comments Area */}
      <AnimatePresence>
          {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                  <div className="mt-4 pt-4 border-t border-soft-border bg-background/50 -mx-6 px-6 pb-6">
                      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                          {!comments ? (
                              <div className="text-center py-4 text-secondary text-xs">Loading comments...</div>
                          ) : comments.length === 0 ? (
                              <div className="text-center py-4 text-secondary text-xs">No comments yet. Be the first.</div>
                          ) : (
                              comments.map(c => {
                                  const isCommentLiked = c.likes?.some(id => id === currentIdentity?._id);
                                  return (
                                    <div key={c._id} className={clsx("flex space-x-3", c.parentComment && "ml-8")}>
                                        <Avatar identity={c.identity} size="sm" />
                                        <div className="flex-1">
                                            <div className="bg-surface p-3 rounded-2xl rounded-tl-none shadow-sm text-sm border border-soft-border inline-block max-w-full">
                                                <span className="font-bold text-text text-xs block mb-1">{c.identity.name}</span>
                                                {c.content && <span className="text-secondary block whitespace-pre-wrap">{c.content}</span>}
                                                {c.media && c.media.length > 0 && (
                                                    <div className="mt-2 rounded-lg overflow-hidden max-w-[200px]">
                                                        {c.media[0].type === 'video' ? (
                                                            <MediaPlayer src={c.media[0].url} />
                                                        ) : (
                                                            <img
                                                                src={c.media[0].url}
                                                                className="w-full h-full object-cover cursor-pointer"
                                                                onClick={() => openViewer(c.media[0].url)}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-4 mt-1 ml-2 text-[10px] text-secondary">
                                                <span>{formatDistanceToNow(new Date(c.createdAt))} ago</span>
                                                <button
                                                    onClick={() => handleCommentLike(c._id)}
                                                    className={clsx("font-bold hover:text-red-500 transition flex items-center space-x-1", isCommentLiked && "text-red-500")}
                                                >
                                                    <Heart size={10} className={clsx(isCommentLiked && "fill-current")} />
                                                    <span>{c.likes?.length || 0}</span>
                                                </button>
                                                <button
                                                    onClick={() => setReplyTo({ id: c._id, name: c.identity.name })}
                                                    className="font-bold hover:text-blue-500 transition"
                                                >
                                                    Reply
                                                </button>

                                                {/* Comment Options */}
                                                <div className="relative">
                                                    <button onClick={(e) => { e.stopPropagation(); setActiveCommentId(activeCommentId === c._id ? null : c._id); }} className="hover:text-text">
                                                        <MoreHorizontal size={12} />
                                                    </button>
                                                    <AnimatePresence>
                                                        {activeCommentId === c._id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.95 }}
                                                                className="absolute left-0 top-4 bg-surface border border-soft-border shadow-lg rounded-lg p-1 z-20 min-w-[100px]"
                                                                ref={commentOptionsRef}
                                                            >
                                                                {(c.identity._id === currentIdentity?._id || isOwner) && (
                                                                    <button
                                                                        onClick={() => { setCommentToDelete(c._id); setShowDeleteModal(true); setActiveCommentId(null); }}
                                                                        className="flex items-center space-x-2 w-full px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-background rounded"
                                                                    >
                                                                        <Trash2 size={10} /> <span>Delete</span>
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => { setCommentToReport(c._id); setShowReportModal(true); setActiveCommentId(null); }}
                                                                    className="flex items-center space-x-2 w-full px-2 py-1.5 text-xs font-medium text-secondary hover:bg-background rounded hover:text-text"
                                                                >
                                                                    <Flag size={10} /> <span>Report</span>
                                                                </button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                  );
                              })
                          )}
                      </div>

                      {/* Comment Media Preview */}
                      {mediaPreview && (
                          <div className="mb-2 relative inline-block">
                              <img src={mediaPreview} className="h-16 w-16 object-cover rounded-lg border border-soft-border" />
                              <button onClick={() => { setCommentMedia(null); setMediaPreview(null); }} className="absolute -top-1 -right-1 bg-black text-white rounded-full p-0.5">
                                  <X size={10} />
                              </button>
                          </div>
                      )}

                      {/* Reply Indicator */}
                      {replyTo && (
                          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 p-2 px-3 rounded-lg mb-2 text-xs text-blue-600 dark:text-blue-300">
                              <span>Replying to <b>{replyTo.name}</b></span>
                              <button onClick={() => setReplyTo(null)}><X size={12}/></button>
                          </div>
                      )}

                      <div className="flex items-center space-x-2 bg-surface p-1.5 pl-2 rounded-full border border-soft-border focus-within:ring-2 ring-slate-100 dark:ring-slate-700 transition-shadow">
                          <label className="p-2 cursor-pointer text-secondary hover:text-text transition rounded-full hover:bg-background">
                              <input type="file" className="hidden" accept="image/*,video/*" onChange={handleCommentFile} />
                              <ImageIcon size={18} />
                          </label>
                          <input
                            className="flex-1 text-sm bg-transparent outline-none placeholder:text-secondary text-text"
                            placeholder={replyTo ? "Write a reply..." : "Send a supportive message..."}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                          />
                          <button
                            onClick={submitComment}
                            disabled={submittingComment}
                            className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-full flex items-center justify-center text-white dark:text-slate-900 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                          >
                              <Send size={14} className="-ml-0.5 mt-0.5 text-white dark:text-slate-900" />
                          </button>
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

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
          onClose={() => { setShowDeleteModal(false); setCommentToDelete(null); }}
          onConfirm={commentToDelete ? handleDeleteComment : handleDelete}
          title={commentToDelete ? "Delete Comment?" : "Delete this moment?"}
          message="This action cannot be undone. Are you sure you want to let this go?"
          confirmText={deleting ? 'Deleting...' : 'Delete'}
          isDanger={true}
      />

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
                  <button onClick={() => setShowReportModal(false)} disabled={reporting} className="flex-1 py-3 bg-background text-text font-medium rounded-xl hover:bg-surface transition disabled:opacity-50 border border-soft-border">Cancel</button>
                  <button onClick={handleReport} disabled={reporting} className="flex-1 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition disabled:opacity-50">
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

      <ImageViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        imageSrc={viewerImage}
      />

    </motion.div>
  );
};

export default PostCard;
