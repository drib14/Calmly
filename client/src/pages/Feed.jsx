import React, { useState } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { PenTool } from 'lucide-react';
import PostCard from '../components/PostCard';

const fetcher = url => axios.get(url).then(res => res.data);

const Feed = () => {
  const [filter, setFilter] = useState({ type: '', mood: '' });

  const { data: posts, error, isLoading, mutate } = useSWR(
      `/posts/feed?type=${filter.type}&mood=${filter.mood}`,
      fetcher,
      { refreshInterval: 10000 }
  );

  return (
    <div className="max-w-xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-slate-50 z-30 py-4 border-b border-transparent">
        <h1 className="text-2xl font-serif font-bold text-slate-800">Moments</h1>

        <div className="flex space-x-2">
           <select
             className="border-none bg-white rounded-full px-4 py-2 text-sm shadow-sm text-slate-600 focus:ring-2 focus:ring-slate-200 cursor-pointer hover:bg-slate-100 transition"
             onChange={(e) => setFilter({...filter, type: e.target.value})}
           >
             <option value="">All Types</option>
             <option value="confession">Confession</option>
             <option value="poetry">Poetry</option>
             <option value="letter">Letter</option>
             <option value="mood">Mood</option>
           </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
            {[1,2,3].map(i => (
                <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-48 animate-pulse"></div>
            ))}
        </div>
      ) : posts?.length === 0 ? (
        <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PenTool size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 mb-4">It's quiet here.</p>
            <a href="/create" className="text-slate-800 font-semibold hover:underline">Share a moment</a>
        </div>
      ) : (
        <div className="space-y-6">
          {posts?.map((post) => (
            <PostCard key={post._id} post={post} mutate={mutate} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
