import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Search, Trash2, Eye, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const fetcher = url => axios.get(url).then(res => res.data);

const ContentManagement = () => {
    const { data: posts, mutate } = useSWR('/admin/posts', fetcher);
    const [search, setSearch] = useState('');

    const filteredPosts = posts?.filter(p =>
        p.content?.toLowerCase().includes(search.toLowerCase()) ||
        p.identity?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will delete the post.")) return;
        try {
            await axios.delete(`/admin/posts/${id}`);
            mutate();
            toast.success("Post deleted");
        } catch (err) {
            toast.error("Failed to delete post");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Content Management</h1>
                    <p className="text-gray-400">View and manage all user posts.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                    <input
                        className="bg-[#1a1d24] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 w-64 transition-colors"
                        placeholder="Search content or user..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-[#1a1d24] border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-medium">Author</th>
                            <th className="p-4 font-medium">Content Snippet</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Posted</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredPosts?.map(post => (
                            <tr key={post._id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4">
                                    <div>
                                        <p className="text-white font-medium">{post.identity?.name || 'Unknown'}</p>
                                        <p className="text-xs text-gray-500">{post.identity?.handle}</p>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <p className="text-gray-300 text-sm truncate max-w-md">
                                        {post.content || '[Media Post]'}
                                    </p>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">{post.type}</span>
                                        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">{post.mood}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {post.hidden ? (
                                        <span className="text-amber-400 text-xs font-bold uppercase">Hidden</span>
                                    ) : (
                                        <span className="text-green-400 text-xs font-bold uppercase">Visible</span>
                                    )}
                                </td>
                                <td className="p-4 text-gray-400 text-sm">
                                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <a href={`/post/${post._id}`} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition">
                                            <ExternalLink size={16} />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(post._id)}
                                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!filteredPosts || filteredPosts.length === 0) && (
                    <div className="p-8 text-center text-gray-500">No posts found.</div>
                )}
            </div>
        </div>
    );
};

export default ContentManagement;
