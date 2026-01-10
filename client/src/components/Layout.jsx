import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import MobileTopBar from './MobileTopBar';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';
import clsx from 'clsx';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname.startsWith('/verify-email');
  const isLanding = location.pathname === '/';

  // Hide Nav on Auth pages, but show on Landing if logged in?
  // User said "remove it if the user isn't logged in, even in the / page".
  // Navbar.jsx handles "!user => return null".
  // MobileTopBar should likely follow the same rule or be specific to Feed/Search on mobile.
  // Actually, MobileTopBar is "Favicon + Search". Only relevant if logged in.

  // Hide sidebar on Auth pages and Landing page (regardless of login status)
  // Replaced buttons on Landing page will handle navigation if logged in.
  const showNav = !isAuthPage && !isLanding;

  const themeClass = settings?.theme === 'dark' ? 'dark bg-slate-900 text-white' :
                     settings?.theme === 'sage' ? 'bg-[#f0f4f0] text-slate-800' :
                     settings?.theme === 'ocean' ? 'bg-[#f0f8ff] text-slate-800' :
                     'bg-white text-slate-900';

  const fontClass = settings?.fontFamily || 'font-serif';
  const contrastClass = settings?.highContrast ? 'contrast-125' : '';

  return (
    <div className={clsx("flex flex-col md:flex-row min-h-screen transition-colors duration-300", themeClass, fontClass)}>
      {user && !isAuthPage && <MobileTopBar highContrast={settings?.highContrast} />}
      <Navbar highContrast={settings?.highContrast} />
      <main className={clsx("flex-1 transition-all duration-300 min-w-0", contrastClass)}>
        <div className={`container mx-auto p-4 md:p-8 ${user && !isAuthPage ? 'mt-16 md:mt-0 mb-16 md:mb-0' : ''}`}>
            {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
