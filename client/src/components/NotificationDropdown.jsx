import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import Loader from './Loader';
import { Heart, MessageCircle, Repeat, AtSign, Quote } from 'lucide-react';

const NotificationDropdown = ({ onClose, setUnreadCount }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data } = await axios.get('/notifications');
                setNotifications(data.slice(0, 5)); // Show top 5
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const handleItemClick = async (notification) => {
        onClose();

        try {
            await axios.put(`/notifications/${notification._id}/read`);
        } catch (err) {
            console.error("Failed to mark read", err);
        }

        if (notification.post) {
            navigate(`/post/${notification.post._id}`);
        } else if (notification.quote) {
             // For quotes, we usually navigate to the sender's profile or chat if it's a reply
             // If it's a quote reaction, maybe profile?
             // Ideally we have a Single Quote View or we open the modal.
             // For now, navigate to profile of the quoter (which is the user themselves if it's a reaction/reply to them? No, sender is the reactor)
             // Notification: Sender = Reactor, Recipient = Me. Quote = My Quote.
             // So navigate to My Profile? Or just open Chat if it's a reply?
             if (notification.type === 'quote_reply') {
                 navigate('/chat', { state: { startConversationWith: notification.sender } });
             } else {
                 // Reaction: Go to my profile where the quote is?
                 // Or just do nothing special other than mark read?
                 // Let's go to profile.
                 navigate('/feed'); // Fallback since quotes are on feed
             }
        }
    };

    const handleViewAll = () => {
        navigate('/notifications');
        onClose();
    };

    const getIcon = (type) => {
        switch(type) {
            case 'like': return <Heart size={14} className="text-red-500 fill-current" />;
            case 'comment': return <MessageCircle size={14} className="text-blue-500 fill-current" />;
            case 'reply': return <MessageCircle size={14} className="text-blue-500 fill-current" />;
            case 'repost': return <Repeat size={14} className="text-green-500" />;
            case 'quote_reply': return <Quote size={14} className="text-purple-500" />;
            case 'quote_reaction': return <Heart size={14} className="text-pink-500 fill-current" />; // Distinct from post like
            default: return <AtSign size={14} className="text-yellow-500" />;
        }
    };

    const getText = (n) => {
        const name = n.sender.name;
        switch(n.type) {
            case 'like': return `liked your post`;
            case 'comment': return `commented on your post`;
            case 'reply': return `replied to your comment`;
            case 'repost': return `reposted your post`;
            case 'quote_reply': return `replied to your quote`;
            case 'quote_reaction': return `reacted to your quote`;
            default: return `interacted with you`;
        }
    };

    return (
        <div className="bg-surface border border-soft-border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[400px]">
            <div className="p-3 border-b border-soft-border flex justify-between items-center bg-background/50 backdrop-blur-sm">
                <h3 className="font-bold text-sm">Notifications</h3>
                <button onClick={handleViewAll} className="text-xs text-primary hover:underline">View All</button>
            </div>

            <div className="overflow-y-auto flex-1">
                {loading ? (
                    <div className="p-4 flex justify-center"><Loader /></div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-secondary text-sm">No notifications yet</div>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n._id}
                            onClick={() => handleItemClick(n)}
                            className={`p-3 border-b border-soft-border/50 hover:bg-background transition-colors cursor-pointer flex items-start space-x-3 ${!n.read ? 'bg-primary/5' : ''}`}
                        >
                            <div className="relative">
                                <Avatar identity={n.sender} size="sm" />
                                <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-0.5 shadow-sm">
                                    {getIcon(n.type)}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-text">
                                    <span className="font-bold">{n.sender.name}</span> <span className="text-secondary">{getText(n)}</span>
                                </p>
                                {/* Preview Content */}
                                {n.post && n.post.content && (
                                    <p className="text-[10px] text-secondary truncate mt-1">"{n.post.content}"</p>
                                )}
                                {n.quote && (
                                    <p className="text-[10px] text-secondary truncate mt-1">"{n.quote.content}"</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

             <div className="p-2 border-t border-soft-border text-center bg-background/50">
                <button onClick={handleViewAll} className="text-xs font-bold text-text hover:text-primary">See all notifications</button>
            </div>
        </div>
    );
};

export default NotificationDropdown;
