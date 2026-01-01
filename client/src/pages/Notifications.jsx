import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Repeat, Trash2, Quote, User } from 'lucide-react';
import Avatar from '../components/Avatar';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const socket = useSocket();

    const fetchNotifications = async () => {
        try {
            const { data } = await axios.get('/notifications');
            setNotifications(data);
            setIsLoading(false);
        } catch (err) {
            console.error(err);
            setIsLoading(false);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.put('/notifications/read');
            // Update local state to show as read
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const clearAll = async () => {
        if (window.confirm("Clear all notifications?")) {
            try {
                await axios.delete('/notifications');
                setNotifications([]);
            } catch (err) {
                console.error(err);
            }
        }
    }

    useEffect(() => {
        fetchNotifications();
        markAllRead();
    }, []);

    // Listen for new notifications
    useEffect(() => {
        if (!socket) return;
        const handleNew = (newNotification) => {
            setNotifications(prev => [newNotification, ...prev]);
        };
        socket.on('new_notification', handleNew);
        return () => socket.off('new_notification', handleNew);
    }, [socket]);

    if (isLoading) return <div className="text-center py-10 text-secondary">Loading...</div>;

    const getIcon = (type) => {
        switch (type) {
            case 'like': return <Heart className="text-red-500" size={16} fill="currentColor" />;
            case 'comment': return <MessageCircle className="text-blue-500" size={16} />;
            case 'reply': return <MessageCircle className="text-blue-500" size={16} />;
            case 'repost': return <Repeat className="text-green-500" size={16} />;
            case 'quote_reply': return <Quote className="text-purple-500" size={16} />;
            case 'quote_reaction': return <Heart className="text-pink-500" size={16} fill="currentColor" />;
            default: return <User className="text-secondary" size={16} />;
        }
    };

    const handleClick = (n) => {
        if (n.post) navigate(`/feed#post-${n.post._id}`);
        // Quote reply -> Chat?
        if (n.type === 'quote_reply') navigate('/chat', { state: { startConversationWith: n.sender } });
    };

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-serif font-bold text-text">Notifications</h1>
                {notifications && notifications.length > 0 && (
                    <button onClick={clearAll} className="text-xs font-bold text-secondary hover:text-red-500 flex items-center space-x-1">
                        <Trash2 size={14} /> <span>Clear All</span>
                    </button>
                )}
            </div>

            <div className="space-y-2">
                {notifications?.length === 0 ? (
                    <div className="text-center py-10 text-secondary">No notifications yet.</div>
                ) : (
                    notifications?.map(n => (
                        <div key={n._id} onClick={() => handleClick(n)} className={`p-4 rounded-2xl bg-surface border border-soft-border flex items-start space-x-4 cursor-pointer hover:bg-background transition ${!n.read ? 'bg-background/50 border-l-4 border-l-accent' : ''}`}>
                            <div className="relative">
                                <Avatar identity={n.sender} />
                                <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-1 border border-soft-border shadow-sm">
                                    {getIcon(n.type)}
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-text">
                                    <span className="font-bold">{n.sender?.name}</span>
                                    <span className="text-secondary ml-1">
                                        {n.type === 'like' && 'liked your post.'}
                                        {n.type === 'repost' && 'reposted your moment.'}
                                        {n.type === 'comment' && 'commented on your post.'}
                                        {n.type === 'reply' && 'replied to your comment.'}
                                        {n.type === 'quote_reply' && 'replied to your quote.'}
                                        {n.type === 'quote_reaction' && 'reacted to your quote.'}
                                    </span>
                                </p>
                                {n.comment && <p className="text-xs text-secondary mt-1 line-clamp-1">"{n.comment.content}"</p>}
                                {n.post && n.post.content && <p className="text-xs text-secondary mt-1 line-clamp-1 italic">"{n.post.content}"</p>}
                                <p className="text-[10px] text-secondary mt-2">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
