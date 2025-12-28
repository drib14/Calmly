import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isPublic = !user && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register' || location.pathname.startsWith('/verify'));

  return (
    <div className="min-h-screen bg-background text-accent font-sans selection:bg-primary selection:text-white">
      {!isPublic && <Navbar />}

      <main className={`transition-all duration-300 ${!isPublic ? 'md:ml-20 mb-20 md:mb-0' : ''}`}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="container mx-auto px-4 py-8 max-w-4xl"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default Layout;
