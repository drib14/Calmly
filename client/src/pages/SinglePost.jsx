import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useSWR from 'swr';
import PostCard from '../components/PostCard';
import { ArrowLeft, Loader as LoaderIcon } from 'lucide-react';
import { useIdentity } from '../context/IdentityContext';

const SinglePost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // Ensure identity context is available, though PostCard handles it internally too.
  const { currentIdentity } = useIdentity();

  const { data: post, error, isLoading, mutate } = useSWR(
    id ? `/posts/${id}` : null,
    async (url) => {
      const res = await axios.get(url);
      return res.data;
    }
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <LoaderIcon className="animate-spin text-secondary mb-4" size={32} />
        <p className="text-secondary font-serif">Finding moment...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 border border-soft-border">
          <span className="text-2xl">🍂</span>
        </div>
        <h2 className="text-xl font-serif font-bold text-text mb-2">Moment Unavailable</h2>
        <p className="text-secondary mb-6 max-w-sm">
          This post may have been deleted, or is visible only to a specific audience.
        </p>
        <button
          onClick={() => navigate('/feed')}
          className="px-6 py-2 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-4 px-2 md:px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-secondary hover:text-text mb-6 transition group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back</span>
      </button>

      <PostCard post={post} mutate={mutate} />
    </div>
  );
};

export default SinglePost;
