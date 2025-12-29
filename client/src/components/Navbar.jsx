import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, PenTool, MessageCircle, BookOpen, LogOut, ChevronRight, ChevronLeft, Settings, User } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useIdentity } from '../context/IdentityContext';
import Avatar from './Avatar';
import axios from 'axios';
import useSWR from 'swr';
import { AnimatePresence, motion } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { currentIdentity } = useIdentity();
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Poll for Unread Messages
  const { data: unreadData } = useSWR(
      user ? '/messages/unread-count' : null,
      async (url) => {
          try {
              const res = await axios.get(url);
              return res.data;
          } catch (err) {
              return { count: 0 };
          }
      },
      { refreshInterval: 5000 }
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Ensure Navbar is hidden if user is not logged in
  if (!user) return null;

  const navItems = [
    { icon: Home, label: 'Home', path: '/feed' },
    { icon: Search, label: 'Explore', path: '/search' },
    { icon: PenTool, label: 'Create', path: '/create' },
    { icon: BookOpen, label: 'Journal', path: '/journal' },
    { icon: MessageCircle, label: 'Chat', path: '/chat', badge: unreadData?.count },
  ];

  return (
    <nav
      className={clsx(
        "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:top-0 md:left-0 md:bottom-auto md:h-screen md:border-t-0 md:border-r z-50 flex md:flex-col justify-between items-center py-2 md:py-6 px-6 shadow-lg md:shadow-none transition-all duration-300",
        isExpanded ? "md:w-64 md:px-4" : "md:w-20 md:px-0"
      )}
    >

      {/* Logo & Toggle (Desktop) */}
      <div className="hidden md:flex flex-col w-full mb-8">
        <div className={clsx("flex items-center transition-all duration-300", isExpanded ? "justify-between px-2" : "justify-center")}>
            {isExpanded ? (
                <span className="font-serif font-bold text-2xl text-slate-800 tracking-tight">Calmly</span>
            ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-serif font-bold text-lg shadow-md">C</div>
            )}

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
                {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex md:flex-col w-full md:w-auto justify-between md:justify-start md:space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "relative group flex items-center p-3 rounded-xl transition-all duration-300",
                  isExpanded ? "w-full space-x-3 px-4" : "justify-center",
                  isActive ? "text-slate-900 bg-slate-100 shadow-sm" : "text-gray-400 hover:text-slate-700 hover:bg-slate-50"
                )
              }
            >
              <div className="relative">
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  {/* Red Dot Badge */}
                  {item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                      </span>
                  )}
              </div>

              {isExpanded && (
                  <span className="font-medium text-sm whitespace-nowrap flex-1 flex justify-between items-center">
                      {item.label}
                      {item.badge > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                              {item.badge > 99 ? '99+' : item.badge}
                          </span>
                      )}
                  </span>
              )}

              {/* Tooltip (Collapsed Desktop Only) */}
              {!isExpanded && (
                <span className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block pointer-events-none z-50">
                    {item.label} {item.badge > 0 && `(${item.badge})`}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User / Profile (Desktop) */}
      <div className={clsx("hidden md:flex flex-col w-full mb-4 space-y-2 relative", isExpanded ? "px-2" : "items-center")}>

        {/* Dropdown Menu */}
        <AnimatePresence>
            {showProfileMenu && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 w-full bg-white border border-slate-100 shadow-xl rounded-xl p-2 mb-2 z-50"
                >
                    <button
                        onClick={() => {
                            navigate(currentIdentity ? `/profile/${currentIdentity.handle.replace('@','')}` : '/feed');
                            setShowProfileMenu(false);
                        }}
                        className="flex items-center space-x-3 w-full p-2 hover:bg-slate-50 rounded-lg text-sm text-slate-700 transition"
                    >
                        <User size={18} />
                        <span>Profile</span>
                    </button>
                    <button
                        onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                        className="flex items-center space-x-3 w-full p-2 hover:bg-slate-50 rounded-lg text-sm text-slate-700 transition"
                    >
                        <Settings size={18} />
                        <span>Settings</span>
                    </button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full p-2 hover:bg-red-50 rounded-lg text-sm text-red-500 transition"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Trigger */}
        <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={clsx(
                "flex items-center cursor-pointer hover:bg-slate-50 transition p-1.5 rounded-xl border border-transparent hover:border-slate-100",
                isExpanded ? "w-full space-x-3" : "justify-center",
                showProfileMenu && "bg-slate-50 border-slate-100"
            )}
        >
            <Avatar identity={currentIdentity} size="sm" />
            {isExpanded && (
                <div className="overflow-hidden flex-1">
                    <p className="text-xs font-bold text-slate-700 truncate">{currentIdentity?.name || 'Account'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{currentIdentity?.handle || 'Loading...'}</p>
                </div>
            )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
