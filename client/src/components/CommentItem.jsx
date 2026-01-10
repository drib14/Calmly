import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MoreHorizontal, Trash2, Flag, Edit3, EyeOff, User, CornerUpLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useIdentity } from '../context/IdentityContext';
import Avatar from './Avatar';
import MediaPlayer from './MediaPlayer';
import { formatShortTime } from '../utils/dateUtils';
import { toast } from 'react-hot-toast';

const CommentItem = ({ comment, postId, onReply, openViewer, mutateComments, isOwner, identities }) => {
    const { currentIdentity } = useIdentity();
    const [showOptions, setShowOptions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);

    // Check if the current user owns this comment
    const isCommentOwner = identities?.some(id => id._id === comment.identity._id);

    const handleLike = async () => {
        if (!currentIdentity) return toast.error("Select an identity first");
        try {
            await axios.put(`/comments/${comment._id}/like`, { identityId: currentIdentity._id });
            mutateComments();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`/comments/${comment._id}`);
            mutateComments();
            toast.success("Comment deleted");
        } catch (err) { toast.error("Failed to delete"); }
    };

    const handleHide = async () => {
        try {
            await axios.put(`/comments/${comment._id}/hide`);
            mutateComments();
            toast.success("Comment visibility updated");
        } catch (err) { toast.error("Failed to update"); }
    };

    const handleEdit = async () => {
        if (!editContent.trim()) return;
        try {
            await axios.put(`/comments/${comment._id}`, { content: editContent });
            mutateComments();
            setIsEditing(false);
            toast.success("Comment updated");
        } catch (err) { toast.error("Failed to update"); }
    };

    const handleReport = async (reason) => {
        try {
            await axios.post(`/comments/${comment._id}/report`, { reason });
            toast.success("Report submitted");
        } catch (err) { toast.error("Failed to report"); }
    };

    if (comment.hidden && !isCommentOwner) return null;

    const isCommentLiked = comment.likes?.some(id => id === currentIdentity?._id);

    return (
        <div className={clsx("flex space-x-3 mb-4", comment.parentComment && "ml-8")}>
            <Avatar identity={comment.identity} size="sm" />
            <div className="flex-1 min-w-0">
                <div className="bg-surface p-3 rounded-2xl rounded-tl-none shadow-sm text-sm border border-soft-border inline-block max-w-full relative group">
                    <span className="font-bold text-text text-xs block mb-1">
                        {comment.identity.name}
                        {comment.hidden && <span className="ml-2 text-[10px] text-red-500 font-normal">(Hidden)</span>}
                    </span>

                    {isEditing ? (
                        <div className="min-w-[200px]">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-background border border-soft-border rounded-lg p-2 text-sm focus:outline-none mb-2"
                                rows={2}
                            />
                            <div className="flex justify-end space-x-2">
                                <button onClick={() => setIsEditing(false)} className="text-xs text-secondary hover:text-text">Cancel</button>
                                <button onClick={handleEdit} className="text-xs bg-slate-900 text-white px-2 py-1 rounded">Save</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {comment.content && <span className="text-secondary block whitespace-pre-wrap">{comment.content}</span>}
                            {comment.media && comment.media.length > 0 && (
                                <div className="mt-2 rounded-lg overflow-hidden max-w-[200px]">
                                    {comment.media[0].type === 'video' ? (
                                        <MediaPlayer src={comment.media[0].url} />
                                    ) : (
                                        <img
                                            src={comment.media[0].url}
                                            className="w-full h-full object-cover cursor-pointer"
                                            onClick={() => openViewer(comment.media[0].url)}
                                        />
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* 3 Dots Trigger */}
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-text"
                    >
                        <MoreHorizontal size={14} />
                    </button>

                    {/* Options Menu */}
                    <AnimatePresence>
                        {showOptions && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute right-0 top-6 z-10 bg-surface border border-soft-border shadow-lg rounded-xl p-1 min-w-[120px]"
                                onMouseLeave={() => setShowOptions(false)}
                            >
                                {isCommentOwner ? (
                                    <>
                                        <button onClick={() => { setIsEditing(true); setShowOptions(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg text-left">
                                            <Edit3 size={12} /> <span>Edit</span>
                                        </button>
                                        <button onClick={() => { handleHide(); setShowOptions(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg text-left">
                                            <EyeOff size={12} /> <span>{comment.hidden ? 'Unhide' : 'Hide'}</span>
                                        </button>
                                        <button onClick={() => { handleDelete(); setShowOptions(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-red-500 hover:bg-background rounded-lg text-left">
                                            <Trash2 size={12} /> <span>Delete</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => { handleReport('Inappropriate'); setShowOptions(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-red-500 hover:bg-background rounded-lg text-left">
                                            <Flag size={12} /> <span>Report</span>
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center space-x-4 mt-1 ml-2 text-[10px] text-secondary">
                    <span>{formatShortTime(comment.createdAt)}</span>
                    <button
                        onClick={handleLike}
                        className={clsx("font-bold hover:text-red-500 transition flex items-center space-x-1", isCommentLiked && "text-red-500")}
                    >
                        {/* Heart Icon SVG or Component */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill={isCommentLiked ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span>{comment.likes?.length || 0}</span>
                    </button>
                    <button
                        onClick={() => onReply(comment)}
                        className="font-bold hover:text-blue-500 transition"
                    >
                        Reply
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommentItem;
