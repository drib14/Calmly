import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isPublic = !user && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register' || location.pathname.startsWith('/verify') || location.pathname.startsWith('/reset-password') || location.pathname === '/forgot-password');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
      {!isPublic && <Navbar />}

      <main className={`transition-all duration-300 min-h-screen ${!isPublic ? 'md:ml-20 pb-20 md:pb-0' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="container mx-auto px-4 py-8 max-w-5xl"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Layout;
