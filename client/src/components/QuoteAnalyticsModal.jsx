import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import axios from 'axios';
import Avatar from './Avatar';
import Loader from './Loader';
import { Eye, Heart } from 'lucide-react';
import { useIdentity } from '../context/IdentityContext';

const moodColors = {
    'Neutral': 'bg-slate-900 text-white border-slate-900',
    'Happy': 'bg-yellow-400 text-yellow-900 border-yellow-400',
    'Sad': 'bg-blue-500 text-white border-blue-500',
    'Angry': 'bg-red-500 text-white border-red-500',
    'Hopeful': 'bg-green-500 text-white border-green-500',
    'Anxious': 'bg-purple-500 text-white border-purple-500',
};

const QuoteAnalyticsModal = ({ quote, onClose }) => {
    const { currentIdentity } = useIdentity();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('views');
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        if (quote && currentIdentity) {
            // Check ownership via user ID or identity ID if available on quote
            // Quote object structure varies (feed vs details), but usually has identity object
            // If quote.identity is populated object: quote.identity._id
            // currentIdentity is my active identity.
            // But ownership is User based.
            // We'll rely on the API response status (403) to detect non-ownership safely
            setIsOwner(false); // Reset default
        }
    }, [quote, currentIdentity]);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!quote) return;
            setLoading(true);
            try {
                const { data } = await axios.get(`/quotes/${quote._id}/details`);
                setDetails(data);
                setIsOwner(true); // If successful, we are owner
            } catch (err) {
                // If 403, we are not owner.
                setIsOwner(false);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [quote]);

    if (!quote) return null;

    return (
        <Modal isOpen={!!quote} onClose={onClose}>
            <div className="space-y-4">
                <div className="text-center border-b border-soft-border pb-4">
                    <h3 className="text-lg font-bold font-serif">{isOwner ? "Quote Analytics" : "View Quote"}</h3>

                    {/* Quote Bubble Preview */}
                    <div className="flex justify-center my-4">
                        <div className={`p-4 rounded-3xl text-sm font-medium text-center shadow-md border max-w-[200px]
                            ${moodColors[quote.mood] || moodColors['Neutral']} ${quote.font || 'font-serif'}`}>
                            {quote.content}
                        </div>
                    </div>

                    <div className="flex items-center justify-center space-x-2">
                        <Avatar identity={quote.identity} size="sm" />
                        <div className="text-left">
                            <p className="text-sm font-bold text-text">{quote.identity?.name}</p>
                            <p className="text-xs text-secondary">{quote.identity?.handle}</p>
                        </div>
                    </div>
                </div>

                {isOwner && (
                    <>
                        <div className="flex space-x-2 border-b border-soft-border">
                            <button
                                onClick={() => setActiveTab('views')}
                                className={`flex-1 pb-2 text-sm font-bold flex justify-center items-center space-x-2 ${activeTab === 'views' ? 'text-primary border-b-2 border-primary' : 'text-secondary'}`}
                            >
                                <Eye size={16} />
                                <span>Views ({details?.views?.length || 0})</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('reactions')}
                                className={`flex-1 pb-2 text-sm font-bold flex justify-center items-center space-x-2 ${activeTab === 'reactions' ? 'text-primary border-b-2 border-primary' : 'text-secondary'}`}
                            >
                                <Heart size={16} />
                                <span>Reactions ({details?.reactions?.length || 0})</span>
                            </button>
                        </div>

                        <div className="h-64 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader /></div>
                            ) : (
                                <div className="space-y-2">
                                    {activeTab === 'views' && (
                                        details?.views?.length === 0 ? (
                                            <div className="text-center text-secondary text-xs py-8">No views yet.</div>
                                        ) : (
                                            details?.views?.map((view, i) => (
                                                <div key={i} className="flex items-center space-x-3 p-2 hover:bg-surface rounded-lg">
                                                    <div className="w-8 h-8 bg-soft-border rounded-full flex items-center justify-center text-xs font-bold text-secondary">
                                                        {view.user?.username?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-text">User</p>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    )}

                                    {activeTab === 'reactions' && (
                                        details?.reactions?.length === 0 ? (
                                            <div className="text-center text-secondary text-xs py-8">No reactions yet.</div>
                                        ) : (
                                            details?.reactions?.map((reaction, i) => (
                                                <div key={i} className="flex items-center space-x-3 p-2 hover:bg-surface rounded-lg">
                                                    <Avatar identity={reaction.identity} size="sm" />
                                                    <div>
                                                        <p className="text-sm font-bold text-text">{reaction.identity.name}</p>
                                                        <p className="text-xs text-secondary">{reaction.identity.handle}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default QuoteAnalyticsModal;
