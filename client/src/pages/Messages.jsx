import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Mail } from 'lucide-react';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await axios.get('/messages/inbox');
      setMessages(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-serif text-soft-dark mb-8">Inbox</h1>

      {loading ? (
        <p className="text-center text-gray-500">Checking for whispers...</p>
      ) : messages.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg">
            <p className="text-gray-500 mb-4">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-start space-x-4">
               <div className="bg-gray-100 p-2 rounded-full">
                   <Mail size={20} className="text-gray-500" />
               </div>
               <div className="flex-1">
                   <div className="flex justify-between items-center mb-1">
                       <span className="font-semibold text-gray-800">
                           {msg.sender.name}
                           <span className="text-xs text-gray-400 font-normal ml-2">({msg.sender.type})</span>
                       </span>
                       <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(msg.createdAt))} ago</span>
                   </div>
                   <p className="text-gray-600 text-sm mb-1">
                       To: {msg.recipient.name}
                   </p>
                   <div className="text-gray-800 mt-2 bg-gray-50 p-3 rounded-md">
                       {msg.content}
                   </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
