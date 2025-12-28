import React, { useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Mail, MessageCircle, Send, User } from 'lucide-react';
import useSWR from 'swr';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const fetcher = url => axios.get(url).then(res => res.data);

const Messages = () => {
  const { data: messages, error } = useSWR('/messages/inbox', fetcher, {
      refreshInterval: 2000 // Poll every 2 seconds for real-time effect
  });

  const isLoading = !messages && !error;

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col md:flex-row bg-surface rounded-2xl shadow-sm overflow-hidden border border-soft-border">

      {/* Sidebar (List) */}
      <div className="w-full md:w-1/3 border-r border-soft-border bg-slate-50 flex flex-col">
          <div className="p-4 border-b border-soft-border">
              <h2 className="text-xl font-serif text-accent">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {isLoading ? (
                <p className="text-center text-gray-400 py-4 text-sm">Loading conversations...</p>
            ) : messages?.length === 0 ? (
                <div className="text-center py-10 opacity-60">
                    <MessageCircle className="mx-auto text-gray-300 mb-2" size={32} />
                    <p className="text-sm text-gray-500">No messages yet.</p>
                </div>
            ) : (
                messages?.map((msg) => (
                    <motion.div
                        key={msg._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 bg-white rounded-xl border border-soft-border cursor-pointer hover:bg-white/80 transition shadow-sm"
                    >
                       <div className="flex justify-between items-start mb-1">
                           <span className="font-semibold text-accent text-sm">
                               {msg.sender.name}
                           </span>
                           <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(msg.createdAt))} ago</span>
                       </div>
                       <p className="text-gray-500 text-xs line-clamp-1">{msg.content}</p>
                    </motion.div>
                ))
            )}
          </div>
      </div>

      {/* Chat Area (Placeholder for MVP, full chat logic would go here) */}
      <div className="hidden md:flex w-2/3 items-center justify-center bg-white">
          <div className="text-center opacity-40">
              <Mail size={48} className="mx-auto text-primary mb-4" />
              <h3 className="text-lg font-serif text-accent">Select a conversation</h3>
              <p className="text-sm text-gray-500">Or send a DM from someone's profile</p>
          </div>
      </div>
    </div>
  );
};

export default Messages;
