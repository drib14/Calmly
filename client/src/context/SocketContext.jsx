import React, { createContext, useContext, useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import axios from 'axios';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const pusherKey = import.meta.env.VITE_PUSHER_KEY;
        const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER;

        if (!pusherKey) {
            // console.warn("Pusher Key not found.");
            return;
        }

        // Configure Pusher with Auth
        // Pusher-js uses 'auth' option to set headers. We need the JWT token.
        const token = localStorage.getItem('accessToken');

        const pusher = new Pusher(pusherKey, {
            cluster: pusherCluster,
            authEndpoint: '/api/auth/pusher/auth',
            auth: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        });

        // 1. Subscribe to User Channel (Messages)
        const userChannel = pusher.subscribe(`user-${user._id}`);

        // 2. Subscribe to Presence Channel (Online Status)
        const presenceChannel = pusher.subscribe('presence-global');

        presenceChannel.bind('pusher:subscription_succeeded', (members) => {
            const users = [];
            members.each((member) => users.push(member.id));
            setOnlineUsers(users);
        });

        presenceChannel.bind('pusher:member_added', (member) => {
            setOnlineUsers((prev) => [...prev, member.id]);
        });

        presenceChannel.bind('pusher:member_removed', (member) => {
            setOnlineUsers((prev) => prev.filter((id) => id !== member.id));
        });

        // Add a helper method to 'socket' (pusher instance) to emulate socket.io's .on for the user channel
        pusher.io_on = (event, callback) => {
            userChannel.bind(event, callback);
        };
        pusher.io_off = (event) => {
            userChannel.unbind(event);
        };

        setSocket(pusher);

        return () => {
            pusher.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
