import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import MobileTopBar from './MobileTopBar';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname.startsWith('/verify-email');
  const isLanding = location.pathname === '/';

  // Hide Nav on Auth pages, but show on Landing if logged in?
  // User said "remove it if the user isn't logged in, even in the / page".
  // Navbar.jsx handles "!user => return null".
  // MobileTopBar should likely follow the same rule or be specific to Feed/Search on mobile.
  // Actually, MobileTopBar is "Favicon + Search". Only relevant if logged in.

  const showNav = !isAuthPage && !isLanding;
  // Wait, if user IS logged in and goes to Landing, should they see Nav?
  // User said "remove it if the user isn't logged in". Implies if logged in, it CAN be there?
  // But typically Landing is for non-auth.
  // Let's assume Nav shows if User is logged in, regardless of page, unless it's an Auth page.
  // Navbar.jsx already returns null if !user.

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      {user && !isAuthPage && <MobileTopBar />}
      <Navbar />
      <main className="flex-1 md:ml-20 transition-all duration-300">
        <div className={`container mx-auto p-4 md:p-8 ${user && !isAuthPage ? 'mt-16 md:mt-0 mb-16 md:mb-0' : ''}`}>
            {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
