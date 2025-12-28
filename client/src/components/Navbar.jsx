import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, PenTool, MessageCircle, BookOpen, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:top-0 md:left-0 md:bottom-auto md:w-20 md:h-screen md:border-t-0 md:border-r z-50 flex md:flex-col justify-between items-center py-2 md:py-6 px-6 md:px-0 shadow-lg md:shadow-none">

      {/* Logo (Desktop Only) */}
      <div className="hidden md:flex flex-col items-center mb-8">
        <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-serif font-bold text-lg shadow-md">C</div>
      </div>

      {/* Nav Items */}
      <div className="flex md:flex-col w-full md:w-auto justify-between md:justify-start md:space-y-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "relative group flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300",
                  isActive ? "text-slate-800 bg-slate-100 shadow-sm" : "text-gray-400 hover:text-slate-600 hover:bg-slate-50"
                )
              }
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />

              {/* Tooltip (Desktop) */}
              <span className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block pointer-events-none z-50">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>

      {/* User / Logout (Desktop) */}
      <div className="hidden md:flex flex-col items-center space-y-6 mb-4">
        <button
          onClick={handleLogout}
          className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          title="Logout"
        >
          <LogOut size={22} />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 border-2 border-white shadow-sm"></div>
      </div>
    </nav>
  );
};

export default Navbar;
