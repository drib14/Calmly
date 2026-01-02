import React, { useState } from 'react';
import { X, MessageCircle, Repeat, Heart, MoreHorizontal, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from './Avatar';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useIdentity } from '../context/IdentityContext';

const GlobalPostViewer = ({ isOpen, onClose, post, onNext, onPrev }) => {
    const { user } = useAuth();
    const { currentIdentity } = useIdentity();
    const [commentText, setCommentText] = useState('');

    if (!isOpen || !post) return null;

    const isOwner = post.identity?.user === user?._id; // Simplified check

    const handleHide = async () => {
        try {
            if (isOwner) {
                // Archive logic
                await axios.put(`/posts/${post._id}/archive`); // Assume endpoint exists or visibility=private
                toast.success("Archived");
            } else {
                // Hide logic
                await axios.post(`/posts/${post._id}/hide`);
                toast.success("Post hidden");
            }
            onClose();
        } catch (e) {
            toast.error("Failed");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white z-50 p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>

                    <div className="flex w-full h-full max-w-6xl">
                        {/* Media Section */}
                        <div className="flex-1 bg-black flex items-center justify-center relative">
                            {post.media && post.media.length > 0 ? (
                                <img src={post.media[0].url} className="max-h-full max-w-full object-contain" />
                            ) : (
                                <div className="text-white text-center p-10 font-serif text-2xl">
                                    {post.content}
                                </div>
                            )}
                        </div>

                        {/* Sidebar Interactions */}
                        <div className="w-[400px] bg-white h-full flex flex-col border-l border-gray-800">
                            {/* Header */}
                            <div className="p-4 border-b flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Avatar identity={post.identity} size="sm" />
                                    <div>
                                        <p className="font-bold text-sm">{post.identity.name}</p>
                                        <p className="text-xs text-gray-500">{post.identity.handle}</p>
                                    </div>
                                </div>
                                <button onClick={handleHide} className="text-gray-400 hover:text-black"><MoreHorizontal /></button>
                            </div>

                            {/* Content (if media exists, show content here too) */}
                            <div className="p-4 flex-1 overflow-y-auto">
                                {post.media?.length > 0 && <p className="mb-4 text-sm">{post.content}</p>}

                                {/* Comments Placeholder */}
                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Comments</p>
                                    <div className="text-center text-gray-500 text-sm py-10">
                                        No comments yet.
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-4 border-t bg-gray-50">
                                <div className="flex justify-between mb-4">
                                     <div className="flex space-x-4">
                                        <button className="flex items-center space-x-1 text-gray-600 hover:text-red-500">
                                            <Heart size={20} />
                                            <span className="text-xs">{post.likes?.length || 0}</span>
                                        </button>
                                        <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-500">
                                            <MessageCircle size={20} />
                                            <span className="text-xs">{post.commentCount || 0}</span>
                                        </button>
                                        <button className="flex items-center space-x-1 text-gray-600 hover:text-green-500">
                                            <Repeat size={20} />
                                            <span className="text-xs">{post.reposts?.length || 0}</span>
                                        </button>
                                     </div>
                                     <button className="text-gray-600"><Share2 size={20} /></button>
                                </div>
                                <div className="flex space-x-2">
                                    <input
                                        className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                                        placeholder="Add a comment..."
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                    />
                                    <button className="text-slate-900 font-bold text-sm px-2">Post</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default GlobalPostViewer;
