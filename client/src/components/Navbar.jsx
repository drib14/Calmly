import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, PenTool, MessageCircle, BookOpen, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user && location.pathname === '/') return null;

  const navItems = [
    { icon: Home, label: 'Home', path: '/feed' },
    { icon: Search, label: 'Explore', path: '/search' },
    { icon: PenTool, label: 'Create', path: '/create' },
    { icon: BookOpen, label: 'Journal', path: '/journal' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
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
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />

              {isExpanded && (
                  <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
              )}

              {/* Tooltip (Collapsed Desktop Only) */}
              {!isExpanded && (
                <span className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block pointer-events-none z-50">
                    {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User / Logout (Desktop) */}
      <div className={clsx("hidden md:flex flex-col w-full mb-4 space-y-2", isExpanded ? "px-2" : "items-center")}>
        <button
          onClick={handleLogout}
          className={clsx(
              "p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center",
              isExpanded ? "w-full space-x-3" : "justify-center"
          )}
          title="Logout"
        >
          <LogOut size={22} />
          {isExpanded && <span className="font-medium text-sm">Logout</span>}
        </button>

        <div className={clsx("flex items-center", isExpanded ? "w-full space-x-3 bg-slate-50 p-2 rounded-xl border border-slate-100" : "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 border-2 border-white shadow-sm flex-shrink-0"></div>
            {isExpanded && (
                <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-700 truncate">My Account</p>
                    <p className="text-[10px] text-slate-400 truncate">Online</p>
                </div>
            )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
