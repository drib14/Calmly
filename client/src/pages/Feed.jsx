import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Heart, Share2, MoreHorizontal, User, ChevronDown } from 'lucide-react';
import { useIdentity } from '../context/IdentityContext';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import clsx from 'clsx';

const fetcher = url => axios.get(url).then(res => res.data);

const Feed = () => {
  const [filter, setFilter] = useState({ type: '', mood: '' });
  const [expandedPost, setExpandedPost] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const { currentIdentity } = useIdentity();

  // Real-time feed polling
  const { data: posts, error, isLoading, mutate } = useSWR(
      `/posts/feed?type=${filter.type}&mood=${filter.mood}`,
      fetcher,
      { refreshInterval: 10000 }
  );

  const handleLike = async (postId) => {
      if (!currentIdentity) return alert("Select an identity first");
      const updatedPosts = posts.map(p => {
          if (p._id === postId) {
              const hasLiked = p.likes?.includes(currentIdentity._id);
              return {
                  ...p,
                  likes: hasLiked
                      ? p.likes.filter(id => id !== currentIdentity._id)
                      : [...(p.likes || []), currentIdentity._id]
              };
          }
          return p;
      });
      mutate(updatedPosts, false);
      try {
          await axios.put(`/posts/${postId}/like`, { identityId: currentIdentity._id });
          mutate();
      } catch (err) { console.error(err); }
  };

  const toggleComments = async (postId) => {
      if (expandedPost === postId) {
          setExpandedPost(null);
      } else {
          setExpandedPost(postId);
          if (!comments[postId]) fetchComments(postId);
      }
  };

  const fetchComments = async (postId) => {
      try {
          const res = await axios.get(`/comments/${postId}`);
          setComments(prev => ({ ...prev, [postId]: res.data }));
      } catch (err) { console.error(err); }
  };

  const handleCommentLike = async (commentId, postId) => {
      if (!currentIdentity) return alert("Select an identity first");
      try {
          await axios.put(`/comments/${commentId}/like`, { identityId: currentIdentity._id });
          fetchComments(postId); // Re-fetch to update deep nested state
      } catch (err) { console.error(err); }
  };

  const postComment = async (postId) => {
      if (!newComment.trim() || !currentIdentity) return;
      try {
          const res = await axios.post(`/comments/${postId}`, {
              content: newComment,
              identityId: currentIdentity._id,
              parentId: replyingTo
          });

          setNewComment('');
          setReplyingTo(null);
          fetchComments(postId);
      } catch (err) {
          console.error(err);
          alert("Failed to post comment");
      }
  };

  const CommentItem = ({ comment, postId, depth = 0 }) => {
      const [showReplies, setShowReplies] = useState(false);
      const isLiked = comment.likes?.includes(currentIdentity?._id);

      return (
          <div className={clsx("flex space-x-3 text-sm group mb-3", depth > 0 && "ml-8")}>
              <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-[10px] text-slate-500">
                  {comment.identity.avatar ? <img src={comment.identity.avatar} className="w-full h-full rounded-full"/> : comment.identity.name[0]}
              </div>
              <div className="flex-1">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                      <span className="font-bold text-slate-700 text-xs block mb-1">{comment.identity.name}</span>
                      <span className="text-slate-600">{comment.content}</span>
                  </div>

                  {/* Comment Actions */}
                  <div className="flex items-center space-x-4 mt-1 ml-2 text-[10px] text-slate-400 font-medium">
                      <span>{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                      <button onClick={() => handleCommentLike(comment._id, postId)} className={clsx("hover:text-red-500", isLiked && "text-red-500")}>
                          {isLiked ? 'Liked' : 'Like'} {comment.likes?.length > 0 && `(${comment.likes.length})`}
                      </button>
                      <button onClick={() => setReplyingTo(comment._id)} className="hover:text-slate-600">Reply</button>
                  </div>

                  {/* Replies */}
                  {comment.replies?.length > 0 && (
                      <div className="mt-2">
                          <button
                            onClick={() => setShowReplies(!showReplies)}
                            className="flex items-center space-x-1 text-[11px] text-slate-500 hover:text-slate-800 font-medium"
                          >
                              <div className="w-6 h-[1px] bg-slate-300 mr-1"></div>
                              <span>{showReplies ? 'Hide' : `View ${comment.replies.length}`} replies</span>
                              <ChevronDown size={12} className={clsx("transition-transform", showReplies && "rotate-180")} />
                          </button>

                          <AnimatePresence>
                              {showReplies && (
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                      {comment.replies.map(reply => (
                                          <CommentItem key={reply._id} comment={reply} postId={postId} depth={depth + 1} />
                                      ))}
                                  </motion.div>
                              )}
                          </AnimatePresence>
                      </div>
                  )}
              </div>
          </div>
      );
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
                      <button
                        onClick={() => handleLike(post._id)}
                        className={clsx(
                            "flex items-center space-x-2 transition group",
                            post.likes?.includes(currentIdentity?._id) ? "text-red-500" : "text-slate-400 hover:text-red-500"
                        )}
                      >
                          <Heart size={20} className={clsx("group-hover:scale-110 transition-transform", post.likes?.includes(currentIdentity?._id) && "fill-current")} />
                          <span className="text-xs font-medium">{post.likes?.length || 0}</span>
                      </button>
                      <button
                        onClick={() => toggleComments(post._id)}
                        className="flex items-center space-x-2 text-slate-400 hover:text-blue-500 transition group"
                      >
                          <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-medium">{comments[post._id]?.length || '0'}</span>
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
                      <div className="space-y-1 mb-4 max-h-80 overflow-y-auto custom-scrollbar">
                          {comments[post._id]?.map(comment => (
                              <CommentItem key={comment._id} comment={comment} postId={post._id} />
                          ))}
                          {comments[post._id]?.length === 0 && <p className="text-xs text-slate-400 italic pl-2">Be the first to listen.</p>}
                      </div>

                      <div className="flex items-center space-x-2 bg-white p-2 rounded-full border border-slate-200 shadow-sm">
                          <input
                            type="text"
                            className="flex-1 text-sm px-4 py-1 outline-none bg-transparent placeholder-slate-400"
                            placeholder={replyingTo ? "Write a reply..." : "Write a supportive comment..."}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          />
                          {replyingTo && <button onClick={() => setReplyingTo(null)} className="text-xs text-red-400 px-2">Cancel Reply</button>}
                          <button
                            onClick={() => postComment(post._id)}
                            className="bg-slate-800 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-700 transition"
                            disabled={!newComment.trim()}
                          >
                              <Share2 size={14} className="rotate-90 md:rotate-0" />
                          </button>
                      </div>
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
