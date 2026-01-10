import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Search, Ban, CheckCircle, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const fetcher = url => axios.get(url).then(res => res.data);

const UserManagement = () => {
    const { data: users, mutate } = useSWR('/admin/users', fetcher);
    const [search, setSearch] = useState('');

    const filteredUsers = users?.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u._id.includes(search)
    );

    const toggleBan = async (id) => {
        try {
            await axios.put(`/admin/users/${id}/ban`);
            mutate();
            toast.success("User status updated");
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                    <p className="text-gray-400">View and manage registered users.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                    <input
                        className="bg-[#1a1d24] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 w-64 transition-colors"
                        placeholder="Search email or ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-[#1a1d24] border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-medium">User Info</th>
                            <th className="p-4 font-medium">Role</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Joined</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers?.map(user => (
                            <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4">
                                    <div>
                                        <p className="text-white font-medium">{user.email}</p>
                                        <p className="text-xs text-gray-500 font-mono">{user._id}</p>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700/50 text-gray-400'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {user.isBanned ? (
                                        <span className="flex items-center space-x-1 text-red-400 text-sm">
                                            <Ban size={14} /> <span>Banned</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center space-x-1 text-green-400 text-sm">
                                            <CheckCircle size={14} /> <span>Active</span>
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-gray-400 text-sm">
                                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                                </td>
                                <td className="p-4 text-right">
                                    {user.role !== 'admin' && (
                                        <button
                                            onClick={() => toggleBan(user._id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${user.isBanned ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                                        >
                                            {user.isBanned ? 'Unban' : 'Ban Access'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!filteredUsers || filteredUsers.length === 0) && (
                    <div className="p-8 text-center text-gray-500">No users found.</div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
