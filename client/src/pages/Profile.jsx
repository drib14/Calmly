import React from 'react';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';
import axios from 'axios';
import { Calendar, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';

const fetcher = url => axios.get(url).then(res => res.data);

const Profile = () => {
  const { handle } = useParams();
  const { data, error, isLoading } = useSWR(`/profile/${handle}`, fetcher);

  if (isLoading) return <div className="text-center py-20 text-gray-400">Loading profile...</div>;
  if (error) return <div className="text-center py-20 text-red-400">User not found or private.</div>;

  const { identity, posts } = data;

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header Card */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden mb-6 shadow-sm">
          <div className="h-32 bg-gradient-to-r from-slate-200 to-slate-300"></div>
          <div className="px-6 pb-6 relative">
              {/* Avatar */}
              <div className="absolute -top-12 left-6 w-24 h-24 rounded-full border-4 border-white bg-white flex items-center justify-center shadow-sm">
                  <Avatar identity={identity} size="xl" />
              </div>

              <div className="mt-14 flex justify-between items-start">
                  <div>
                      <h1 className="text-2xl font-serif text-slate-900 font-bold">{identity.name}</h1>
                      <p className="text-slate-500 text-sm">{identity.handle}</p>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition flex items-center space-x-2">
                      <MessageCircle size={16} />
                      <span>Message</span>
                  </button>
              </div>

              {identity.bio && <p className="mt-4 text-slate-700 leading-relaxed font-serif text-sm">{identity.bio}</p>}

              <div className="mt-4 flex items-center space-x-4 text-xs text-slate-400 font-medium">
                   <div className="flex items-center space-x-1">
                       <Calendar size={14} />
                       <span>Joined {new Date(identity.createdAt).toLocaleDateString()}</span>
                   </div>
                   <div>
                       <span className="font-bold text-slate-900">{posts.length}</span> Moments
                   </div>
              </div>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
          <button className="px-4 py-3 text-sm font-bold text-slate-900 border-b-2 border-slate-900">Moments</button>
          <button className="px-4 py-3 text-sm font-medium text-slate-400 hover:text-slate-600 transition">Reposts</button>
      </div>

      {/* Posts Grid */}
      <div className="space-y-6">
          {posts.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                  <p className="text-slate-500">This soul is quiet for now.</p>
              </div>
          ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} mutate={() => {}} />
              ))
          )}
      </div>
    </div>
  );
};

export default Profile;
