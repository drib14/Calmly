import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, MessageCircle, ChevronLeft, ChevronRight, Pause, Play, MoreVertical, Trash2, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../Avatar';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useIdentity } from '../../context/IdentityContext';

const UnifiedViewerModal = ({ isOpen, onClose, stories, initialStoryIndex = 0 }) => {
    // Stories: Array of { identity, items: [ { type: 'quote'|'clip', ... } ] }
    const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [muted, setMuted] = useState(false);
    const videoRef = useRef(null);

    const { currentIdentity } = useIdentity();

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setCurrentStoryIndex(initialStoryIndex);
            setCurrentItemIndex(0);
            setProgress(0);
            setIsPaused(false);
        }
    }, [isOpen, initialStoryIndex]);

    const activeStory = stories[currentStoryIndex];
    const activeItem = activeStory?.items[currentItemIndex];
    const isOwner = activeItem?.identity?._id === currentIdentity?._id;

    // View Tracking
    useEffect(() => {
        if (isOpen && activeItem) {
            const endpoint = activeItem.type === 'quote'
                ? `/quotes/${activeItem._id}/view`
                : `/clips/${activeItem._id}/view`;
            axios.post(endpoint, { identityId: currentIdentity._id }).catch(() => {});
        }
    }, [activeItem, isOpen]);

    // Timer Logic
    useEffect(() => {
        if (!isOpen || !activeItem || isPaused) return;

        let interval;
        if (activeItem.type === 'clip' && activeItem.mediaType === 'video') {
            // Video handles its own progress via onTimeUpdate
            if (videoRef.current) {
                videoRef.current.play().catch(e => console.log("Autoplay prevented"));
            }
        } else {
            // Timer for Image/Quote (5s)
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
    }, [isOpen, activeItem, isPaused, currentStoryIndex, currentItemIndex]);

    const handleNext = () => {
        if (currentItemIndex < activeStory.items.length - 1) {
            // Next Item in same Story
            setCurrentItemIndex(prev => prev + 1);
            setProgress(0);
        } else if (currentStoryIndex < stories.length - 1) {
            // Next Story (User)
            setCurrentStoryIndex(prev => prev + 1);
            setCurrentItemIndex(0);
            setProgress(0);
        } else {
            // End
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentItemIndex > 0) {
            setCurrentItemIndex(prev => prev - 1);
            setProgress(0);
        } else if (currentStoryIndex > 0) {
            // Previous Story
            setCurrentStoryIndex(prev => prev - 1);
            // Go to last item of previous story? Or first? usually first.
            setCurrentItemIndex(0);
            setProgress(0);
        }
    };

    const handleVideoProgress = () => {
        if (videoRef.current && videoRef.current.duration) {
            const val = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(val);
            if (val >= 100) handleNext();
        }
    };

    if (!isOpen || !activeStory || !activeItem) return null;

    // Render Content
    const renderContent = () => {
        if (activeItem.type === 'quote') {
            // Quote Style
            // Note: In Dark mode, we want readability.
            // Using white cards for Quotes inside the Viewer (which is dark) is standard.
            // But we need to ensure text contrast if mood colors are used.
            // The `moodColors` defined here are light-background based.

            const moodColors = {
                'Neutral': 'bg-white text-slate-900',
                'Happy': 'bg-yellow-50 text-yellow-900',
                'Sad': 'bg-blue-50 text-blue-900',
                'Angry': 'bg-red-50 text-red-900',
                'Hopeful': 'bg-green-50 text-green-900',
                'Anxious': 'bg-purple-50 text-purple-900',
            };
            const style = moodColors[activeItem.mood] || moodColors['Neutral'];

            return (
                <div className={`w-full h-full flex flex-col items-center justify-center p-8 text-center ${style}`}>
                    <h2 className="text-2xl md:text-3xl font-serif font-medium leading-relaxed break-words max-w-full">
                        "{activeItem.content}"
                    </h2>
                </div>
            );
        } else {
            // Clip Style
            return (
                <div className="w-full h-full bg-black flex items-center justify-center relative">
                    {activeItem.mediaType === 'video' ? (
                        <video
                            ref={videoRef}
                            src={activeItem.mediaUrl}
                            className="w-full h-full object-contain"
                            playsInline
                            muted={muted}
                            onTimeUpdate={handleVideoProgress}
                            onEnded={handleNext}
                        />
                    ) : (
                        <img src={activeItem.mediaUrl} className="w-full h-full object-contain" />
                    )}
                </div>
            );
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex w-full max-w-6xl h-full md:h-[85vh] overflow-hidden"
                    >
                        {/* MAIN VIEWER (Left/Center) */}
                        <div className="flex-1 relative bg-black md:rounded-2xl overflow-hidden flex flex-col mx-auto max-w-md md:max-w-full">

                            {/* Progress Bars */}
                            <div className="absolute top-0 left-0 right-0 z-30 flex space-x-1 p-2">
                                {activeStory.items.map((item, idx) => (
                                    <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-white transition-all duration-100 ease-linear ${idx < currentItemIndex ? 'w-full' : idx === currentItemIndex ? '' : 'w-0'}`}
                                            style={{ width: idx === currentItemIndex ? `${progress}%` : undefined }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Header */}
                            <div className="absolute top-4 left-4 z-30 flex items-center space-x-2">
                                <Avatar identity={activeStory.identity} size="sm" ring={false} />
                                <div className="flex flex-col text-left">
                                    <span className="text-white font-bold text-sm drop-shadow-md">{activeStory.identity.name}</span>
                                    <span className="text-white/70 text-[10px] drop-shadow-md">
                                        {new Date(activeItem.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="absolute top-4 right-4 z-30 flex items-center space-x-4">
                                {activeItem.type === 'clip' && activeItem.mediaType === 'video' && (
                                    <button onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} className="text-white/80 hover:text-white">
                                        {muted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                                    </button>
                                )}
                                <button onClick={onClose} className="text-white/80 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 relative" onClick={() => setIsPaused(!isPaused)}>
                                {renderContent()}

                                {/* Tap Zones */}
                                <div className="absolute inset-y-0 left-0 w-1/3 z-20" onClick={(e) => { e.stopPropagation(); handlePrev(); }}></div>
                                <div className="absolute inset-y-0 right-0 w-1/3 z-20" onClick={(e) => { e.stopPropagation(); handleNext(); }}></div>
                            </div>

                            {/* Footer */}
                            {!isOwner && (
                                <div className="absolute bottom-0 left-0 right-0 p-4 z-30 bg-gradient-to-t from-black/80 to-transparent">
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="text"
                                            placeholder={`Reply to ${activeStory.identity.name}...`}
                                            className="flex-1 bg-white/10 backdrop-blur-md rounded-full px-4 py-3 text-sm text-white placeholder-white/70 border border-white/20 focus:outline-none focus:bg-white/20 transition"
                                            onFocus={() => setIsPaused(true)}
                                            onBlur={() => setIsPaused(false)}
                                        />
                                        <button className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition">
                                            <Heart size={24} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* UP NEXT (Right Sidebar - Desktop Only) */}
                        <div className="hidden md:flex w-80 bg-surface/50 backdrop-blur-xl border-l border-white/10 flex-col p-6 overflow-y-auto ml-4 rounded-2xl">
                            <h3 className="font-bold text-white text-lg mb-4">Up Next</h3>
                            <div className="space-y-3">
                                {stories.map((story, idx) => {
                                    if (idx <= currentStoryIndex) return null; // Hide current/past
                                    return (
                                        <div
                                            key={story.identity._id}
                                            onClick={() => { setCurrentStoryIndex(idx); setCurrentItemIndex(0); setProgress(0); }}
                                            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 cursor-pointer transition group"
                                        >
                                            <div className="p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 group-hover:scale-105 transition-transform">
                                                <div className="bg-black rounded-full p-0.5">
                                                    <Avatar identity={story.identity} size="sm" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-bold text-sm truncate">{story.identity.name}</p>
                                                <p className="text-white/50 text-xs">{story.items.length} new</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {currentStoryIndex >= stories.length - 1 && (
                                    <p className="text-white/50 text-sm text-center italic">You're all caught up!</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UnifiedViewerModal;
