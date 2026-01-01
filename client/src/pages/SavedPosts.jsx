import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';
import { Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SavedPosts = () => {
  const navigate = useNavigate();

  // We need an endpoint to fetch saved posts.
  // We can add GET /api/posts/saved
  const { data: posts, mutate } = useSWR('/posts/saved', async (url) => {
      const res = await axios.get(url);
      return res.data;
  });

  return (
    <div className="max-w-2xl mx-auto pb-20 pt-4 px-4">
        <h1 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">
            <Bookmark /> Saved Posts
        </h1>

        {!posts ? (
            <Loader />
        ) : posts.length === 0 ? (
            <div className="text-center py-10 text-secondary">
                <p>No saved posts yet.</p>
                <button onClick={() => navigate('/feed')} className="text-primary font-bold hover:underline mt-2">
                    Explore Feed
                </button>
            </div>
        ) : (
            posts.map(post => (
                <PostCard key={post._id} post={post} mutate={mutate} />
            ))
        )}
    </div>
  );
};

export default SavedPosts;
