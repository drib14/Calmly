import React, { useState } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { PenTool } from 'lucide-react';
import PostCard from '../components/PostCard';
import PillSelection from '../components/PillSelection';
import QuotesWidget from '../components/QuotesWidget';

const fetcher = url => axios.get(url).then(res => res.data);

const Feed = () => {
  const [filter, setFilter] = useState({ type: '', mood: '' });

  const { data: posts, error, isLoading, mutate } = useSWR(
      `/posts/feed?type=${filter.type}&mood=${filter.mood}`,
      fetcher,
      { refreshInterval: 10000 }
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
      {/* Main Feed */}
      <div className="lg:col-span-8 lg:col-start-2 max-w-2xl mx-auto w-full">

        {/* Quotes Widget */}
        <QuotesWidget />

        <div className="flex justify-between items-center mb-6 sticky top-0 bg-background/80 backdrop-blur-md z-30 py-4 transition-colors duration-300">
            <h1 className="text-2xl font-serif font-bold text-text">Moments</h1>

            <div className="flex space-x-2">
                <PillSelection
                    options={[
                        { value: '', label: 'All' },
                        { value: 'confession', label: 'Confession' },
                        { value: 'poetry', label: 'Poetry' },
                        { value: 'letter', label: 'Letter' },
                        { value: 'mood', label: 'Mood' },
                    ]}
                    value={filter.type}
                    onChange={(val) => setFilter({...filter, type: val})}
                />
            </div>
        </div>

        {isLoading ? (
            <div className="space-y-6">
                {[1,2,3].map(i => (
                    <div key={i} className="bg-surface p-6 rounded-3xl shadow-sm border border-soft-border h-48 animate-pulse"></div>
                ))}
            </div>
        ) : posts?.length === 0 ? (
            <div className="text-center py-20">
                <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-soft-border">
                    <PenTool size={24} className="text-secondary" />
                </div>
                <p className="text-secondary mb-4">It's quiet here.</p>
                <a href="/create" className="text-text font-semibold hover:underline">Share a moment</a>
            </div>
        ) : (
            <div className="space-y-6">
            {posts?.map((post) => (
                <PostCard key={post._id} post={post} mutate={mutate} />
            ))}
            </div>
        )}
      </div>

      {/* Right Sidebar (Desktop Only) - Future Placeholder */}
      <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-8">
              {/* This space is reserved for Trending/Suggestions in the future */}
          </div>
      </div>
    </div>
  );
};

export default Feed;
