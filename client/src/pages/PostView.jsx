import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import axios from 'axios';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';
import { ChevronLeft } from 'lucide-react';

const PostView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: post, error, mutate } = useSWR(`/posts/${id}`, async (url) => {
      const res = await axios.get(url);
      return res.data;
  }, { refreshInterval: 5000 });

  if (error) return (
      <div className="flex flex-col items-center justify-center h-screen text-secondary">
          <p className="mb-4">Post not found or unavailable.</p>
          <button onClick={() => navigate('/feed')} className="text-primary font-bold hover:underline">
              Go Home
          </button>
      </div>
  );

  if (!post) return <Loader />;

  return (
    <div className="max-w-2xl mx-auto pb-20 pt-4 px-4">
        <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-secondary hover:text-text transition mb-4"
        >
            <ChevronLeft size={20} />
            <span className="text-sm font-bold">Back</span>
        </button>

        <PostCard post={post} mutate={mutate} />
    </div>
  );
};

export default PostView;
