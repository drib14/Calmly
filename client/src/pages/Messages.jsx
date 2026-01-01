import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { useIdentity } from '../context/IdentityContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Image, Mic, User, Plus, X, Search, FileText, Download, ChevronLeft, Shield, Lock, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import Avatar from '../components/Avatar';
import MediaPlayer from '../components/MediaPlayer';
import QuotesWidget from '../components/QuotesWidget';
import { toast } from 'react-hot-toast';

const moodColors = {
    'Neutral': 'bg-slate-900 text-white border-slate-900',
    'Happy': 'bg-yellow-400 text-yellow-900 border-yellow-400',
    'Sad': 'bg-blue-500 text-white border-blue-500',
    'Angry': 'bg-red-500 text-white border-red-500',
    'Hopeful': 'bg-green-500 text-white border-green-500',
    'Anxious': 'bg-purple-500 text-white border-purple-500',
};

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
  const scrollRef = useRef();

  // Mobile View State ('list' or 'chat')
  const [view, setView] = useState('list');

  useEffect(() => {
    if (location.state?.startConversationWith) {
      setActiveConversation(location.state.startConversationWith);
      setView('chat');
      // Clear state to avoid reopening on refresh/back (optional, often better to keep for history consistency)
      // window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Suggested Users (All identities for now, horizontal scroll)
  const { data: suggestedUsersRaw } = useSWR('/search?q=&type=identities', async (url) => {
      try {
          const res = await axios.get(url);
          return res.data.identities || [];
      } catch (err) { return []; }
  });

  // Suggested users logic (allow self-chat)
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
              const results = res.data.identities || [];
              // Allow self-chat, so no filtering of own identities
              setSearchResults(results);
          } catch (err) {
              console.error(err);
          }
      } else {
          setSearchResults([]);
      }
  };

  const renderSharedPost = (post, isMe) => {
      if (!post) return <div className="text-xs text-red-400 italic">Post deleted or unavailable</div>;

      return (
          <div
            onClick={() => navigate(`/feed#post-${post._id}`)}
            className="w-full max-w-sm bg-surface rounded-2xl border border-soft-border overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition group"
          >
              {/* Hero Image (Top) */}
              {post.media && post.media.length > 0 ? (
                  <div className="relative aspect-video w-full bg-slate-100">
                      {post.media[0].type === 'image' ? (
                        <img src={post.media[0].url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                            <MediaPlayer src={post.media[0].url} />
                        </div>
                      )}
                  </div>
              ) : (
                  <div className="h-24 bg-gradient-to-r from-slate-100 to-slate-200 flex items-center justify-center">
                      <FileText className="text-slate-400 opacity-50" size={32} />
                  </div>
              )}

              {/* Content (Bottom) */}
              <div className="p-4 bg-surface">
                   <h4 className="text-sm font-bold text-text mb-1 truncate">{post.identity?.name}</h4>
                   <p className="text-xs text-secondary mb-3 line-clamp-2">
                       {post.content || (post.media ? 'Attached media' : 'Shared content')}
                   </p>

                   <div className="flex items-center justify-between text-[10px] text-secondary uppercase tracking-wider font-medium border-t border-soft-border pt-2">
                       <span>Calmly Post</span>
                       <ChevronLeft className="rotate-180 text-secondary" size={12} />
                   </div>
              </div>
          </div>
      );
  };

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] bg-surface rounded-3xl shadow-sm border border-soft-border overflow-hidden flex relative">

      {/* Sidebar (List View) */}
      <div className={clsx(
          "w-full md:w-1/3 border-r border-soft-border flex flex-col absolute md:relative h-full bg-surface z-10 transition-transform duration-300",
          view === 'list' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
          <div className="p-4 border-b border-soft-border">
               <h2 className="text-lg font-serif font-bold text-text mb-2">Messages</h2>

               {/* Quotes in Message Page (Horizontal Profiles) */}
               <div className="mb-2 -mx-2">
                   <div className="scale-90 origin-top-left w-[110%]">
                       <QuotesWidget />
                   </div>
               </div>

               <div className="relative mb-2">
                   <Search size={16} className="absolute left-3 top-2.5 text-secondary" />
                   <input
                      className="w-full bg-background border-none rounded-xl py-2 pl-9 text-sm focus:ring-1 focus:ring-soft-border text-text placeholder-secondary"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={handleSearch}
                  />
               </div>

               {/* Search Results Dropdown */}
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
                  // Deduplication Logic on Frontend as a failsafe
                  if (!msg.sender || !msg.recipient) return acc;

                  // Check if the sender is ANY of my identities
                  const isSenderMe = identities?.some(id => id._id === msg.sender._id);
                  // The other person is the recipient if I am the sender, otherwise it's the sender
                  const other = isSenderMe ? msg.recipient : msg.sender;

                  // Ensure we haven't already rendered a conversation for this 'other' person
                  // This fixes "displayed duplicated data" if backend grouping is flaky or multiple threads exist
                  if (acc.some(item => item.other._id === other._id)) return acc;

                  acc.push({ msg, other, isSenderMe });
                  return acc;
              }, []).map(({ msg, other, isSenderMe }) => {
                  const isUnread = !isSenderMe && !msg.read;

                  return (
                      <div
                        key={msg._id}
                        onClick={() => handleConversationClick(other)}
                        className={`p-4 border-b border-soft-border cursor-pointer hover:bg-background transition ${activeConversation?._id === other._id ? 'bg-background' : ''}`}
                      >
                          <div className="flex items-center space-x-3">
                              <div className="relative">
                                <Avatar identity={other} />
                                {isUnread && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-surface"></span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-baseline mb-1">
                                      <span className={clsx("text-sm truncate", isUnread ? "font-bold text-text" : "font-medium text-text/80")}>{other.name}</span>
                                      <span className="text-[10px] text-secondary">{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                                  </div>
                                  <p className={clsx("text-xs truncate", isUnread ? "font-semibold text-text" : "text-secondary")}>
                                      {isSenderMe ? 'You: ' : ''}{msg.sharedPost ? 'Shared a post' : msg.content || 'Sent a file'}
                                  </p>
                              </div>
                          </div>
                      </div>
                  )
              })}
          </div>
      </div>

      {/* Chat Area (Detail View) */}
      <div className={clsx(
          "w-full md:flex-1 flex flex-col bg-background/50 absolute md:relative h-full transition-transform duration-300",
          view === 'chat' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
      )}>
          {activeConversation ? (
              <>
                  <div className="p-4 bg-surface border-b border-soft-border flex items-center shadow-sm z-10">
                      {/* Back Button (Mobile Only) */}
                      <button onClick={() => setView('list')} className="md:hidden mr-3 text-secondary">
                          <ChevronLeft />
                      </button>

                      <div className="flex items-center space-x-3">
                          <Avatar identity={activeConversation} />
                          <div>
                              <h3 className="font-bold text-text flex items-center gap-2">
                                {activeConversation.name}
                                {/* Privacy Indicators */}
                                {activeConversation.settings?.enablePrivateMessaging === false && <span title="Private Messaging Disabled" className="text-red-400"><Lock size={12} /></span>}
                                {activeConversation.settings?.allowAnonymousDMs === false && <span title="Anonymous DMs Disabled" className="text-amber-400"><Shield size={12} /></span>}
                              </h3>
                              <p className="text-xs text-secondary uppercase tracking-wide">{activeConversation.type}</p>
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                      {messages?.map((msg, idx) => {
                          // In the chat detail, we want to align messages based on the active current identity
                          // If I sent it (from ANY identity? or just the current one?)
                          // Usually in chat view, we want to see My messages on right, Theirs on left.
                          // Since 'messages' endpoint returns conversation between identity1 and identity2,
                          // and identity1 is currentIdentity, then 'isMe' is simply if sender matches currentIdentity.
                          // However, to be robust if the user switches identities while viewing:
                          const isMe = msg.sender._id === currentIdentity?._id;

                          return (
                              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  {!isMe && <div className="mt-auto mr-2"><Avatar identity={msg.sender} size="xs" /></div>}
                                  <div className={`max-w-[85%] md:max-w-[70%] space-y-2`}>
                                      {/* Media Bubbles */}
                                      {msg.media?.map((m, i) => (
                                          <div key={i} className={clsx(
                                              "overflow-hidden shadow-sm border",
                                              m.type === 'file' ? "p-3 rounded-2xl flex items-center space-x-3 bg-surface border-soft-border" : "rounded-2xl border-transparent"
                                          )}>
                                              {m.type === 'image' && <img src={m.url} className="max-w-full rounded-2xl" />}
                                              {m.type === 'video' && <MediaPlayer src={m.url} />}
                                              {m.type === 'audio' && <audio src={m.url} controls className="w-full" />}
                                              {m.type === 'file' && (
                                                  <>
                                                      <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center flex-shrink-0 text-secondary">
                                                          <FileText size={20} />
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                          <p className="text-sm font-medium text-text truncate">{m.name}</p>
                                                          <p className="text-[10px] text-secondary">{m.size ? formatBytes(m.size) : 'File'}</p>
                                                      </div>
                                                      <a href={m.url} download target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-background rounded-full text-secondary hover:text-text transition">
                                                          <Download size={16} />
                                                      </a>
                                                  </>
                                              )}
                                          </div>
                                      ))}

                                      {/* Shared Post Bubble */}
                                      {msg.sharedPost && renderSharedPost(msg.sharedPost, isMe)}

                                      {/* Reply to Quote Cluster */}
                                      {msg.replyToQuote && (
                                          <div className={clsx("flex flex-col", isMe ? "items-end" : "items-start")}>
                                              {/* Label */}
                                              <div className={clsx("text-[10px] text-secondary font-medium mb-1 flex items-center space-x-1", isMe ? "mr-1" : "ml-1")}>
                                                  <Reply size={10} className={isMe ? "scale-x-[-1]" : ""} />
                                                  <span>{isMe ? "You replied to their quote" : "Replied to your quote"}</span>
                                              </div>

                                              {/* Top Bubble (The Quote) */}
                                              <div className={clsx(
                                                  "px-4 py-3 text-sm border shadow-sm max-w-full z-0",
                                                  "rounded-t-3xl",
                                                  isMe ? "rounded-br-sm rounded-bl-3xl" : "rounded-bl-sm rounded-br-3xl",
                                                  moodColors[msg.replyToQuote.mood] || moodColors['Neutral'],
                                                  msg.replyToQuote.font || 'font-serif'
                                              )}>
                                                  <p className="italic">"{msg.replyToQuote.content}"</p>
                                              </div>
                                          </div>
                                      )}

                                      {/* Text Bubble (The Reply) */}
                                      {msg.content && (
                                          <div className={clsx(
                                              "p-4 text-sm shadow-sm border border-soft-border relative z-10",
                                              isMe ? "bg-accent text-white" : "bg-surface text-text",
                                              msg.replyToQuote ? (
                                                  // Smushed styling
                                                  isMe ? "rounded-b-3xl rounded-tl-3xl rounded-tr-sm -mt-[1px] border-t-0" : "rounded-b-3xl rounded-tr-3xl rounded-tl-sm -mt-[1px] border-t-0"
                                              ) : (
                                                  // Standard styling
                                                  isMe ? "rounded-3xl rounded-tr-md" : "rounded-3xl rounded-tl-md"
                                              )
                                          )}>
                                              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                          </div>
                                      )}

                                      <div className={`text-[9px] mt-1 text-right ${isMe ? 'opacity-50' : 'text-secondary'}`}>
                                          {formatDistanceToNow(new Date(msg.createdAt))}
                                      </div>
                                  </div>
                              </div>
                          )
                      })}
                      <div ref={scrollRef} />
                  </div>

                  <div className="p-4 bg-surface border-t border-soft-border">
                      {mediaFiles.length > 0 && (
                          <div className="flex space-x-2 mb-2 overflow-x-auto p-2 bg-background rounded-xl">
                              {mediaFiles.map((file, i) => (
                                  <div key={i} className="relative group bg-surface border rounded-lg p-1 min-w-[60px]">
                                      {previews[i] ? (
                                          <img src={previews[i]} className="w-12 h-12 object-cover rounded-md mx-auto" />
                                      ) : (
                                          <div className="w-12 h-12 flex items-center justify-center text-secondary mx-auto bg-soft-border/30 rounded-md">
                                              <FileText size={20} />
                                          </div>
                                      )}
                                      <div className="text-[8px] truncate w-full text-center mt-1 text-secondary">{formatBytes(file.size, 0)}</div>
                                      <button onClick={() => removeFile(i)} className="absolute -top-1 -right-1 bg-black/80 text-white p-0.5 rounded-full shadow-sm hover:bg-black"><X size={10}/></button>
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
                          <button
                              onClick={handleSend}
                              disabled={sending}
                              className="bg-accent text-white p-2 rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
                          >
                              <Send size={18} />
                          </button>
                      </div>
                  </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-secondary">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4">
                      <User size={32} />
                  </div>
                  <p className="font-serif text-lg">Select a conversation</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default Messages;
