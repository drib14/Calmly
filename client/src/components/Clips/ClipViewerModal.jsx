import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, MessageCircle, ChevronLeft, ChevronRight, Pause, Play, MoreVertical, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../Avatar';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useIdentity } from '../../context/IdentityContext';

const ClipViewerModal = ({ isOpen, onClose, clips, initialIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const videoRef = useRef(null);

    const { currentIdentity } = useIdentity();

    // Safety check
    const currentClip = clips && clips[currentIndex];
    const isOwner = currentClip?.identity?._id === currentIdentity?._id;

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setProgress(0);
            setIsPaused(false);
            if (currentClip) markViewed(currentClip._id);
        }
    }, [isOpen, initialIndex]);

    useEffect(() => {
        if (isOpen && currentClip) {
            markViewed(currentClip._id);
            setProgress(0);
        }
    }, [currentIndex, currentClip]);

    const markViewed = async (id) => {
        try {
            await axios.post(`/clips/${id}/view`, { identityId: currentIdentity._id });
        } catch (e) { console.error(e); }
    };

    // Timer Logic
    useEffect(() => {
        if (!isOpen || !currentClip || isPaused) return;

        let interval;
        if (currentClip.mediaType === 'video') {
            // Video handles its own progress via onTimeUpdate
            if (videoRef.current) {
                videoRef.current.play().catch(e => console.log("Autoplay prevented", e));
            }
        } else {
            // Image timer
            const duration = 5000;
            const stepTime = 50;
            const step = (stepTime / duration) * 100;
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        handleNext();
                        return 0;
                    }
                    return prev + step;
                });
            }, stepTime);
        }

        return () => clearInterval(interval);
    }, [isOpen, currentClip, isPaused, currentIndex]);

    const handleVideoProgress = () => {
        if (videoRef.current) {
            const val = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(val);
            if (val >= 100) handleNext();
        }
    };

    const handleNext = () => {
        if (currentIndex < clips.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`/clips/${currentClip._id}`);
            toast.success("Clip deleted");
            onClose();
            // In a real app, we'd remove it from the list and stay open
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    if (!isOpen || !currentClip) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative w-full h-full md:w-[400px] md:h-[80vh] bg-black md:rounded-2xl overflow-hidden flex flex-col"
                    >
                        {/* Progress Bars */}
                        <div className="absolute top-0 left-0 right-0 z-30 flex space-x-1 p-2">
                             {/* We only show progress for current user's current session or simple single bar?
                                Usually stories show bars for all clips of the *current user*.
                                Here `clips` is a flat list of ALL clips from everyone or just the active flow.
                                If `clips` is the playlist, we show segments for the current USER'S clips?
                                Or just one bar? Facebook/Insta show bars for the current user's story set.
                                Complex. Let's show one bar per clip in the current "User Block" if we had blocks.
                                Since we flattened the list, let's just show a single bar for the current clip for simplicity
                                or bars for the current *Identity's* clips if we grouped them.
                             */}
                             {/* Simplified: One bar for current clip */}
                            <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white transition-all duration-100 ease-linear"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Header */}
                        <div className="absolute top-4 left-4 z-30 flex items-center space-x-2">
                            <Avatar identity={currentClip.identity} size="sm" />
                            <span className="text-white font-bold text-sm shadow-black drop-shadow-md">
                                {currentClip.identity.name}
                            </span>
                            <span className="text-white/70 text-xs">
                                {new Date(currentClip.createdAt).toLocaleTimeString([], { hour: 'numeric', minute:'2-digit'})}
                            </span>
                        </div>

                        {/* Controls */}
                        <div className="absolute top-4 right-4 z-30 flex items-center space-x-4">
                            {isOwner && (
                                <button onClick={() => setShowMenu(!showMenu)} className="text-white hover:text-gray-200">
                                    <MoreVertical size={24} />
                                </button>
                            )}
                            <button onClick={onClose} className="text-white hover:text-gray-200">
                                <X size={28} />
                            </button>
                        </div>

                        {/* Menu Dropdown */}
                        {showMenu && (
                            <div className="absolute top-12 right-4 z-40 bg-white rounded-lg shadow-xl py-2 w-32 text-slate-900 text-sm">
                                <button onClick={() => setConfirmDelete(true)} className="flex items-center space-x-2 px-4 py-2 hover:bg-red-50 text-red-500 w-full text-left">
                                    <Trash2 size={16} /> <span>Delete</span>
                                </button>
                            </div>
                        )}

                        {/* Confirm Overlay */}
                        {confirmDelete && (
                             <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
                                 <div className="bg-white rounded-xl p-4 text-center mx-8">
                                     <h3 className="font-bold text-slate-900 mb-2">Delete Clip?</h3>
                                     <div className="flex space-x-2">
                                         <button onClick={() => setConfirmDelete(false)} className="flex-1 px-3 py-2 bg-gray-200 rounded-lg text-sm font-bold text-slate-700">Cancel</button>
                                         <button onClick={handleDelete} className="flex-1 px-3 py-2 bg-red-500 rounded-lg text-sm font-bold text-white">Delete</button>
                                     </div>
                                 </div>
                             </div>
                        )}

                        {/* Main Media */}
                        <div className="flex-1 relative flex items-center justify-center bg-gray-900">
                            {currentClip.mediaType === 'video' ? (
                                <video
                                    ref={videoRef}
                                    src={currentClip.mediaUrl}
                                    className="w-full h-full object-contain"
                                    playsInline
                                    onTimeUpdate={handleVideoProgress}
                                    onEnded={handleNext}
                                    onClick={() => setIsPaused(!isPaused)}
                                />
                            ) : (
                                <img
                                    src={currentClip.mediaUrl}
                                    className="w-full h-full object-contain"
                                    onClick={() => setIsPaused(!isPaused)}
                                />
                            )}

                            {/* Tap Areas */}
                            <div className="absolute inset-y-0 left-0 w-1/4 z-20" onClick={handlePrev}></div>
                            <div className="absolute inset-y-0 right-0 w-1/4 z-20" onClick={handleNext}></div>
                        </div>

                        {/* Footer / Reply */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 z-30 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="text"
                                    placeholder="Reply..."
                                    className="flex-1 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 text-sm text-white placeholder-white/70 border border-white/30 focus:outline-none focus:bg-white/30"
                                    onFocus={() => setIsPaused(true)}
                                    onBlur={() => setIsPaused(false)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            toast.success("Reply sent");
                                            e.target.value = "";
                                            e.target.blur();
                                        }
                                    }}
                                />
                                <button className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30">
                                    <Heart size={20} />
                                </button>
                                <button className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30">
                                    <MessageCircle size={20} />
                                </button>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ClipViewerModal;
