import React, { useState } from 'react';
import axios from 'axios';
import { Search, User, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const fetcher = url => axios.get(url).then(res => res.data);

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, people, posts

  // Simple debounce
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, error, isLoading } = useSWR(
    debouncedQuery ? `/search?q=${debouncedQuery}` : null,
    fetcher
  );

  return (
    <div className="max-w-3xl mx-auto min-h-[80vh]">
      <div className="sticky top-0 bg-background z-10 pb-4 pt-2">
        <h1 className="text-3xl font-serif text-accent mb-6">Explore</h1>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search moments, people, tags..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-soft-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary transition-all shadow-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex space-x-6 border-b border-soft-border">
          {['all', 'posts', 'people'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "pb-3 text-sm font-medium transition-colors capitalize",
                activeTab === tab ? "text-accent border-b-2 border-accent" : "text-gray-400 hover:text-primary"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {!debouncedQuery && (
           <div className="text-center py-20 opacity-50">
               <Search size={48} className="mx-auto mb-4 text-gray-300" />
               <p>Type to search...</p>
           </div>
        )}

        {isLoading && debouncedQuery && <p className="text-center text-gray-400">Searching...</p>}

        {data && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {(activeTab === 'all' || activeTab === 'people') && data.identities.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">People</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.identities.map(user => (
                                <Link key={user._id} to={`/profile/${user.handle?.replace('@', '')}`} className="flex items-center space-x-3 p-4 bg-surface rounded-xl border border-soft-border hover:border-secondary transition-all">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                        {user.avatar ? <img src={user.avatar} className="rounded-full" /> : <User size={20} className="text-gray-500"/>}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-accent">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.handle || 'Anonymous'}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {(activeTab === 'all' || activeTab === 'posts') && data.posts.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Moments</h3>
                        <div className="space-y-4">
                            {data.posts.map(post => (
                                <Link key={post._id} to={`/feed`} className="block p-6 bg-surface rounded-xl border border-soft-border hover:shadow-md transition-all group">
                                    <h4 className="font-serif text-lg text-accent group-hover:text-primary transition-colors">{post.title || 'Untitled'}</h4>
                                    <p className="text-gray-600 line-clamp-2 mt-2 font-serif text-sm">{post.content}</p>
                                    <div className="flex items-center space-x-2 mt-4 text-xs text-gray-400">
                                        <div className="flex items-center space-x-1">
                                            <User size={12} />
                                            <span>{post.identity?.name}</span>
                                        </div>
                                        <span>•</span>
                                        <span className="bg-slate-100 px-2 py-0.5 rounded">{post.mood}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {data.posts.length === 0 && data.identities.length === 0 && (
                    <p className="text-center text-gray-500 py-10">No results found for "{debouncedQuery}"</p>
                )}
            </motion.div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
