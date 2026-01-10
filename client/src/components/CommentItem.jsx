import React, { useState, useRef } from 'react';
import axios from 'axios';
import { MoreHorizontal, Trash2, Flag, Edit3, EyeOff, X, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useIdentity } from '../context/IdentityContext';
import { useAuth } from '../context/AuthContext';
import { useClickOutside } from '../hooks/useClickOutside';
import Avatar from './Avatar';
import MediaPlayer from './MediaPlayer';
import { formatShortTime } from '../utils/dateUtils';
import { toast } from 'react-hot-toast';
import Modal from './Modal';

const CommentItem = ({ comment, postId, onReply, openViewer, mutateComments, isOwner, identities }) => {
    const { currentIdentity } = useIdentity();
    const { user } = useAuth();
    const [showOptions, setShowOptions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);

    const optionsRef = useRef(null);
    useClickOutside(optionsRef, () => setShowOptions(false));

    // Check if the current user owns this comment or is Admin
    const isCommentOwner = identities?.some(id => String(id._id) === String(comment.identity._id));
    const isAdmin = user?.role === 'admin';
    const canDelete = isCommentOwner || isAdmin;
    const canHide = isCommentOwner || isAdmin;

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

    const handleCopy = () => {
        navigator.clipboard.writeText(comment.content);
        toast.success("Copied to clipboard");
        setShowOptions(false);
    };

    if (comment.hidden && !canHide) return null;

    const isCommentLiked = comment.likes?.some(id => id === currentIdentity?._id);

    return (
        <>
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
                    <div ref={optionsRef}>
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-text"
                        >
                            <MoreHorizontal size={14} />
                        </button>

                        {/* Desktop Options Menu (Popover) - Hidden on Mobile */}
                        <div className="hidden md:block">
                            <AnimatePresence>
                                {showOptions && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="absolute right-0 top-6 z-10 bg-surface border border-soft-border shadow-lg rounded-xl p-1 min-w-[140px]"
                                    >
                                        <button onClick={handleCopy} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg text-left">
                                            <Copy size={12} /> <span>Copy Text</span>
                                        </button>

                                        {isCommentOwner && (
                                            <button onClick={() => { setIsEditing(true); setShowOptions(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg text-left">
                                                <Edit3 size={12} /> <span>Edit</span>
                                            </button>
                                        )}

                                        {canHide && (
                                            <button onClick={() => { handleHide(); setShowOptions(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-text hover:bg-background rounded-lg text-left">
                                                <EyeOff size={12} /> <span>{comment.hidden ? 'Unhide' : 'Hide'}</span>
                                            </button>
                                        )}

                                        {canDelete && (
                                            <button onClick={() => { handleDelete(); setShowOptions(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-red-500 hover:bg-background rounded-lg text-left">
                                                <Trash2 size={12} /> <span>Delete</span>
                                            </button>
                                        )}

                                        {!isCommentOwner && (
                                            <button onClick={() => { handleReport('Inappropriate'); setShowOptions(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-xs font-medium text-red-500 hover:bg-background rounded-lg text-left">
                                                <Flag size={12} /> <span>Report</span>
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-4 mt-1 ml-2 text-[10px] text-secondary">
                    <span>{formatShortTime(comment.createdAt)}</span>
                    <button
                        onClick={handleLike}
                        className={clsx("font-bold hover:text-red-500 transition flex items-center space-x-1", isCommentLiked && "text-red-500")}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill={isCommentLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        <span>{comment.likes?.length || 0}</span>
                    </button>
                    <button onClick={() => onReply(comment)} className="font-bold hover:text-blue-500 transition">Reply</button>
                </div>
            </div>
        </div>

        {/* Mobile Drawer for Options */}
        <AnimatePresence>
            {showOptions && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowOptions(false)}
                        className="md:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="md:hidden fixed bottom-0 left-0 right-0 bg-surface rounded-t-3xl z-50 border-t border-soft-border shadow-2xl p-6 pb-safe"
                    >
                        <div className="w-12 h-1.5 bg-soft-border rounded-full mx-auto mb-6" />
                        <h3 className="text-center font-bold text-lg text-text mb-6">Comment Options</h3>

                        <div className="space-y-2">
                            <button onClick={handleCopy} className="w-full flex items-center space-x-3 p-4 bg-background rounded-2xl text-text font-medium active:scale-95 transition">
                                <div className="p-2 bg-surface rounded-full border border-soft-border"><Copy size={20} /></div>
                                <span>Copy Text</span>
                            </button>

                            {isCommentOwner && (
                                <button onClick={() => { setIsEditing(true); setShowOptions(false); }} className="w-full flex items-center space-x-3 p-4 bg-background rounded-2xl text-text font-medium active:scale-95 transition">
                                    <div className="p-2 bg-surface rounded-full border border-soft-border"><Edit3 size={20} /></div>
                                    <span>Edit Comment</span>
                                </button>
                            )}

                            {canHide && (
                                <button onClick={() => { handleHide(); setShowOptions(false); }} className="w-full flex items-center space-x-3 p-4 bg-background rounded-2xl text-text font-medium active:scale-95 transition">
                                    <div className="p-2 bg-surface rounded-full border border-soft-border"><EyeOff size={20} /></div>
                                    <span>{comment.hidden ? 'Unhide Comment' : 'Hide Comment'}</span>
                                </button>
                            )}

                            {!isCommentOwner && (
                                <button onClick={() => { handleReport('Inappropriate'); setShowOptions(false); }} className="w-full flex items-center space-x-3 p-4 bg-background rounded-2xl text-red-500 font-medium active:scale-95 transition">
                                    <div className="p-2 bg-red-50 rounded-full border border-red-100"><Flag size={20} /></div>
                                    <span>Report Comment</span>
                                </button>
                            )}

                            {canDelete && (
                                <button onClick={() => { handleDelete(); setShowOptions(false); }} className="w-full flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl text-red-500 font-bold active:scale-95 transition mt-2">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full"><Trash2 size={20} /></div>
                                    <span>Delete Comment</span>
                                </button>
                            )}
                        </div>

                        <button onClick={() => setShowOptions(false)} className="w-full mt-6 py-4 text-secondary font-bold text-sm active:opacity-70">
                            Cancel
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
        </>
    );
};

export default CommentItem;
