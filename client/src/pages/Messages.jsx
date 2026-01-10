import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { useIdentity } from '../context/IdentityContext';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Send, Image, Mic, User, Plus, X, Search, FileText, Download, ChevronLeft, Shield, Lock, Reply, CornerUpLeft, Layers, MoreVertical, Trash2, ShieldAlert, BellOff, Copy, Unlock } from 'lucide-react';
import { formatShortTime } from '../utils/dateUtils';
import clsx from 'clsx';
import Avatar from '../components/Avatar';
import MediaPlayer from '../components/MediaPlayer';
import QuotesWidget from '../components/QuotesWidget';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../components/ConfirmationModal';

// Utility to format bytes
const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const Messages = () => {
  const { currentIdentity, identities } = useIdentity();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeConversation, setActiveConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [sending, setSending] = useState(false);
  const [showDeleteConvModal, setShowDeleteConvModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null); // For context menus (bubble or list)
  const [showConversationMenu, setShowConversationMenu] = useState(false); // Header menu
  const scrollRef = useRef();

  // Mobile View State ('list' or 'chat')
  const [view, setView] = useState('list');

  useEffect(() => {
    if (location.state?.startConversationWith) {
      setActiveConversation(location.state.startConversationWith);
      setView('chat');
    }
  }, [location.state]);

  // Suggested Users Logic
  const { data: suggestedUsersRaw } = useSWR('/search?q=&type=identities', async (url) => {
      try {
          const res = await axios.get(url);
          return res.data.identities || [];
      } catch (err) { return []; }
  });
  const suggestedUsers = suggestedUsersRaw || [];

  // Fetch Inbox (Polling)
  const { data: inbox, mutate: mutateInbox } = useSWR('/messages/inbox', async (url) => {
      try {
          const res = await axios.get(url);
          return res.data;
      } catch (err) {
          return [];
      }
  }, { refreshInterval: 5000 });

  // Fetch Conversation (Polling)
  const { data: messages, mutate: mutateMessages } = useSWR(
      activeConversation && currentIdentity ? `/messages/conversation?identity1=${currentIdentity._id}&identity2=${activeConversation._id}` : null,
      async (url) => {
          try {
              const res = await axios.get(url);
              return res.data;
          } catch (err) {
              return [];
          }
      },
      { refreshInterval: 3000 }
  );

  // Mark as Read Effect
  useEffect(() => {
      if (activeConversation && messages?.length > 0) {
          const markRead = async () => {
              try {
                  await axios.put('/messages/read', { otherIdentityId: activeConversation._id });
                  mutateInbox(); // Refresh badge counts
              } catch (err) { console.error(err); }
          };
          markRead();
      }
  }, [activeConversation, messages?.length]);

  useEffect(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleConversationClick = (identity) => {
      setActiveConversation(identity);
      setView('chat');
      setShowConversationMenu(false);
  };

  const handleDeleteConversation = async () => {
      if (!activeConversation) return;
      try {
          await axios.delete(`/messages/conversation/${activeConversation._id}`);
          mutateInbox();
          setActiveConversation(null);
          setView('list');
          toast.success("Conversation deleted");
      } catch (err) {
          toast.error("Failed to delete conversation");
      }
      setShowDeleteConvModal(false);
  };

  const handleBlockUser = async (id) => {
      try {
          await axios.post('/settings/block-user', { identityId: id });
          toast.success("User blocked");
          mutateInbox();
          // Force refresh of current active conversation's settings if needed
          // Actually we rely on `activeConversation.user.settings` which might be stale in state.
          // Better to reload window or refetch identity.
          // For now, simple logic.
      } catch (err) { toast.error("Failed to block"); }
  };

  const handleMuteUser = async (id) => {
      try {
          await axios.post('/settings/mute-user', { identityId: id });
          toast.success("Conversation muted");
          mutateInbox();
      } catch (err) { toast.error("Failed to mute"); }
  };

  const handleDeleteMessage = async (msgId) => {
      try {
          await axios.delete(`/messages/${msgId}`);
          mutateMessages();
          toast.success("Message deleted");
      } catch (err) { toast.error("Failed to delete message"); }
      setActiveMenuId(null);
  };

  const handleCopy = (text) => {
      navigator.clipboard.writeText(text);
      toast.success("Copied");
      setActiveMenuId(null);
  };

  const handleSend = async () => {
      if ((!messageText.trim() && mediaFiles.length === 0) || !activeConversation || !currentIdentity) return;

      setSending(true);
      const formData = new FormData();
      formData.append('senderIdentityId', currentIdentity._id);
      formData.append('recipientIdentityId', activeConversation._id);
      formData.append('content', messageText);
      mediaFiles.forEach(file => formData.append('media', file));

      try {
          await axios.post('/messages', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          setMessageText('');
          setMediaFiles([]);
          setPreviews([]);
          mutateMessages();
          mutateInbox();
      } catch (err) {
          console.error(err);
          toast.error("Failed to send message");
      } finally {
          setSending(false);
      }
  };

  const handleFileSelect = (e) => {
      const files = Array.from(e.target.files);
      setMediaFiles([...mediaFiles, ...files]);
      const newPreviews = files.map(f => f.type.startsWith('image') ? URL.createObjectURL(f) : null); // Only preview images
      setPreviews([...previews, ...newPreviews]);
  };

  const removeFile = (index) => {
      const newFiles = [...mediaFiles];
      newFiles.splice(index, 1);
      setMediaFiles(newFiles);

      const newPreviews = [...previews];
      if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index]);
      newPreviews.splice(index, 1);
      setPreviews(newPreviews);
  };

  // Mock Identity Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (e) => {
      setSearchQuery(e.target.value);
      if (e.target.value.length > 2) {
          try {
              const res = await axios.get(`/search?q=${e.target.value}&type=identities`);
              setSearchResults(res.data.identities || []);
          } catch (err) {
              console.error(err);
          }
      } else {
          setSearchResults([]);
      }
  };

  // Check Block Status (Checking if I blocked them, or if they blocked me)
  // `activeConversation` object comes from search or inbox.
  // If from Inbox, it has `user.settings`.
  // We need to check My Settings to see if I blocked them.
  // And check Their Settings (from `activeConversation.user.settings`) to see if they blocked me?
  // Actually, blocked users list is in MY user object.
  // The backend should ideally tell us "isBlocked" or "hasBlockedYou".
  // For now, we rely on the `activeConversation` object having populated settings if it came from Inbox.
  // But `activeConversation` from Search might NOT have settings populated fully or correctly for privacy.
  // We'll rely on the Inbox `other` object which we augmented in backend to include settings.

  // Checking if *I* blocked *Them*:
  // I need access to my own settings. `currentIdentity.user.settings` isn't available directly in identity context usually,
  // unless we fetch it. We have `useSettings` hook!
  // BUT `useSettings` fetches from `/api/settings`. Let's assume we have it.
  // Wait, `activeConversation` is an Identity object.
  // My settings are in `settings` (we need to fetch them).

  // Let's assume we don't have global settings context easily here without adding it.
  // I will check `activeConversation` for "blockedByMe" if backend provided it? No.
  // I will use `activeConversation.isBlocked` if I can adding it to the inbox endpoint...
  // Or just fetch settings.

  // For simplicity:
  // If `activeConversation` object has `isBlocked` (we didn't add this).
  // Let's use `inbox` data to find the conversation and check settings there?

  // Real implementation: We need to check `blockedUsers` in MY settings.
  // I'll fetch my settings once on mount.
  const [mySettings, setMySettings] = useState(null);
  useEffect(() => {
      axios.get('/api/settings').then(res => setMySettings(res.data)).catch(console.error);
  }, [inbox]); // Refresh when inbox refreshes (e.g. after blocking)

  const isBlockedByMe = mySettings?.blockedUsers?.includes(activeConversation?._id);
  // Check if they blocked me (needs their settings in activeConversation)
  // If activeConversation came from Inbox, it might have it.
  const isBlockedByThem = activeConversation?.user?.settings?.blockedUsers?.includes(currentIdentity?._id);

  // Muted Logic
  const isMuted = mySettings?.mutedUsers?.includes(activeConversation?._id);

  const renderSharedPost = (post, isMe) => {
      if (!post || !post.identity) {
          return (
              <div className={clsx("rounded-2xl border p-4 w-60 mb-1 flex items-center space-x-3 opacity-80", isMe ? "bg-white/5 border-white/10 text-white/70" : "bg-surface border-soft-border text-secondary")}>
                   <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center flex-shrink-0"><Shield size={18} className="opacity-50" /></div>
                   <div className="flex-1 min-w-0"><p className="text-xs font-bold leading-tight">Unavailable Moment</p></div>
              </div>
          );
      }
      const hasMedia = post.media && post.media.length > 0;
      const media = hasMedia ? post.media[0] : null;
      const textContent = post.content || '';
      const truncatedText = textContent.length > 60 ? textContent.slice(0, 60) + '...' : textContent;

      return (
          <div onClick={() => navigate(`/post/${post._id}`)} className={clsx("rounded-2xl overflow-hidden cursor-pointer border mb-1 transition-all w-60 relative group", isMe ? "bg-accent border-transparent text-white" : "bg-surface border-soft-border text-text hover:shadow-md")}>
              <div className="flex flex-col h-full relative">
                  <div className={clsx("p-3 flex items-center space-x-2 border-b z-10 relative", isMe ? "border-white/20" : "border-soft-border")}>
                      <Avatar identity={post.identity} size="xs" />
                      <span className={clsx("text-xs font-bold truncate", isMe ? "text-white" : "text-text")}>{post.identity?.name}</span>
                  </div>
                  <div className="relative">
                      {hasMedia ? (
                          <>
                              <div className="aspect-[4/3] w-full bg-black/5 flex items-center justify-center overflow-hidden">
                                  {media.type === 'video' ? <video src={media.url} className="w-full h-full object-cover" muted /> : <img src={media.url} className="w-full h-full object-cover" />}
                              </div>
                              {textContent && <div className="p-3 pt-2"><p className={clsx("text-xs font-serif leading-relaxed line-clamp-2", isMe ? "text-white/90" : "text-text/90")}>{truncatedText}</p></div>}
                          </>
                      ) : (
                          <div className="p-4 py-6 flex items-center justify-center min-h-[120px]"><p className={clsx("font-serif text-sm text-center italic leading-relaxed line-clamp-6", isMe ? "text-white" : "text-text")}>"{textContent}"</p></div>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] bg-surface rounded-3xl shadow-sm border border-soft-border overflow-hidden flex relative">

      {/* Sidebar (List View) */}
      <div className={clsx(
          "w-full md:w-96 border-r border-soft-border flex flex-col absolute md:relative h-full bg-surface z-10 transition-transform duration-300 flex-shrink-0",
          view === 'list' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
          <div className="p-4 border-b border-soft-border">
               <h2 className="text-xl font-serif font-bold text-text mb-4">Messages</h2>
               <div className="mb-4 -mx-2"><div className="scale-90 origin-top-left w-[110%]"><QuotesWidget /></div></div>
               <div className="relative mb-4">
                   <Search size={16} className="absolute left-3 top-2.5 text-secondary" />
                   <input className="w-full bg-background border-none rounded-xl py-2 pl-9 text-sm focus:ring-1 focus:ring-soft-border text-text placeholder-secondary" placeholder="Search users..." value={searchQuery} onChange={handleSearch} />
               </div>
               {searchResults.length > 0 && (
                   <div className="absolute top-28 left-4 right-4 bg-surface shadow-xl border border-soft-border rounded-xl z-20 max-h-60 overflow-y-auto">
                       {searchResults.map(id => (
                           <div key={id._id} onClick={() => { handleConversationClick(id); setSearchQuery(''); setSearchResults([]); }} className="p-3 hover:bg-background cursor-pointer flex items-center space-x-3">
                               <Avatar identity={id} size="sm" />
                               <span className="text-sm font-bold text-text">{id.name}</span>
                           </div>
                       ))}
                   </div>
               )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
              {(inbox || []).reduce((acc, msg) => {
                  if (!msg.sender || !msg.recipient) return acc;
                  const isSenderMe = identities?.some(id => id._id === msg.sender._id);
                  const other = isSenderMe ? msg.recipient : msg.sender;
                  if (acc.some(item => item.other._id === other._id)) return acc;
                  acc.push({ msg, other, isSenderMe });
                  return acc;
              }, []).map(({ msg, other, isSenderMe }) => {
                  const isUnread = !isSenderMe && !msg.read;
                  // Check if muted in MY settings (need to pass mySettings or check it here)
                  // For now, re-use isMuted logic if possible, but we need to iterate.
                  const isOtherMuted = mySettings?.mutedUsers?.includes(other._id);

                  return (
                      <div
                        key={msg._id}
                        className={`p-4 border-b border-soft-border cursor-pointer hover:bg-background transition relative group ${activeConversation?._id === other._id ? 'bg-background' : ''}`}
                        onClick={() => handleConversationClick(other)}
                      >
                          <div className="flex items-center space-x-3">
                              <div className="relative">
                                <Avatar identity={other} />
                                {isUnread && !isOtherMuted && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-surface"></span>}
                                {isOtherMuted && <span className="absolute -bottom-1 -right-1 bg-surface rounded-full p-0.5"><BellOff size={10} className="text-secondary"/></span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-baseline mb-1">
                                      <span className={clsx("text-sm truncate", isUnread ? "font-bold text-text" : "font-medium text-text/80")}>{other.name}</span>
                                      <span className="text-[10px] text-secondary">{formatShortTime(msg.createdAt)}</span>
                                  </div>
                                  <p className={clsx("text-xs truncate", isUnread ? "font-semibold text-text" : "text-secondary")}>
                                      {isSenderMe ? 'You: ' : ''}{msg.sharedPost ? 'Shared a moment' : msg.replyToQuote ? 'Replied to a note' : msg.content || 'Sent a file'}
                                  </p>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === `list-${other._id}` ? null : `list-${other._id}`); }} className="p-1 text-secondary hover:text-text rounded-full hover:bg-surface opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical size={16} /></button>
                              <AnimatePresence>
                                  {activeMenuId === `list-${other._id}` && (
                                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute right-4 top-10 z-20 bg-surface border border-soft-border shadow-lg rounded-xl p-1 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                                          <button onClick={() => { handleMuteUser(other._id); setActiveMenuId(null); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg text-left"><BellOff size={14} /> <span>{isOtherMuted ? 'Unmute' : 'Mute'}</span></button>
                                          <button onClick={() => { handleBlockUser(other._id); setActiveMenuId(null); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg text-left"><ShieldAlert size={14} /> <span>Block</span></button>
                                          <button onClick={() => { setActiveConversation(other); setShowDeleteConvModal(true); setActiveMenuId(null); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-red-500 hover:bg-background rounded-lg text-left"><Trash2 size={14} /> <span>Delete</span></button>
                                      </motion.div>
                                  )}
                              </AnimatePresence>
                          </div>
                      </div>
                  )
              })}
          </div>
      </div>

      {/* Chat Area */}
      <div className={clsx(
          "w-full md:flex-1 flex flex-col bg-background/50 absolute md:relative h-full transition-transform duration-300",
          view === 'chat' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
      )}>
          {activeConversation ? (
              <>
                  <div className="p-4 bg-surface border-b border-soft-border flex items-center shadow-sm z-10">
                      <button onClick={() => setView('list')} className="md:hidden mr-3 text-secondary"><ChevronLeft /></button>
                      <div className="flex items-center space-x-3">
                          <Avatar identity={activeConversation} />
                          <div>
                              <h3 className="font-bold text-text flex items-center gap-2">
                                {activeConversation.name}
                                {isMuted && <BellOff size={12} className="text-secondary" />}
                              </h3>
                              <p className="text-xs text-secondary uppercase tracking-wide">{activeConversation.type}</p>
                          </div>
                      </div>
                      <div className="ml-auto relative">
                          <button onClick={() => setShowConversationMenu(!showConversationMenu)} className="p-2 text-secondary hover:text-text rounded-full hover:bg-background transition"><MoreVertical size={20} /></button>
                          <AnimatePresence>
                              {showConversationMenu && (
                                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-10 z-20 bg-surface border border-soft-border shadow-lg rounded-xl p-1 min-w-[160px]">
                                      <button onClick={() => navigate(`/profile/${activeConversation.handle.replace('@','')}`)} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg text-left"><User size={14} /> <span>View Profile</span></button>
                                      <button onClick={() => { handleMuteUser(activeConversation._id); setShowConversationMenu(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg text-left"><BellOff size={14} /> <span>{isMuted ? 'Unmute' : 'Mute Notifications'}</span></button>
                                      <button onClick={() => { handleBlockUser(activeConversation._id); setShowConversationMenu(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg text-left"><ShieldAlert size={14} /> <span>Block User</span></button>
                                      <div className="h-px bg-soft-border my-1" />
                                      <button onClick={() => { setShowDeleteConvModal(true); setShowConversationMenu(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-red-500 hover:bg-background rounded-lg text-left"><Trash2 size={14} /> <span>Delete Chat</span></button>
                                  </motion.div>
                              )}
                          </AnimatePresence>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" onClick={() => setActiveMenuId(null)}>
                      {messages?.map((msg, idx) => {
                          const isMe = msg.sender._id === currentIdentity?._id;
                          return (
                              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}>
                                  {!isMe && <div className="mt-auto mr-2"><Avatar identity={msg.sender} size="xs" /></div>}
                                  <div className={clsx("absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition px-2", isMe ? "-left-8" : "-right-8")}>
                                      <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === `msg-${msg._id}` ? null : `msg-${msg._id}`); }} className="text-secondary hover:text-text"><MoreVertical size={14} /></button>
                                      <AnimatePresence>
                                          {activeMenuId === `msg-${msg._id}` && (
                                              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={clsx("absolute top-full z-30 bg-surface border border-soft-border shadow-lg rounded-xl p-1 min-w-[120px]", isMe ? "right-0" : "left-0")}>
                                                  {msg.content && <button onClick={() => handleCopy(msg.content)} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg text-left"><Copy size={12} /> <span>Copy</span></button>}
                                                  {isMe && <button onClick={() => handleDeleteMessage(msg._id)} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-red-500 hover:bg-background rounded-lg text-left"><Trash2 size={12} /> <span>Delete</span></button>}
                                              </motion.div>
                                          )}
                                      </AnimatePresence>
                                  </div>

                                  <div className={`max-w-[85%] md:max-w-[70%] space-y-2`}>
                                      {msg.media?.map((m, i) => (
                                          <div key={i} className={clsx("overflow-hidden shadow-sm border", m.type === 'file' ? "p-3 rounded-2xl flex items-center space-x-3 bg-surface border-soft-border" : "rounded-2xl border-transparent")}>
                                              {m.type === 'image' && <img src={m.url} className="max-w-full rounded-2xl" />}
                                              {m.type === 'video' && <MediaPlayer src={m.url} />}
                                              {m.type === 'file' && <div className="flex-1 min-w-0"><p className="text-sm font-medium text-text truncate">{m.name}</p><p className="text-[10px] text-secondary">{formatBytes(m.size)}</p></div>}
                                          </div>
                                      ))}
                                      {msg.sharedPost && <div className={clsx("mb-1", isMe ? "ml-auto" : "mr-auto")}>{renderSharedPost(msg.sharedPost, isMe)}</div>}
                                      {msg.replyToQuote && <div className="mb-1"><div className={clsx("p-3 rounded-2xl border mb-1 max-w-sm relative", isMe ? "bg-slate-100 dark:bg-slate-800 border-transparent text-text" : "bg-white dark:bg-slate-900 border-soft-border text-text")}><div className="flex items-start space-x-2"><div className="mt-0.5"><CornerUpLeft size={12} className="text-secondary" /></div><div><p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Replying to Note</p><div className="pl-2 border-l-2 border-slate-300 dark:border-slate-600"><p className="text-sm font-serif italic text-text/80 line-clamp-3">"{msg.replyToQuote.content}"</p></div></div></div></div></div>}
                                      {msg.content && <div className={clsx("p-4 text-sm shadow-sm rounded-2xl", isMe ? "bg-accent text-white rounded-br-none" : "bg-surface text-text rounded-bl-none border border-soft-border")}><p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p></div>}
                                      <div className={`text-[9px] mt-1 text-right ${isMe ? 'opacity-50' : 'text-secondary'}`}>{formatShortTime(msg.createdAt)}</div>
                                  </div>
                              </div>
                          )
                      })}
                      <div ref={scrollRef} />
                  </div>

                  <div className="p-4 bg-surface border-t border-soft-border">
                      {isBlockedByMe ? (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
                              <div className="flex items-center space-x-3 text-red-400">
                                  <ShieldAlert size={20} />
                                  <span className="text-sm font-bold">You have blocked this user.</span>
                              </div>
                              <button onClick={() => handleBlockUser(activeConversation._id)} className="text-xs font-bold text-red-400 hover:text-red-300">Unblock</button>
                          </div>
                      ) : isBlockedByThem ? (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
                              <div className="flex items-center space-x-3 text-amber-500">
                                  <Lock size={20} />
                                  <span className="text-sm font-bold">You cannot reply to this conversation.</span>
                              </div>
                              <Link to="/learn-more" className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center">
                                  Learn More <ChevronLeft size={12} className="rotate-180 ml-1" />
                              </Link>
                          </div>
                      ) : (
                          <>
                              {mediaFiles.length > 0 && (
                                  <div className="flex space-x-2 mb-2 overflow-x-auto p-2 bg-background rounded-xl">
                                      {mediaFiles.map((file, i) => (
                                          <div key={i} className="relative group bg-surface border rounded-lg p-1">
                                              {file.type.startsWith('image') ? <img src={URL.createObjectURL(file)} className="w-12 h-12 object-cover rounded-md" /> : <div className="w-12 h-12 flex items-center justify-center text-secondary"><FileText size={20} /></div>}
                                              <button onClick={() => removeFile(i)} className="absolute -top-1 -right-1 bg-black text-white p-0.5 rounded-full shadow-sm"><X size={8}/></button>
                                          </div>
                                      ))}
                                  </div>
                              )}
                              <div className="flex items-center space-x-2 bg-background p-2 rounded-2xl border border-soft-border focus-within:ring-2 ring-soft-border transition-shadow">
                                  <label className="p-2 text-secondary hover:text-text cursor-pointer transition">
                                      <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                                      <Plus size={20} />
                                  </label>
                                  <input
                                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-secondary text-text"
                                      placeholder="Type a message..."
                                      value={messageText}
                                      onChange={(e) => setMessageText(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                  />
                                  <button onClick={handleSend} disabled={sending} className="bg-accent text-white p-2 rounded-xl hover:scale-105 transition-transform disabled:opacity-50"><Send size={18} /></button>
                              </div>
                          </>
                      )}
                  </div>

                  <ConfirmationModal isOpen={showDeleteConvModal} onClose={() => setShowDeleteConvModal(false)} onConfirm={handleDeleteConversation} title="Delete Conversation?" message="This will delete the conversation from your inbox. This action cannot be undone." confirmText="Delete" isDanger={true} />
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-secondary">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4"><User size={32} /></div>
                  <p className="font-serif text-lg">Select a conversation</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default Messages;
