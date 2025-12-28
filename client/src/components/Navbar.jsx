import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, PenTool, MessageCircle, User, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user && location.pathname === '/') return null; // Don't show on landing if not logged in

  const navItems = [
    { icon: Home, label: 'Home', path: '/feed' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: PenTool, label: 'Create', path: '/create' },
    { icon: BookOpen, label: 'Journal', path: '/journal' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    // { icon: User, label: 'Profile', path: '/profile/me' }, // Will add later
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-soft-border md:top-0 md:left-0 md:bottom-auto md:w-20 md:h-screen md:border-t-0 md:border-r z-40 flex md:flex-col justify-between items-center py-2 md:py-8 px-6 md:px-0 shadow-lg md:shadow-none">

      {/* Logo (Desktop Only) */}
      <div className="hidden md:block mb-8">
        <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-serif font-bold text-lg">C</div>
      </div>

      {/* Nav Items */}
      <div className="flex md:flex-col w-full md:w-auto justify-between md:justify-start md:space-y-8">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "relative group flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300",
                  isActive ? "text-accent bg-slate-100" : "text-gray-400 hover:text-primary hover:bg-slate-50"
                )
              }
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />

              {/* Tooltip (Desktop) */}
              <span className="absolute left-14 bg-accent text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block pointer-events-none">
                {item.label}
              </span>

              {/* Label (Mobile - Optional, hiding for clean look) */}
              {/* <span className="text-[10px] mt-1 md:hidden">{item.label}</span> */}
            </NavLink>
          );
        })}
      </div>

      {/* User / Settings (Desktop) */}
      <div className="hidden md:flex flex-col items-center space-y-4">
        {/* Placeholder for user avatar */}
        <div className="w-8 h-8 rounded-full bg-gray-200"></div>
      </div>
    </nav>
  );
};

export default Navbar;
