import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    // Initial fetch of unread count
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user) return;
            try {
                const { data } = await axios.get('/notifications');
                const unread = data.filter(n => !n.read).length;
                setUnreadCount(unread);
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            }
        };
        fetchNotifications();
    }, [user]);

    // Listen for real-time notifications
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            setUnreadCount(prev => prev + 1);
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket]);

    const handleClick = () => {
        navigate('/notifications');
    };

    return (
        <button
            onClick={handleClick}
            className="p-2 rounded-full hover:bg-surface transition-colors relative"
        >
            <Bell size={24} className="text-text" />
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    );
};

export default NotificationBell;
