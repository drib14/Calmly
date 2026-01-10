import React, { useState } from 'react';
import { Send, Image as ImageIcon, X, ShieldAlert, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import CommentItem from './CommentItem';
import MediaPlayer from './MediaPlayer';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';

const CommentsSection = ({
    comments,
    postId,
    mutateComments,
    isOwner,
    identities,
    currentIdentity,
    openViewer
}) => {
  const [newComment, setNewComment] = useState('');
  const [commentMedia, setCommentMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleCommentFile = (e) => {
      const file = e.target.files[0];
      if (file) {
          setCommentMedia(file);
          setMediaPreview(URL.createObjectURL(file));
      }
  };

  const submitComment = async () => {
      if (!newComment.trim() && !commentMedia) return;
      if (!currentIdentity) return toast.error("Select an identity first");

      if (currentIdentity.user?.restrictions?.comment) {
          return toast.error("Account restricted from commenting");
      }

      setSubmittingComment(true);
      try {
          const formData = new FormData();
          formData.append('content', newComment);
          formData.append('identityId', currentIdentity._id);
          if (commentMedia) formData.append('media', commentMedia);
          if (replyTo) formData.append('parentCommentId', replyTo.id);

          await axios.post(`/comments/${postId}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });

          setNewComment('');
          setCommentMedia(null);
          setMediaPreview(null);
          setReplyTo(null);

          mutateComments();
          toast.success(replyTo ? "Reply sent" : "Comment added");
      } catch (err) {
          console.error(err);
          toast.error("Failed to post comment");
      } finally {
          setSubmittingComment(false);
      }
  };

  return (
      <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-4 p-1">
              {!comments ? (
                  <div className="text-center py-4 text-secondary text-xs">Loading comments...</div>
              ) : comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 opacity-60">
                      <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mb-2 shadow-sm border border-soft-border">
                          <MessageSquare size={20} className="text-secondary" />
                      </div>
                      <p className="text-xs font-bold text-text">No comments yet</p>
                      <p className="text-[10px] text-secondary">Start the conversation nicely.</p>
                  </div>
              ) : (
                  comments.map(c => (
                    <CommentItem
                        key={c._id}
                        comment={c}
                        postId={postId}
                        onReply={(comment) => setReplyTo({ id: comment._id, name: comment.identity.name })}
                        openViewer={openViewer}
                        mutateComments={mutateComments}
                        isOwner={isOwner}
                        identities={identities}
                    />
                  ))
              )}
          </div>

          <div className="pt-2 border-t border-soft-border">
              {/* Comment Media Preview */}
              {mediaPreview && (
                  <div className="mb-2 relative inline-block">
                      <img src={mediaPreview} className="h-16 w-16 object-cover rounded-lg border border-soft-border" />
                      <button onClick={() => { setCommentMedia(null); setMediaPreview(null); }} className="absolute -top-1 -right-1 bg-black text-white rounded-full p-0.5">
                          <X size={10} />
                      </button>
                  </div>
              )}

              {/* Reply Indicator */}
              {replyTo && (
                  <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 p-2 px-3 rounded-lg mb-2 text-xs text-blue-600 dark:text-blue-300">
                      <span>Replying to <b>{replyTo.name}</b></span>
                      <button onClick={() => setReplyTo(null)}><X size={12}/></button>
                  </div>
              )}

              {currentIdentity?.user?.restrictions?.comment ? (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center">
                      <p className="text-xs font-bold text-red-400 flex items-center justify-center gap-2">
                          <ShieldAlert size={14} />
                          You are restricted from commenting.
                      </p>
                      <Link to="/learn-more" className="text-[10px] text-red-300 hover:underline mt-1 block">Learn More</Link>
                  </div>
              ) : (
                  <div className="flex items-center space-x-2 bg-surface p-1.5 pl-2 rounded-full border border-soft-border focus-within:ring-2 ring-slate-100 dark:ring-slate-700 transition-shadow">
                      <label className="p-2 cursor-pointer text-secondary hover:text-text transition rounded-full hover:bg-background active:scale-95">
                          <input type="file" className="hidden" accept="image/*,video/*" onChange={handleCommentFile} />
                          <ImageIcon size={18} />
                      </label>
                      <input
                        className="flex-1 text-sm bg-transparent outline-none placeholder:text-secondary text-text"
                        placeholder={replyTo ? "Write a reply..." : "Send a supportive message..."}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                      />
                      <button
                        onClick={submitComment}
                        disabled={submittingComment}
                        className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-full flex items-center justify-center text-white dark:text-slate-900 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 active:scale-95"
                      >
                          <Send size={14} className="-ml-0.5 mt-0.5 text-white dark:text-slate-900" />
                      </button>
                  </div>
              )}
          </div>
      </div>
  );
};

export default CommentsSection;
