import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import MobileTopBar from './MobileTopBar';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';
import clsx from 'clsx';
import { THEMES } from './Theme/themeConfig';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname.startsWith('/verify-email');

  // Theme Logic
  const currentTheme = THEMES[settings?.theme] || THEMES['soft-light'];
  const fontClass = settings?.fontFamily || 'font-serif';
  const contrastClass = settings?.highContrast ? 'contrast-125' : '';

  // Inject wallpaper
  const bgStyle = {
      backgroundImage: `url(${currentTheme.wallpaper})`,
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      backgroundPosition: 'center'
  };

  return (
    <div
        className={clsx("flex flex-col md:flex-row min-h-screen transition-all duration-500 ease-in-out", fontClass, contrastClass)}
        style={bgStyle}
    >
      {/* Overlay to ensure text readability on wallpapers */}
      <div className={clsx("absolute inset-0 z-0 bg-opacity-90 transition-colors duration-500", currentTheme.bg,
           settings?.theme === 'dark' ? 'bg-opacity-80' : 'bg-opacity-90'
      )}></div>

      <div className={clsx("relative z-10 flex flex-col md:flex-row w-full min-h-screen", currentTheme.text)}>
          {user && !isAuthPage && <MobileTopBar />}
          <Navbar />
          <main className="flex-1 md:ml-20 transition-all duration-300">
            <div className={`container mx-auto p-4 md:p-8 ${user && !isAuthPage ? 'mt-16 md:mt-0 mb-16 md:mb-0' : ''}`}>
                {children}
            </div>
          </main>
      </div>
    </div>
  );
};

export default Layout;
