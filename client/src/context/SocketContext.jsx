import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { user } = useAuth(); // Contains token info if structured right?
    // AuthContext stores accessToken in localStorage. useAuth provides user data.
    // We need to pass token explicitly.

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            if (socket) socket.close();
            return;
        }

        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5080', {
            auth: { token }
        });

        newSocket.on('connect', () => {
            // console.log('Connected to socket');
        });

        newSocket.on('online_users', (users) => {
            setOnlineUsers(users);
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, [user]); // Re-connect if user changes (login/logout)

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
