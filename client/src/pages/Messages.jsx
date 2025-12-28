import React, { useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Send, Search } from 'lucide-react';
import useSWR from 'swr';
import clsx from 'clsx';
import { useIdentity } from '../context/IdentityContext';

const fetcher = url => axios.get(url).then(res => res.data);

const Messages = () => {
  const { currentIdentity } = useIdentity();
  const { data: inbox, mutate: mutateInbox } = useSWR('/messages/inbox', fetcher, { refreshInterval: 5000 });

  const [activeChat, setActiveChat] = useState(null); // The other user identity
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

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

  const sendMessage = async () => {
      if (!newMessage.trim() || !activeChat || !currentIdentity) return;
      try {
          const res = await axios.post('/messages', {
              senderIdentityId: currentIdentity._id,
              recipientIdentityId: activeChat._id,
              content: newMessage
          });
          setChatMessages([...chatMessages, res.data]);
          setNewMessage('');
          mutateInbox(); // Update sidebar preview
      } catch (err) { console.error(err); }
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
                      {[...chatMessages].reverse().map((msg, i) => { // Reverse to show latest at bottom if flex-col-reverse
                          const isMe = msg.sender._id === currentIdentity?._id;
                          return (
                              <div key={i} className={clsx("flex max-w-[80%]", isMe ? "self-end justify-end" : "self-start")}>
                                  <div className={clsx("p-3 rounded-2xl text-sm", isMe ? "bg-slate-900 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none")}>
                                      {msg.content}
                                  </div>
                              </div>
                          );
                      })}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-slate-100">
                      <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <input
                            className="flex-1 bg-transparent outline-none px-2 text-sm"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                          />
                          <button onClick={sendMessage} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"><Send size={16} /></button>
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
