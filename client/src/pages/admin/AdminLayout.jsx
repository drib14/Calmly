import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Flag, MessageSquare, LogOut, ArrowLeft, Activity } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
        { path: '/admin/users', icon: Users, label: 'Users' },
        { path: '/admin/reports', icon: Flag, label: 'Reports' },
        { path: '/admin/support', icon: MessageSquare, label: 'Support Inbox' },
    ];

    return (
        <div className="min-h-screen bg-[#0f1115] text-[#e0e0e0] font-sans flex">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/5 flex flex-col fixed h-full bg-[#0f1115] z-20">
                <div className="p-6 border-b border-white/5 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Activity className="text-white" size={18} />
                    </div>
                    <span className="font-bold text-lg tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        CALMLY ADMIN
                    </span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = item.exact
                            ? location.pathname === item.path
                            : location.pathname.startsWith(item.path);

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.exact}
                                className={clsx(
                                    "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-gradient-to-r from-blue-600/20 to-purple-600/10 text-blue-400 border border-blue-500/20"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon size={20} className={clsx(isActive ? "text-blue-400" : "text-gray-500 group-hover:text-white")} />
                                <span className="font-medium text-sm">{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={() => navigate('/feed')}
                        className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white transition w-full rounded-xl hover:bg-white/5 mb-2"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium text-sm">Back to App</span>
                    </button>
                    <button
                        onClick={logout}
                        className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 transition w-full rounded-xl hover:bg-red-500/10"
                    >
                        <LogOut size={20} />
                        <span className="font-medium text-sm">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 ml-64 bg-[#0f1115] relative overflow-hidden">
                {/* Background ambient glow */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />

                <div className="p-8 relative z-10">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
