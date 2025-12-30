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
        <h1 className="text-3xl font-serif text-text mb-6">Explore</h1>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 text-secondary" size={20} />
          <input
            type="text"
            placeholder="Search moments, people, tags..."
            className="w-full pl-12 pr-4 py-3 bg-surface border border-soft-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-text placeholder:text-secondary transition-all shadow-sm"
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
                activeTab === tab ? "text-text border-b-2 border-text" : "text-secondary hover:text-text"
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
               <Search size={48} className="mx-auto mb-4 text-secondary" />
               <p className="text-secondary">Type to search...</p>
           </div>
        )}

        {isLoading && debouncedQuery && <p className="text-center text-secondary">Searching...</p>}

        {data && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {(activeTab === 'all' || activeTab === 'people') && data.identities.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4">People</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.identities.map(user => (
                                <Link key={user._id} to={`/profile/${user.handle?.replace('@', '')}`} className="flex items-center space-x-3 p-4 bg-surface rounded-xl border border-soft-border hover:border-secondary transition-all">
                                    <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                                        {user.avatar ? <img src={user.avatar} className="rounded-full" /> : <User size={20} className="text-secondary"/>}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text">{user.name}</p>
                                        <p className="text-xs text-secondary">{user.handle || 'Anonymous'}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {(activeTab === 'all' || activeTab === 'posts') && data.posts.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4">Moments</h3>
                        <div className="space-y-4">
                            {data.posts.map(post => (
                                <Link key={post._id} to={`/feed`} className="block p-6 bg-surface rounded-xl border border-soft-border hover:shadow-md transition-all group">
                                    <h4 className="font-serif text-lg text-text group-hover:text-primary transition-colors">{post.title || 'Untitled'}</h4>
                                    <p className="text-secondary line-clamp-2 mt-2 font-serif text-sm">{post.content}</p>
                                    <div className="flex items-center space-x-2 mt-4 text-xs text-secondary">
                                        <div className="flex items-center space-x-1">
                                            <User size={12} />
                                            <span>{post.identity?.name}</span>
                                        </div>
                                        <span>•</span>
                                        <span className="bg-background px-2 py-0.5 rounded border border-soft-border">{post.mood}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {data.posts.length === 0 && data.identities.length === 0 && (
                    <p className="text-center text-secondary py-10">No results found for "{debouncedQuery}"</p>
                )}
            </motion.div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
