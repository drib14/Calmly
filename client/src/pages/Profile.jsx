import React from 'react';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';
import axios from 'axios';
import { User, Calendar, MapPin, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const fetcher = url => axios.get(url).then(res => res.data);

const Profile = () => {
  const { handle } = useParams();
  const { data, error, isLoading } = useSWR(`/profile/${handle}`, fetcher);

  if (isLoading) return <div className="text-center py-20 text-gray-400">Loading profile...</div>;
  if (error) return <div className="text-center py-20 text-red-400">User not found or private.</div>;

  const { identity, posts } = data;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header Card */}
      <div className="bg-surface border border-soft-border rounded-2xl overflow-hidden mb-6">
          <div className="h-32 bg-gradient-to-r from-slate-200 to-slate-300"></div>
          <div className="px-6 pb-6 relative">
              {/* Avatar */}
              <div className="absolute -top-12 left-6 w-24 h-24 rounded-full border-4 border-white bg-white flex items-center justify-center shadow-sm">
                  {identity.avatar ? (
                      <img src={identity.avatar} className="rounded-full w-full h-full object-cover" />
                  ) : (
                      <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User size={40} />
                      </div>
                  )}
              </div>

              <div className="mt-14 flex justify-between items-start">
                  <div>
                      <h1 className="text-2xl font-serif text-accent font-bold">{identity.name}</h1>
                      <p className="text-gray-500 text-sm">{identity.handle}</p>
                  </div>
                  <button className="px-4 py-2 rounded-full border border-soft-border text-sm font-medium hover:bg-slate-50 transition flex items-center space-x-2">
                      <MessageCircle size={16} />
                      <span>Message</span>
                  </button>
              </div>

              {identity.bio && <p className="mt-4 text-gray-700 leading-relaxed font-serif text-sm">{identity.bio}</p>}

              <div className="mt-4 flex items-center space-x-4 text-xs text-gray-400">
                   <div className="flex items-center space-x-1">
                       <Calendar size={14} />
                       <span>Joined {new Date(identity.createdAt).toLocaleDateString()}</span>
                   </div>
                   {/* Placeholder for future stats */}
                   <div>
                       <span className="font-bold text-accent">{posts.length}</span> Moments
                   </div>
              </div>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-soft-border mb-6">
          <button className="px-4 py-3 text-sm font-medium text-accent border-b-2 border-accent">Moments</button>
          <button className="px-4 py-3 text-sm font-medium text-gray-400 hover:text-primary transition">Reposts</button>
      </div>

      {/* Posts Grid */}
      <div className="space-y-6">
          {posts.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                  <p>This soul is quiet for now.</p>
              </div>
          ) : (
              posts.map((post, i) => (
                <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-surface p-6 rounded-xl border border-soft-border hover:shadow-sm transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                         <span className="text-sm font-semibold text-accent">{identity.name}</span>
                         <span className="text-xs text-gray-400">• {formatDistanceToNow(new Date(post.createdAt))} ago</span>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 text-[10px] rounded uppercase tracking-wider text-gray-500">{post.type}</span>
                  </div>

                  {post.title && <h3 className="text-lg font-serif mb-2 text-accent">{post.title}</h3>}
                  <div className="text-gray-600 leading-relaxed whitespace-pre-wrap font-serif text-sm mb-4">
                      {post.content}
                  </div>
                </motion.div>
              ))
          )}
      </div>
    </div>
  );
};

export default Profile;
