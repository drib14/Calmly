import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import axios from 'axios';
import Avatar from './Avatar';
import Loader from './Loader';
import { Eye, Heart } from 'lucide-react';
import { useIdentity } from '../context/IdentityContext';
import { motion, AnimatePresence } from 'framer-motion';

const moodColors = {
    'Neutral': 'bg-slate-900 text-white border-slate-900',
    'Happy': 'bg-yellow-400 text-yellow-900 border-yellow-400',
    'Sad': 'bg-blue-500 text-white border-blue-500',
    'Angry': 'bg-red-500 text-white border-red-500',
    'Hopeful': 'bg-green-500 text-white border-green-500',
    'Anxious': 'bg-purple-500 text-white border-purple-500',
};

const QuoteAnalyticsModal = ({ isOpen, onClose, item }) => {
    // "item" can be a quote or a clip
    const { currentIdentity } = useIdentity();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('views');

    useEffect(() => {
        const fetchDetails = async () => {
            if (!item || !isOpen) return;
            setLoading(true);
            try {
                // Determine endpoint based on type
                const endpoint = item.type === 'quote'
                    ? `/quotes/${item._id}/details`
                    : `/clips/${item._id}/details`;

                const { data } = await axios.get(endpoint);
                setDetails(data);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [item, isOpen]);

    if (!isOpen || !item) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-[80]"
                        onClick={onClose}
                    />

                    {/* Slide-up Panel */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-3xl z-[90] max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border-t border-soft-border"
                    >
                        {/* Drag Handle */}
                        <div className="w-full h-6 flex items-center justify-center pt-2 cursor-pointer" onClick={onClose}>
                            <div className="w-12 h-1.5 bg-soft-border rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="px-6 py-2 border-b border-soft-border">
                            <h3 className="text-lg font-bold font-serif text-text text-center">Story Insights</h3>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-soft-border px-6 pt-4">
                            <button
                                onClick={() => setActiveTab('views')}
                                className={`flex-1 pb-3 text-sm font-bold flex justify-center items-center space-x-2 transition-colors ${activeTab === 'views' ? 'text-text border-b-2 border-text' : 'text-secondary hover:text-text'}`}
                            >
                                <Eye size={16} />
                                <span>Views ({details?.views?.length || 0})</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('reactions')}
                                className={`flex-1 pb-3 text-sm font-bold flex justify-center items-center space-x-2 transition-colors ${activeTab === 'reactions' ? 'text-text border-b-2 border-text' : 'text-secondary hover:text-text'}`}
                            >
                                <Heart size={16} />
                                <span>Reactions ({details?.reactions?.length || 0})</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-background custom-scrollbar">
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader /></div>
                            ) : (
                                <div className="space-y-4">
                                    {activeTab === 'views' && (
                                        !details?.views || details.views.length === 0 ? (
                                            <div className="text-center text-secondary text-sm py-10 italic">
                                                No views yet. Share it with friends!
                                            </div>
                                        ) : (
                                            details.views.map((view, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-soft-border">
                                                    <div className="flex items-center space-x-3">
                                                        <Avatar identity={view.identity} size="sm" />
                                                        <div>
                                                            <p className="text-sm font-bold text-text">{view.identity?.name || "Unknown Soul"}</p>
                                                            <p className="text-xs text-secondary">{view.identity?.handle || "Anonymous"}</p>
                                                        </div>
                                                    </div>
                                                    {/* Blue Badge for New? Logic relies on comparing view timestamp with... something?
                                                        User requested blue badge. Let's assume 'viewed' status or just a dot if very recent.
                                                        For now, hardcoded logic or just a dot if < 1 hour? */}
                                                    {new Date(view.timestamp) > new Date(Date.now() - 3600000) && (
                                                        <div className="w-2 h-2 rounded-full bg-blue-500" title="New View"></div>
                                                    )}
                                                </div>
                                            ))
                                        )
                                    )}

                                    {activeTab === 'reactions' && (
                                        !details?.reactions || details.reactions.length === 0 ? (
                                            <div className="text-center text-secondary text-sm py-10 italic">
                                                No reactions yet.
                                            </div>
                                        ) : (
                                            details.reactions.map((reaction, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-soft-border">
                                                    <div className="flex items-center space-x-3">
                                                        <Avatar identity={reaction.identity} size="sm" />
                                                        <div>
                                                            <p className="text-sm font-bold text-text">{reaction.identity?.name || "Unknown Soul"}</p>
                                                            <p className="text-xs text-secondary">{reaction.identity?.handle}</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-2 bg-red-50 text-red-500 rounded-full">
                                                        <Heart size={14} fill="currentColor" />
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default QuoteAnalyticsModal;
