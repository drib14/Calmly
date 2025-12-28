import React, { useState } from 'react';
import { useIdentity } from '../context/IdentityContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Image, X } from 'lucide-react';
import Avatar from '../components/Avatar';

const CreatePost = () => {
  const { identities, currentIdentity, selectIdentity, createPseudonym, deleteIdentity } = useIdentity();
  const navigate = useNavigate();

  const [type, setType] = useState('confession');
  const [mood, setMood] = useState('Neutral');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [showNewIdentity, setShowNewIdentity] = useState(false);
  const [newIdentityName, setNewIdentityName] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  const moods = ['Melancholy', 'Hopeful', 'Angry', 'Peaceful', 'Anxious', 'Numb', 'Grateful'];

  const handleFileChange = (e) => {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length + files.length > 4) {
          alert("Max 4 files allowed");
          return;
      }
      setFiles([...files, ...selectedFiles]);

      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);
  };

  const removeFile = (index) => {
      const newFiles = [...files];
      newFiles.splice(index, 1);
      setFiles(newFiles);

      const newPreviews = [...previews];
      URL.revokeObjectURL(newPreviews[index]); // Cleanup
      newPreviews.splice(index, 1);
      setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (visibility === 'private') {
        // Journal Logic (Skipping file upload for Journal MVP to keep it simple, or can add if needed)
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
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('identityId', currentIdentity._id);
            formData.append('type', type);
            formData.append('mood', mood);
            formData.append('content', content);
            formData.append('visibility', visibility);
            if ((type === 'poetry' || type === 'letter') && title) formData.append('title', title);

            files.forEach(file => {
                formData.append('media', file);
            });

            await axios.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate('/feed');
        } catch (error) {
            console.error(error);
            alert("Failed to post");
        } finally {
            setUploading(false);
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
      <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Posting As</label>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {identities.map(id => (
                  <div key={id._id} className="relative group">
                      <button
                        onClick={() => selectIdentity(id._id)}
                        className={`flex items-center space-x-3 pr-4 pl-2 py-2 rounded-full border transition whitespace-nowrap ${currentIdentity?._id === id._id ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-offset-2 ring-slate-200' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                      >
                          <Avatar identity={id} size="sm" />
                          <div className="flex flex-col items-start leading-none">
                              <span className="text-sm font-bold">{id.name}</span>
                              <span className="text-[9px] opacity-75 uppercase tracking-wider mt-0.5">{id.type}</span>
                          </div>
                      </button>
                      {id.type === 'pseudonym' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); if(window.confirm('Remove this identity?')) deleteIdentity(id._id); }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                              <X size={10} />
                          </button>
                      )}
                  </div>
              ))}
              <button onClick={() => setShowNewIdentity(!showNewIdentity)} className="text-sm font-medium text-slate-500 hover:text-slate-800 whitespace-nowrap px-4 py-2 border border-dashed border-slate-300 rounded-full hover:bg-slate-50 transition">
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

        {/* Media Preview */}
        {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-4">
                {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <img src={src} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5">
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
             <div className="flex items-center space-x-4">
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

                 <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
                     <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                     <Image size={20} />
                 </label>
             </div>

             <button
                type="submit"
                disabled={uploading}
                className="bg-slate-900 text-white px-8 py-2 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 flex items-center space-x-2 font-medium"
             >
                 {uploading ? <span>Publishing...</span> : <span>Post</span>}
             </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
