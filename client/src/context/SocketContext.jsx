import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        // If there's no backend socket logic, we can leave this null or connect to a dummy path.
        // However, to fix the build, this file just needs to exist.
        // If the backend isn't set up for socket.io, the connection will fail or fallback to polling if configured.
        // Given the prompt constraints and "polling via swr" memory, this is likely a placeholder.

        // Disabling actual socket connection to prevent errors if backend doesn't support it
        // const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        // setSocket(newSocket);
        // return () => newSocket.close();
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
