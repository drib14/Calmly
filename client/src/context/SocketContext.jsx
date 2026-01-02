import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if user is authenticated
    if (user) {
        // In Vite, use import.meta.env, but fallback to localhost if not set
        const socketUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5080';

        const token = localStorage.getItem('accessToken');
        const newSocket = io(socketUrl, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            auth: {
                token: token
            },
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    } else {
        if (socket) {
            socket.close();
            setSocket(null);
        }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
