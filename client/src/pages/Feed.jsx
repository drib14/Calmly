import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Heart, Share2, MoreHorizontal, User } from 'lucide-react';
import { useIdentity } from '../context/IdentityContext';
import { motion } from 'framer-motion';
import useSWR from 'swr';

const fetcher = url => axios.get(url).then(res => res.data);

const Feed = () => {
  const [filter, setFilter] = useState({ type: '', mood: '' });
  const [expandedPost, setExpandedPost] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const { currentIdentity } = useIdentity();

  // Real-time feed polling
  const { data: posts, error, isLoading } = useSWR(
      `/posts/feed?type=${filter.type}&mood=${filter.mood}`,
      fetcher,
      { refreshInterval: 10000 }
  );

  const toggleComments = async (postId) => {
      if (expandedPost === postId) {
          setExpandedPost(null);
      } else {
          setExpandedPost(postId);
          if (!comments[postId]) {
              try {
                  const res = await axios.get(`/comments/${postId}`);
                  setComments(prev => ({ ...prev, [postId]: res.data }));
              } catch (err) {
                  console.error(err);
              }
          }
      }
  };

  const postComment = async (postId) => {
      if (!newComment.trim() || !currentIdentity) return;
      try {
          const res = await axios.post(`/comments/${postId}`, {
              content: newComment,
              identityId: currentIdentity._id
          });
          setComments(prev => ({
              ...prev,
              [postId]: [...(prev[postId] || []), res.data]
          }));
          setNewComment('');
      } catch (err) {
          console.error(err);
          alert("Failed to post comment");
      }
  };

  return (
    <div className="max-w-xl mx-auto pb-20">
      {/* Header & Filters */}
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-slate-50 z-30 py-4 border-b border-transparent">
        <h1 className="text-2xl font-serif font-bold text-slate-800">Moments</h1>

        <div className="flex space-x-2">
           <select
             className="border-none bg-white rounded-full px-4 py-2 text-sm shadow-sm text-slate-600 focus:ring-2 focus:ring-slate-200 cursor-pointer hover:bg-slate-100 transition"
             onChange={(e) => setFilter({...filter, type: e.target.value})}
           >
             <option value="">All Types</option>
             <option value="confession">Confession</option>
             <option value="poetry">Poetry</option>
             <option value="letter">Letter</option>
             <option value="mood">Mood</option>
           </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
            {[1,2,3].map(i => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-48 animate-pulse"></div>
            ))}
        </div>
      ) : posts?.length === 0 ? (
        <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PenTool size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 mb-4">It's quiet here.</p>
            <a href="/create" className="text-slate-800 font-semibold hover:underline">Share a moment</a>
        </div>
      ) : (
        <div className="space-y-6">
          {posts?.map((post) => (
            <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300"
            >
              {/* Post Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shadow-inner">
                       {post.identity.avatar ? (
                           <img src={post.identity.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                       ) : (
                           <User size={18} />
                       )}
                   </div>
                   <div>
                       <p className="text-sm font-bold text-slate-800">{post.identity.name}</p>
                       <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">
                           {post.identity.type} • {formatDistanceToNow(new Date(post.createdAt))} ago
                       </p>
                   </div>
                </div>
                <button className="text-slate-300 hover:text-slate-600 transition">
                    <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="pl-13">
                  {post.title && <h3 className="text-lg font-serif font-bold mb-2 text-slate-900">{post.title}</h3>}
                  <div className="text-slate-600 leading-relaxed whitespace-pre-wrap font-serif text-[15px] mb-4">
                      {post.content}
                  </div>

                  {/* Tags & Mood */}
                  <div className="flex flex-wrap gap-2 mb-6">
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100 flex items-center">
                          {post.mood}
                      </span>
                      <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-xs font-medium border border-slate-100">
                          {post.type}
                      </span>
                  </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex space-x-6">
                      <button className="flex items-center space-x-2 text-slate-400 hover:text-red-500 transition group">
                          <Heart size={20} className="group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-medium">Like</span>
                      </button>
                      <button
                        onClick={() => toggleComments(post._id)}
                        className="flex items-center space-x-2 text-slate-400 hover:text-blue-500 transition group"
                      >
                          <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-medium">Comment</span>
                      </button>
                      <button className="flex items-center space-x-2 text-slate-400 hover:text-green-500 transition group">
                          <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-medium">Repost</span>
                      </button>
                  </div>
              </div>

              {/* Comments Section */}
              {expandedPost === post._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 pt-4 border-t border-slate-50 bg-slate-50/50 -mx-6 px-6 pb-6 rounded-b-3xl"
                  >
                      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                          {comments[post._id]?.map(comment => (
                              <div key={comment._id} className="flex space-x-3 text-sm group">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-[10px]">
                                      {comment.identity.name[0]}
                                  </div>
                                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                                      <span className="font-bold text-slate-700 text-xs block mb-1">{comment.identity.name}</span>
                                      <span className="text-slate-600">{comment.content}</span>
                                  </div>
                              </div>
                          ))}
                          {comments[post._id]?.length === 0 && <p className="text-xs text-slate-400 italic">Be the first to listen.</p>}
                      </div>

                      <div className="flex items-center space-x-2 bg-white p-2 rounded-full border border-slate-200 shadow-sm">
                          <input
                            type="text"
                            className="flex-1 text-sm px-4 py-1 outline-none bg-transparent placeholder-slate-400"
                            placeholder="Write a supportive comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          />
                          <button
                            onClick={() => postComment(post._id)}
                            className="bg-slate-800 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-700 transition"
                            disabled={!newComment.trim()}
                          >
                              <Share2 size={14} className="rotate-90 md:rotate-0" /> {/* Send Icon equivalent */}
                          </button>
                      </div>
                      {!currentIdentity && <p className="text-[10px] text-red-400 mt-2 text-center">Select an identity to engage.</p>}
                  </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
