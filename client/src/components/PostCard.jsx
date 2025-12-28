import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Heart, Repeat, MoreHorizontal, Send, Trash2, Flag, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useIdentity } from '../context/IdentityContext';
import Avatar from './Avatar';
import MediaPlayer from './MediaPlayer';

const PostCard = ({ post, mutate }) => {
  const { currentIdentity, identities } = useIdentity();
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [showAnonError, setShowAnonError] = useState(false);
  const navigate = useNavigate();

  const isLiked = post.likes?.some(l => l.identity === currentIdentity?._id || l.identity?._id === currentIdentity?._id);
  const isReposted = post.reposts?.some(r => r.identity === currentIdentity?._id || r.identity?._id === currentIdentity?._id);
  const isOwner = post.identity._id === currentIdentity?._id;

  const handleLike = async () => {
      if (!currentIdentity) return alert("Select an identity first");
      try {
          await axios.put(`/posts/${post._id}/like`, { identityId: currentIdentity._id });
          mutate();
      } catch (err) { console.error(err); }
  };

  const handleRepost = async () => {
      if (!currentIdentity) return alert("Select an identity first");
      setIsReposting(true);
      try {
          await axios.put(`/posts/${post._id}/repost`, { identityId: currentIdentity._id });
          mutate();
      } catch (err) { console.error(err); }
      finally { setIsReposting(false); }
  };

  const toggleComments = async () => {
      setExpanded(!expanded);
      if (!expanded && comments.length === 0) {
          setLoadingComments(true);
          try {
              const res = await axios.get(`/comments/${post._id}`);
              setComments(res.data);
          } catch (err) { console.error(err); }
          finally { setLoadingComments(false); }
      }
  };

  const submitComment = async () => {
      if (!newComment.trim()) return;
      try {
          await axios.post(`/comments/${post._id}`, {
              content: newComment,
              identityId: currentIdentity._id
          });
          setNewComment('');
          const res = await axios.get(`/comments/${post._id}`);
          setComments(res.data);
      } catch (err) { console.error(err); }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
      // Add delete logic here (API Call)
      try {
          // await axios.delete(`/posts/${post._id}`); // Placeholder for logic
          alert("Deleted (Mock)");
      } catch (err) { console.error(err); }
      setShowDeleteModal(false);
  };

  const handleProfileClick = (e) => {
      e.stopPropagation();
      // Ensure we have identities loaded
      if (!identities) return;

      const isMyPost = identities.some(i => i._id === post.identity._id);

      if (post.identity.type === 'anonymous') {
          if (!isMyPost) {
              setShowAnonError(true);
              return;
          }
      }

      if (post.identity.handle) {
          navigate(`/profile/${post.identity.handle.replace('@', '')}`);
      }
  };

  return (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6 relative overflow-hidden"
    >
      {/* Repost Indicator */}
      {post.reposts && post.reposts.length > 0 && post.reposts[0].identity && (
          <div className="flex items-center space-x-2 mb-3 text-xs text-slate-400 font-medium">
              <Repeat size={12} />
              <span>Reposted by</span>
              <div className="flex items-center space-x-1">
                  <Avatar identity={post.reposts[0].identity} size="sm" />
                  <span>{post.reposts[0].identity.name}</span>
              </div>
              {post.reposts.length > 1 && <span>and {post.reposts.length - 1} others</span>}
          </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative">
        <div className="flex items-center space-x-3">
           <div onClick={handleProfileClick} className="cursor-pointer">
               <Avatar identity={post.identity} />
           </div>
           <div>
               <p onClick={handleProfileClick} className="text-sm font-bold text-slate-800 cursor-pointer hover:underline decoration-slate-400 underline-offset-2">
                   {post.identity.name}
               </p>
               <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">
                   {post.identity.type} • {formatDistanceToNow(new Date(post.createdAt))} ago
               </p>
           </div>
        </div>

        <button onClick={() => setShowOptions(!showOptions)} className="text-slate-300 hover:text-slate-600 transition p-2">
            <MoreHorizontal size={20} />
        </button>

        {showOptions && (
            <div className="absolute right-0 top-8 bg-white border border-slate-100 shadow-lg rounded-xl p-1 z-10 min-w-[120px]">
                {isOwner ? (
                    <button onClick={() => setShowDeleteModal(true)} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 size={14} /> <span>Delete</span>
                    </button>
                ) : (
                    <button className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg">
                        <Flag size={14} /> <span>Report</span>
                    </button>
                )}
            </div>
        )}
      </div>

      {/* Content */}
      <div className="pl-13">
          {post.type === 'letter' ? (
              <div className={`p-6 rounded-lg mb-4 shadow-sm border border-amber-100 ${post.letterFields?.paperType === 'classic' ? 'bg-amber-50' : 'bg-white'}`}>
                  <div className="font-serif text-amber-900 text-lg font-bold mb-4">{post.letterFields?.header}</div>
                  <div className="font-serif text-amber-900 text-base leading-loose whitespace-pre-wrap mb-6">{post.content}</div>
                  <div className="font-serif text-amber-900 text-lg font-bold text-right">{post.letterFields?.footer}</div>
              </div>
          ) : post.type === 'poetry' ? (
              <div className={`p-8 rounded-lg mb-4 shadow-sm ${post.style?.backgroundColor} ${post.style?.align}`}>
                  {post.title && <h3 className="text-2xl font-serif font-bold mb-4">{post.title}</h3>}
                  <div className={`whitespace-pre-wrap leading-relaxed text-lg ${post.style?.font}`}>{post.content}</div>
              </div>
          ) : (
              <>
                  {post.title && <h3 className="text-lg font-serif font-bold mb-2 text-slate-900">{post.title}</h3>}
                  <div className="text-slate-700 leading-relaxed whitespace-pre-wrap font-serif text-[15px] mb-4">
                      {post.content}
                  </div>

                  {/* Media Grid */}
                  {post.media && post.media.length > 0 && (
                      <div className={clsx("grid gap-2 mb-4 rounded-2xl overflow-hidden", post.media.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                          {post.media.map((file, idx) => (
                              file.type === 'video' ? (
                                  <MediaPlayer key={idx} src={file.url} />
                              ) : (
                                  <img key={idx} src={file.url} className="w-full h-full object-cover aspect-square" />
                              )
                          ))}
                      </div>
                  )}
              </>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
                  {post.mood}
              </span>
          </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex space-x-6">
              <button
                onClick={handleLike}
                className={clsx(
                    "flex items-center space-x-2 transition group",
                    isLiked ? "text-red-500" : "text-slate-500 hover:text-red-500"
                )}
              >
                  <Heart size={20} className={clsx("transition-transform group-active:scale-90", isLiked && "fill-current")} />
                  <span className="text-xs font-bold">{post.likes?.length || 0}</span>
              </button>

              <button
                onClick={toggleComments}
                className="flex items-center space-x-2 text-slate-500 hover:text-blue-500 transition group"
              >
                  <MessageCircle size={20} />
                  <span className="text-xs font-bold">{comments.length > 0 ? comments.length : (post.commentCount || 0)}</span>
              </button>

              <button
                onClick={handleRepost}
                className={clsx("flex items-center space-x-2 transition group", isReposted ? "text-green-500" : "text-slate-500 hover:text-green-500")}
              >
                  <Repeat size={20} className={clsx("transition-transform", isReposting && "animate-spin")} />
                  <span className="text-xs font-bold">{post.reposts?.length || 0}</span>
              </button>
          </div>
      </div>

      {/* Comments Area */}
      <AnimatePresence>
          {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                  <div className="mt-4 pt-4 border-t border-slate-50 bg-slate-50/50 -mx-6 px-6 pb-6">
                      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                          {comments.map(c => (
                              <div key={c._id} className="flex space-x-3">
                                  <Avatar identity={c.identity} size="sm" />
                                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm border border-slate-100">
                                      <span className="font-bold text-slate-800 text-xs block mb-1">{c.identity.name}</span>
                                      <span className="text-slate-600">{c.content}</span>
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div className="flex items-center space-x-2 bg-white p-1.5 pl-4 rounded-full border border-slate-200 focus-within:ring-2 ring-slate-100 transition-shadow">
                          <input
                            className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400"
                            placeholder="Send a supportive message..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                          />
                          <button
                            onClick={submitComment}
                            className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform"
                          >
                              <Send size={14} className="-ml-0.5 mt-0.5 text-white" />
                          </button>
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Anon Error Modal */}
      <AnimatePresence>
          {showAnonError && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-center rounded-3xl"
              >
                  <div onClick={(e) => e.stopPropagation()}>
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <User size={24} className="text-slate-400" />
                      </div>
                      <h3 className="text-lg font-serif font-bold text-slate-800">Identity Protected</h3>
                      <p className="text-sm text-slate-500 mt-2">This user has chosen to remain anonymous. Their profile is hidden to respect their safe space.</p>
                      <button onClick={() => setShowAnonError(false)} className="mt-4 text-xs font-bold text-slate-900 hover:underline">Close</button>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
          {showDeleteModal && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                onClick={() => setShowDeleteModal(false)}
              >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                          <Trash2 size={24} />
                      </div>
                      <h3 className="text-xl font-serif font-bold text-slate-900 mb-2">Delete this moment?</h3>
                      <p className="text-slate-500 text-sm mb-6">This action cannot be undone. Are you sure you want to let this go?</p>

                      <div className="flex space-x-3">
                          <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition">Cancel</button>
                          <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition">Delete</button>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PostCard;
