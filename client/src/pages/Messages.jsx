import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { useIdentity } from '../context/IdentityContext';
import { Send, Image, Mic, User, Plus, X, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../components/Avatar';
import MediaPlayer from '../components/MediaPlayer';
import { toast } from 'react-hot-toast';

const Messages = () => {
  const { currentIdentity, identities } = useIdentity();
  const [activeConversation, setActiveConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef();

  // Fetch Inbox
  const { data: inbox, mutate: mutateInbox } = useSWR('/messages/inbox', async (url) => {
      try {
          const res = await axios.get(url);
          return res.data;
      } catch (err) {
          if (err.response?.status !== 401) { // Ignore 401s here as auth might be loading
             // toast.error("Failed to load inbox"); // Optional: don't spam toasts
          }
          return [];
      }
  });

  // Fetch Conversation
  const { data: messages, mutate: mutateMessages } = useSWR(
      activeConversation && currentIdentity ? `/messages/conversation?identity1=${currentIdentity._id}&identity2=${activeConversation._id}` : null,
      async (url) => {
          try {
              const res = await axios.get(url);
              return res.data;
          } catch (err) {
              console.error(err);
              return [];
          }
      },
      { refreshInterval: 3000 }
  );

  useEffect(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
      if ((!messageText.trim() && mediaFiles.length === 0) || !activeConversation || !currentIdentity) return;

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
      }
  };

  const handleFileSelect = (e) => {
      const files = Array.from(e.target.files);
      setMediaFiles([...mediaFiles, ...files]);
      const newPreviews = files.map(f => URL.createObjectURL(f));
      setPreviews([...previews, ...newPreviews]);
  };

  // Mock Identity Search for New Message (Simplified)
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

  return (
    <div className="h-[calc(100vh-100px)] bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-slate-100 flex flex-col">
          <div className="p-4 border-b border-slate-50">
               <h2 className="text-xl font-serif font-bold text-slate-900 mb-4">Messages</h2>
               <div className="relative">
                   <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                   <input
                      className="w-full bg-slate-50 border-none rounded-xl py-2 pl-9 text-sm focus:ring-1 focus:ring-slate-200"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={handleSearch}
                   />
               </div>
               {/* Search Results */}
               {searchResults.length > 0 && (
                   <div className="mt-2 absolute bg-white shadow-xl border border-slate-100 rounded-xl w-64 z-20 max-h-60 overflow-y-auto">
                       {searchResults.map(id => (
                           <div key={id._id} onClick={() => { setActiveConversation(id); setSearchQuery(''); setSearchResults([]); }} className="p-3 hover:bg-slate-50 cursor-pointer flex items-center space-x-3">
                               <Avatar identity={id} size="sm" />
                               <span className="text-sm font-bold text-slate-700">{id.name}</span>
                           </div>
                       ))}
                   </div>
               )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
              {inbox?.map(msg => {
                  const other = msg.sender._id === currentIdentity?._id ? msg.recipient : msg.sender;
                  return (
                      <div
                        key={msg._id}
                        onClick={() => setActiveConversation(other)}
                        className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition ${activeConversation?._id === other._id ? 'bg-slate-50' : ''}`}
                      >
                          <div className="flex items-center space-x-3">
                              <Avatar identity={other} />
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-baseline mb-1">
                                      <span className="font-bold text-slate-800 text-sm truncate">{other.name}</span>
                                      <span className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 truncate">{msg.content || 'Sent a file'}</p>
                              </div>
                          </div>
                      </div>
                  )
              })}
          </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
          {activeConversation ? (
              <>
                  <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm z-10">
                      <div className="flex items-center space-x-3">
                          <Avatar identity={activeConversation} />
                          <div>
                              <h3 className="font-bold text-slate-900">{activeConversation.name}</h3>
                              <p className="text-xs text-slate-500 uppercase tracking-wide">{activeConversation.type}</p>
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                      {messages?.map((msg, idx) => {
                          const isMe = msg.sender._id === currentIdentity?._id;
                          return (
                              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  {!isMe && <div className="mt-auto mr-2"><Avatar identity={msg.sender} size="xs" /></div>}
                                  <div className={`max-w-[70%] rounded-2xl p-4 text-sm shadow-sm ${isMe ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'}`}>
                                      {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                                      {msg.media?.length > 0 && (
                                          <div className="grid gap-2 mt-2">
                                              {msg.media.map((m, i) => (
                                                  m.type === 'video' ? <MediaPlayer key={i} src={m.url} /> : <img key={i} src={m.url} className="rounded-lg" />
                                              ))}
                                          </div>
                                      )}
                                      <div className={`text-[9px] mt-1 text-right ${isMe ? 'opacity-50' : 'text-slate-300'}`}>
                                          {formatDistanceToNow(new Date(msg.createdAt))}
                                      </div>
                                  </div>
                              </div>
                          )
                      })}
                      <div ref={scrollRef} />
                  </div>

                  <div className="p-4 bg-white border-t border-slate-100">
                      {previews.length > 0 && (
                          <div className="flex space-x-2 mb-2 overflow-x-auto">
                              {previews.map((src, i) => (
                                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                                      <img src={src} className="w-full h-full object-cover" />
                                      <button onClick={() => {
                                          const newFiles = [...mediaFiles]; newFiles.splice(i,1); setMediaFiles(newFiles);
                                          const newPrev = [...previews]; newPrev.splice(i,1); setPreviews(newPrev);
                                      }} className="absolute top-0 right-0 bg-black text-white p-0.5 rounded-bl"><X size={10}/></button>
                                  </div>
                              ))}
                          </div>
                      )}
                      <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:ring-2 ring-slate-200 transition-shadow">
                          <label className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer transition">
                              <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                              <Image size={20} />
                          </label>
                          <input
                              className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-400"
                              placeholder="Type a message..."
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                          />
                          <button onClick={handleSend} className="bg-slate-900 text-white p-2 rounded-xl hover:scale-105 transition-transform">
                              <Send size={18} />
                          </button>
                      </div>
                  </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
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
