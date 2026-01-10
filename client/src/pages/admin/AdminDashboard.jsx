import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Users, FileText, AlertTriangle, LifeBuoy, ArrowUpRight } from 'lucide-react';

const fetcher = url => axios.get(url).then(res => res.data);

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-[#1a1d24] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon size={64} />
        </div>
        <div className="relative z-10">
            <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${color} text-white`}>
                <Icon size={24} />
            </div>
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
            <p className="text-3xl font-bold text-white mt-1 font-mono">{value}</p>
        </div>
    </div>
);

const AdminDashboard = () => {
    const { data: stats } = useSWR('/admin/stats', fetcher, { refreshInterval: 10000 });

    if (!stats) return <div className="text-white">Loading stats...</div>;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-gray-400">Platform overview and real-time metrics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.users}
                    icon={Users}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Total Posts"
                    value={stats.posts}
                    icon={FileText}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Pending Reports"
                    value={stats.pendingReports}
                    icon={AlertTriangle}
                    color="bg-amber-500"
                />
                <StatCard
                    title="Open Tickets"
                    value={stats.openTickets}
                    icon={LifeBuoy}
                    color="bg-green-500"
                />
            </div>

            {/* Placeholder for charts or recent activity */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1a1d24] border border-white/5 rounded-2xl p-6 h-64 flex items-center justify-center text-gray-500">
                    Activity Chart Placeholder
                </div>
                <div className="bg-[#1a1d24] border border-white/5 rounded-2xl p-6 h-64 flex items-center justify-center text-gray-500">
                    Recent Logs Placeholder
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
