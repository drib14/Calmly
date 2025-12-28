import React, { useState } from 'react';
import { useIdentity } from '../context/IdentityContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreatePost = () => {
  const { identities, currentIdentity, selectIdentity, createPseudonym } = useIdentity();
  const navigate = useNavigate();

  const [type, setType] = useState('confession');
  const [mood, setMood] = useState('Neutral');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [showNewIdentity, setShowNewIdentity] = useState(false);
  const [newIdentityName, setNewIdentityName] = useState('');

  const moods = ['Melancholy', 'Hopeful', 'Angry', 'Peaceful', 'Anxious', 'Numb', 'Grateful'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    // For journals, identity is not strictly required (uses user), but for posts it is.
    if (visibility === 'private') {
        try {
            await axios.post('/journal', {
                title: title || 'Untitled',
                content,
                mood,
                tags: [],
                isLocked: false
            });
            navigate('/journal');
        } catch (error) {
            console.error(error);
            alert("Failed to save journal entry");
        }
    } else {
        if (!currentIdentity) return;
        try {
            await axios.post('/posts', {
                identityId: currentIdentity._id,
                type,
                mood,
                content,
                title: (type === 'poetry' || type === 'letter') ? title : undefined,
                visibility
            });
            navigate('/feed');
        } catch (error) {
            console.error(error);
            alert("Failed to post");
        }
    }
  };

  const handleCreateIdentity = async (e) => {
      e.preventDefault();
      const res = await createPseudonym(newIdentityName, '');
      if (res.success) {
          setShowNewIdentity(false);
          setNewIdentityName('');
      }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm">
      <h2 className="text-2xl font-serif mb-6">Share a Moment</h2>

      {/* Identity Selector */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-xs uppercase tracking-wide text-gray-500 mb-2">Posting As</label>
          <div className="flex items-center space-x-4 overflow-x-auto pb-2">
              {identities.map(id => (
                  <button
                    key={id._id}
                    onClick={() => selectIdentity(id._id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-full border transition whitespace-nowrap ${currentIdentity?._id === id._id ? 'bg-soft-dark text-white border-soft-dark' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
                  >
                      <span className="text-sm font-medium">{id.name}</span>
                      <span className="text-xs opacity-75">({id.type})</span>
                  </button>
              ))}
              <button onClick={() => setShowNewIdentity(!showNewIdentity)} className="text-sm text-sage hover:underline whitespace-nowrap">
                  + New Pseudonym
              </button>
          </div>

          {showNewIdentity && (
              <div className="mt-3 flex space-x-2">
                  <input
                    type="text"
                    placeholder="Pseudonym Name"
                    className="border rounded px-2 py-1 text-sm"
                    value={newIdentityName}
                    onChange={(e) => setNewIdentityName(e.target.value)}
                  />
                  <button onClick={handleCreateIdentity} className="bg-sage text-white px-3 py-1 rounded text-sm">Create</button>
              </div>
          )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-sage focus:outline-none"
                >
                    <option value="confession">Confession</option>
                    <option value="poetry">Poetry</option>
                    <option value="letter">Letter</option>
                    <option value="mood">Mood Drop</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
                <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-sage focus:outline-none"
                >
                    {moods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
        </div>

        {(type === 'poetry' || type === 'letter') && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-sage focus:outline-none"
                    placeholder={type === 'letter' ? 'Dear...' : 'Untitled'}
                />
            </div>
        )}

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={8}
                className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-sage focus:outline-none font-serif text-lg"
                placeholder="Write here..."
            />
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
             <div className="flex items-center space-x-2">
                 <label className="text-sm text-gray-600">Visibility:</label>
                 <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="text-sm border-none bg-transparent focus:ring-0"
                 >
                     <option value="public">Public</option>
                     <option value="unlisted">Unlisted</option>
                     <option value="private">Private (Journal)</option>
                 </select>
             </div>
             <button
                type="submit"
                className="bg-soft-dark text-white px-8 py-2 rounded-md hover:bg-gray-800 transition"
             >
                 Post
             </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
