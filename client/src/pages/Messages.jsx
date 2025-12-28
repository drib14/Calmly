import React, { useState, useRef } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Send, Search, Mic, Paperclip, X, StopCircle } from 'lucide-react';
import useSWR from 'swr';
import clsx from 'clsx';
import { useIdentity } from '../context/IdentityContext';
import MediaPlayer from '../components/MediaPlayer';

const fetcher = url => axios.get(url).then(res => res.data);

const Messages = () => {
  const { currentIdentity } = useIdentity();
  const { data: inbox, mutate: mutateInbox } = useSWR('/messages/inbox', fetcher, { refreshInterval: 5000 });

  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Media State
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const [audioChunks, setAudioChunks] = useState([]);

  // Poll active chat messages
  useSWR(
      activeChat && currentIdentity ? `/messages/conversation?identity1=${currentIdentity._id}&identity2=${activeChat._id}` : null,
      fetcher,
      {
          refreshInterval: 2000,
          onSuccess: (data) => setChatMessages(data)
      }
  );

  React.useEffect(() => {
      const delayDebounceFn = setTimeout(async () => {
          if (searchQuery) {
              try {
                  const res = await axios.get(`/search?q=${searchQuery}`);
                  setSearchResults(res.data.identities || []);
              } catch (err) { console.error(err); }
          } else { setSearchResults([]); }
      }, 500);
      return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) setAudioChunks((prev) => [...prev, e.data]);
          };

          mediaRecorder.start();
          setIsRecording(true);
      } catch (err) {
          console.error("Mic access denied", err);
          alert("Microphone access denied");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          mediaRecorderRef.current.onstop = () => {
              const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
              const audioFile = new File([audioBlob], "voice_message.webm", { type: 'audio/webm' });
              setFiles([...files, audioFile]);
              setAudioChunks([]);
          };
      }
  };

  const handleFileSelect = (e) => {
      if (e.target.files) {
          setFiles([...files, ...Array.from(e.target.files)]);
      }
  };

  const removeFile = (index) => {
      const newFiles = [...files];
      newFiles.splice(index, 1);
      setFiles(newFiles);
  };

  const sendMessage = async () => {
      if ((!newMessage.trim() && files.length === 0) || !activeChat || !currentIdentity) return;
      setUploading(true);
      try {
          const formData = new FormData();
          formData.append('senderIdentityId', currentIdentity._id);
          formData.append('recipientIdentityId', activeChat._id);
          formData.append('content', newMessage);

          files.forEach(file => {
              formData.append('media', file);
          });

          const res = await axios.post('/messages', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });

          setChatMessages([...chatMessages, res.data]);
          setNewMessage('');
          setFiles([]);
          mutateInbox();
      } catch (err) { console.error(err); }
      finally { setUploading(false); }
  };

  const startChat = (identity) => {
      setActiveChat(identity);
      setSearchQuery('');
      setSearchResults([]);
  };

  const selectConversation = (msg) => {
      // Determine the "other" person
      const isSender = msg.sender._id === currentIdentity?._id;
      setActiveChat(isSender ? msg.recipient : msg.sender);
  };

  return (
    <div className="max-w-5xl mx-auto h-[80vh] flex flex-col md:flex-row bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">

      {/* Sidebar */}
      <div className="w-full md:w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
          <div className="p-4 border-b border-slate-200 space-y-4">
              <h2 className="text-xl font-serif text-slate-900 font-bold">Messages</h2>
              <div className="relative">
                  <input
                    type="text"
                    placeholder="Search people..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    value={searchQuery}
                  />
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {searchResults.length > 0 ? (
                <div>
                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide px-2">Search Results</p>
                    {searchResults.map(user => (
                        <div key={user._id} onClick={() => startChat(user)} className="p-3 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center space-x-3">
                            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs">{user.name[0]}</div>
                            <div><p className="text-sm font-bold text-slate-800">{user.name}</p><p className="text-xs text-slate-500">@{user.handle?.replace('@','')}</p></div>
                        </div>
                    ))}
                </div>
            ) : (
                inbox?.map((msg) => {
                    const isSender = msg.sender._id === currentIdentity?._id;
                    const otherUser = isSender ? msg.recipient : msg.sender;
                    const isActive = activeChat?._id === otherUser._id;
                    return (
                        <div
                            key={msg._id}
                            onClick={() => selectConversation(msg)}
                            className={clsx("p-3 rounded-xl cursor-pointer transition flex items-center space-x-3", isActive ? "bg-white shadow-sm border border-slate-200" : "hover:bg-slate-100")}
                        >
                           <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0 overflow-hidden">
                               {otherUser.avatar ? <img src={otherUser.avatar} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full text-slate-500">{otherUser.name[0]}</div>}
                           </div>
                           <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-baseline">
                                   <span className="text-sm font-bold text-slate-800 truncate">{otherUser.name}</span>
                                   <span className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(msg.createdAt))}</span>
                               </div>
                               <p className="text-xs text-slate-500 truncate">{isSender ? 'You: ' : ''}{msg.content || 'Media'}</p>
                           </div>
                        </div>
                    );
                })
            )}
          </div>
      </div>

      {/* Chat Area */}
      <div className="hidden md:flex flex-col w-2/3 bg-white">
          {activeChat ? (
              <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-100 flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-200 rounded-full overflow-hidden">
                          {activeChat.avatar ? <img src={activeChat.avatar} className="w-full h-full object-cover"/> : <div className="h-full flex items-center justify-center text-xs text-slate-500">{activeChat.name[0]}</div>}
                      </div>
                      <span className="font-bold text-slate-800">{activeChat.name}</span>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar flex flex-col-reverse">
                      {[...chatMessages].reverse().map((msg, i) => {
                          const isMe = msg.sender._id === currentIdentity?._id;
                          return (
                              <div key={i} className={clsx("flex flex-col max-w-[70%]", isMe ? "self-end items-end" : "self-start items-start")}>
                                  <div className={clsx("p-3 rounded-2xl text-sm overflow-hidden", isMe ? "bg-slate-900 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none")}>
                                      {msg.media && msg.media.map((m, idx) => (
                                          <div key={idx} className="mb-2 rounded-lg overflow-hidden">
                                              {m.type === 'video' ? <MediaPlayer src={m.url} /> : m.type === 'audio' ? <audio controls src={m.url} className="w-full h-8" /> : <img src={m.url} className="max-w-full" />}
                                          </div>
                                      ))}
                                      {msg.content && <p>{msg.content}</p>}
                                  </div>
                                  <span className="text-[10px] text-slate-400 mt-1 px-1">{formatDistanceToNow(new Date(msg.createdAt))} ago</span>
                              </div>
                          );
                      })}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-slate-100">
                      {/* File Preview */}
                      {files.length > 0 && (
                          <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                              {files.map((file, i) => (
                                  <div key={i} className="relative bg-slate-100 rounded-lg p-2 flex items-center space-x-2 text-xs border border-slate-200">
                                      <span className="truncate max-w-[100px]">{file.name}</span>
                                      <button onClick={() => removeFile(i)} className="hover:text-red-500"><X size={12} /></button>
                                  </div>
                              ))}
                          </div>
                      )}

                      <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:ring-2 ring-slate-100 transition-shadow">
                          {/* Attach Button */}
                          <label className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer rounded-full hover:bg-slate-200 transition">
                              <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                              <Paperclip size={20} />
                          </label>

                          <input
                            className="flex-1 bg-transparent outline-none px-2 text-sm placeholder:text-slate-400"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !uploading && sendMessage()}
                          />

                          {/* Voice Recorder */}
                          <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={clsx("p-2 rounded-full transition", isRecording ? "text-red-500 bg-red-50 animate-pulse" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200")}
                          >
                              {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                          </button>

                          <button
                            onClick={sendMessage}
                            disabled={uploading}
                            className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
                          >
                              <Send size={18} />
                          </button>
                      </div>
                  </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                  <MessageCircle size={48} className="mb-4" />
                  <p>Select a conversation to start chatting</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default Messages;
