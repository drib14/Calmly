import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Filter, MessageCircle, Heart } from 'lucide-react';
import { useIdentity } from '../context/IdentityContext';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', mood: '' });
  const [expandedPost, setExpandedPost] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [messageTarget, setMessageTarget] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const { currentIdentity } = useIdentity();

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.type) params.type = filter.type;
      if (filter.mood) params.mood = filter.mood;

      const res = await axios.get('/posts/feed', { params });
      setPosts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleComments = async (postId) => {
      if (expandedPost === postId) {
          setExpandedPost(null);
      } else {
          setExpandedPost(postId);
          if (!comments[postId]) {
              try {
                  const res = await axios.get(`/comments/${postId}`);
                  setComments(prev => ({ ...prev, [postId]: res.data }));
              } catch (err) {
                  console.error(err);
              }
          }
      }
  };

  const postComment = async (postId) => {
      if (!newComment.trim() || !currentIdentity) return;
      try {
          const res = await axios.post(`/comments/${postId}`, {
              content: newComment,
              identityId: currentIdentity._id
          });
          setComments(prev => ({
              ...prev,
              [postId]: [...(prev[postId] || []), res.data]
          }));
          setNewComment('');
      } catch (err) {
          console.error(err);
          alert("Failed to post comment");
      }
  };

  const sendMessage = async () => {
      if (!messageContent.trim() || !currentIdentity || !messageTarget) return;
      try {
          await axios.post('/messages', {
              senderIdentityId: currentIdentity._id,
              recipientIdentityId: messageTarget.identity._id,
              content: messageContent
          });
          setMessageTarget(null);
          setMessageContent('');
          alert("Message sent.");
      } catch (error) {
          console.error(error);
          alert("Failed to send message");
      }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-soft-dark">Quiet Feed</h1>

        <div className="flex space-x-2">
           {/* Simple Filter UI */}
           <select
             className="border rounded-md px-2 py-1 text-sm bg-transparent"
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

      {loading ? (
        <p className="text-center text-gray-500">Loading moments...</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg">
            <p className="text-gray-500 mb-4">It's quiet here. Be the first to share.</p>
            <a href="/create" className="text-sage font-medium">Write something</a>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:border-gray-200 transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                   {post.identity.avatar ? (
                       <img src={post.identity.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                   ) : (
                       <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                           {post.identity.name[0]}
                       </div>
                   )}
                   <div>
                       <p className="text-sm font-semibold text-gray-800">{post.identity.name}</p>
                       <p className="text-xs text-gray-400">
                           {post.identity.type === 'real' ? 'Real Identity' : post.identity.type === 'anonymous' ? 'Anonymous' : 'Pseudonym'} • {formatDistanceToNow(new Date(post.createdAt))} ago
                       </p>
                   </div>
                </div>
                <span className="px-2 py-1 bg-gray-50 text-xs rounded-full text-gray-500 uppercase tracking-wide">{post.type}</span>
              </div>

              {post.title && <h3 className="text-xl font-serif mb-2 text-gray-900">{post.title}</h3>}

              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap font-serif text-lg mb-4">
                  {post.content}
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                  <div className="flex space-x-2 text-xs text-gray-500">
                      <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md">{post.mood}</span>
                      {post.tags.map(tag => (
                          <span key={tag} className="bg-gray-100 px-2 py-1 rounded-md">#{tag}</span>
                      ))}
                  </div>

                  <div className="flex space-x-4 text-gray-400">
                      <button className="flex items-center space-x-1 hover:text-red-400 transition">
                          <Heart size={18} />
                      </button>
                      <button onClick={() => toggleComments(post._id)} className="flex items-center space-x-1 hover:text-sage transition">
                          <MessageCircle size={18} />
                      </button>
                      <button onClick={() => setMessageTarget(post)} className="flex items-center space-x-1 hover:text-sage transition text-xs">
                          DM
                      </button>
                  </div>
              </div>

              {expandedPost === post._id && (
                  <div className="mt-4 pt-4 border-t border-gray-50 bg-gray-50 -mx-6 px-6 pb-6 rounded-b-lg">
                      <h4 className="text-sm font-semibold mb-3">Comments</h4>

                      <div className="space-y-3 mb-4">
                          {comments[post._id]?.map(comment => (
                              <div key={comment._id} className="text-sm">
                                  <span className="font-semibold text-gray-700">{comment.identity.name}: </span>
                                  <span className="text-gray-600">{comment.content}</span>
                              </div>
                          ))}
                          {comments[post._id]?.length === 0 && <p className="text-xs text-gray-400">No comments yet.</p>}
                      </div>

                      <div className="flex space-x-2">
                          <input
                            type="text"
                            className="flex-1 text-sm border rounded px-3 py-2"
                            placeholder="Write a supportive comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          />
                          <button onClick={() => postComment(post._id)} className="bg-soft-dark text-white text-xs px-3 rounded">Post</button>
                      </div>
                      {!currentIdentity && <p className="text-xs text-red-400 mt-1">Select an identity above to comment.</p>}
                  </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Message Modal */}
      {messageTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-serif mb-4">Message to {messageTarget.identity.name}</h3>
                  <textarea
                      className="w-full border rounded-md p-3 mb-4 h-32"
                      placeholder="Write your message..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                  />
                  <div className="flex justify-end space-x-3">
                      <button onClick={() => setMessageTarget(null)} className="px-4 py-2 text-gray-600">Cancel</button>
                      <button onClick={sendMessage} className="px-4 py-2 bg-soft-dark text-white rounded-md">Send</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Feed;
