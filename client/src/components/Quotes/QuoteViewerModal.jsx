import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Repeat, Share2, ChevronLeft, ChevronRight, Pause, Play, Music, MoreVertical, Trash2, Archive, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../Avatar';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useIdentity } from '../../context/IdentityContext';
import { useAuth } from '../../context/AuthContext';
import ReplyQuoteModal from '../ReplyQuoteModal';

const QuoteViewerModal = ({ isOpen, onClose, quotes, initialIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false); // Audio
    const [showMenu, setShowMenu] = useState(false);
    const [showReplyModal, setShowReplyModal] = useState(false);

    const { currentIdentity } = useIdentity();
    const { user } = useAuth();

    // Safety check
    const currentQuote = quotes && quotes[currentIndex];
    const isOwner = currentQuote?.identity?._id === currentIdentity?._id;

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setProgress(0);
            setIsPaused(false);

            // Mark as viewed immediately when opened or index changed
            if (quotes && quotes[initialIndex]) {
                 axios.post(`/quotes/${quotes[initialIndex]._id}/view`).catch(console.error);
            }
        }
    }, [isOpen, initialIndex, quotes]); // Added quotes to dep array for safety

    // Effect to mark viewed when index changes (next/prev)
    useEffect(() => {
        if (isOpen && currentQuote) {
             axios.post(`/quotes/${currentQuote._id}/view`).catch(console.error);
        }
    }, [currentIndex, isOpen, currentQuote]);

    useEffect(() => {
        if (!isOpen || !currentQuote || isPaused) return;

        const duration = 5000; // 5 seconds per quote
        const interval = 50;
        const step = (interval / duration) * 100;

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + step;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [isOpen, currentQuote, isPaused, currentIndex]);

    const handleNext = () => {
        if (currentIndex < quotes.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        }
    };

    const handleAction = async (action) => {
        setIsPaused(true);
        if (action === 'like') {
             try {
                 await axios.put(`/quotes/${currentQuote._id}/like`, { identityId: currentIdentity._id });
                 toast.success("Liked");
             } catch(e) { toast.error("Failed"); }
        } else if (action === 'delete') {
             try {
                 await axios.delete(`/quotes/${currentQuote._id}`);
                 toast.success("Quote deleted");
                 onClose();
             } catch(e) { toast.error("Failed"); }
        }
        setIsPaused(false);
    };

    if (!isOpen || !currentQuote) return null;

    const moodColors = {
        'Neutral': 'bg-gray-100 border-gray-200 text-slate-800',
        'Happy': 'bg-yellow-50 border-yellow-200 text-yellow-900',
        'Sad': 'bg-blue-50 border-blue-200 text-blue-900',
        'Angry': 'bg-red-50 border-red-200 text-red-900',
        'Hopeful': 'bg-green-50 border-green-200 text-green-900',
        'Anxious': 'bg-purple-50 border-purple-200 text-purple-900',
    };

    const currentStyle = moodColors[currentQuote.mood] || moodColors['Neutral'];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 md:p-8">
                    {/* Reply Modal - Integrated or Overlay */}
                    <ReplyQuoteModal
                        quote={showReplyModal ? currentQuote : null}
                        onClose={() => { setShowReplyModal(false); setIsPaused(false); }}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative w-full max-w-5xl h-[85vh] bg-transparent flex overflow-hidden shadow-2xl rounded-2xl"
                    >
                        {/* LEFT SIDE: Viewer */}
                        <div className="flex-1 bg-white relative flex flex-col rounded-l-2xl rounded-r-2xl md:rounded-r-none overflow-hidden">
                            {/* Progress Bar */}
                            <div className="absolute top-0 left-0 right-0 flex space-x-1 p-2 z-20">
                                {quotes.map((_, idx) => (
                                    <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-white transition-all duration-100 ease-linear ${idx < currentIndex ? 'w-full' : idx === currentIndex ? '' : 'w-0'}`}
                                            style={{ width: idx === currentIndex ? `${progress}%` : undefined }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Controls Overlay */}
                            <div className="absolute inset-0 z-10 flex">
                                <div className="w-1/3 h-full" onClick={handlePrev}></div>
                                <div className="w-1/3 h-full" onClick={() => setIsPaused(!isPaused)}></div>
                                <div className="w-1/3 h-full" onClick={handleNext}></div>
                            </div>

                            {/* Content */}
                            <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center relative ${currentStyle}`}>

                                {/* Author Info */}
                                <div className="absolute top-8 left-6 flex items-center space-x-3 z-20">
                                    <Avatar identity={currentQuote.identity} size="md" ring={false} />
                                    <div className="text-left">
                                        <p className="font-bold text-sm">{currentQuote.identity.name}</p>
                                        <p className="text-xs opacity-70">
                                            {new Date(currentQuote.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                </div>

                                {/* Menu / Close */}
                                <div className="absolute top-8 right-6 z-30 flex items-center space-x-2">
                                    {isOwner && (
                                        <div className="relative">
                                            <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-2 bg-black/10 rounded-full hover:bg-black/20">
                                                <MoreVertical size={20} />
                                            </button>
                                            {showMenu && (
                                                <div className="absolute right-0 top-full mt-2 bg-white shadow-xl rounded-xl p-1 w-40 overflow-hidden text-sm text-slate-800">
                                                    <button className="flex items-center space-x-2 w-full p-2 hover:bg-gray-100 rounded-lg">
                                                        <Edit2 size={14} /> <span>Edit</span>
                                                    </button>
                                                    <button className="flex items-center space-x-2 w-full p-2 hover:bg-gray-100 rounded-lg">
                                                        <Archive size={14} /> <span>Archive</span>
                                                    </button>
                                                    <button onClick={() => handleAction('delete')} className="flex items-center space-x-2 w-full p-2 hover:bg-red-50 text-red-500 rounded-lg">
                                                        <Trash2 size={14} /> <span>Delete</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="p-2 bg-black/10 rounded-full hover:bg-black/20"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Quote Text */}
                                <div className="relative z-20 max-w-full">
                                    <h2 className="text-2xl md:text-3xl font-serif font-medium leading-relaxed">
                                        "{currentQuote.content}"
                                    </h2>
                                </div>

                                {/* Music Player */}
                                {currentQuote.music && (
                                    <div className="mt-8 relative z-30 flex items-center space-x-3 bg-white/50 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200">
                                            {currentQuote.music.coverUrl ? (
                                                <img src={currentQuote.music.coverUrl} className="w-full h-full object-cover" />
                                            ) : <Music size={20} className="m-2" />}
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate">{currentQuote.music.trackName}</p>
                                            <p className="text-[10px] opacity-70 truncate">{currentQuote.music.artistName}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const audio = document.getElementById(`quote-audio-${currentQuote._id}`);
                                                if(isPlaying) { audio.pause(); setIsPlaying(false); }
                                                else { audio.play(); setIsPlaying(true); }
                                            }}
                                            className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center"
                                        >
                                            {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
                                        </button>
                                        <audio
                                            id={`quote-audio-${currentQuote._id}`}
                                            src={currentQuote.music.previewUrl}
                                            onEnded={() => setIsPlaying(false)}
                                        />
                                    </div>
                                )}

                            </div>

                            {/* Footer Interactions */}
                            <div className="p-4 bg-white z-30 flex justify-between items-center border-t border-gray-100">
                                <input
                                    type="text"
                                    placeholder="Reply..."
                                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 mr-3"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsPaused(true);
                                        setShowReplyModal(true);
                                    }}
                                />
                                <div className="flex space-x-3 text-slate-600">
                                    <button onClick={(e) => { e.stopPropagation(); handleAction('like'); }}>
                                        <Heart size={24} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleAction('repost'); }}>
                                        <Repeat size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SIDE: Other Quotes List */}
                        <div className="hidden md:flex w-[300px] bg-surface border-l border-soft-border flex-col p-4 overflow-y-auto">
                            <h3 className="font-bold text-text text-lg mb-4">Up Next</h3>
                            <div className="space-y-3">
                                {quotes.map((q, idx) => (
                                    <div
                                        key={q._id}
                                        onClick={() => { setCurrentIndex(idx); setProgress(0); }}
                                        className={`flex items-center space-x-3 p-2 rounded-xl cursor-pointer transition ${idx === currentIndex ? 'bg-background shadow-sm border border-soft-border' : 'hover:bg-background'}`}
                                    >
                                        <div className={`p-[2px] rounded-full ${idx === currentIndex ? 'bg-black' : q.viewed ? 'bg-gray-300' : 'bg-gradient-to-tr from-yellow-400 to-fuchsia-600'}`}>
                                            <div className="bg-surface rounded-full p-0.5">
                                                <Avatar identity={q.identity} size="sm" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold truncate ${idx === currentIndex ? 'text-black' : q.viewed ? 'text-gray-500' : 'text-text'}`}>
                                                {q.identity.name}
                                            </p>
                                            <p className="text-xs text-secondary truncate">
                                                {formatTime(q.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000); // minutes
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff/60)}h`;
    return '1d';
};

export default QuoteViewerModal;
