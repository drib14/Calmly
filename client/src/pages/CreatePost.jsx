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

  // Specialized Fields
  const [letterFields, setLetterFields] = useState({ header: 'Dear...', footer: 'Sincerely,', paperType: 'classic' });
  const [poemStyle, setPoemStyle] = useState({ backgroundColor: 'bg-white', font: 'font-serif', align: 'text-left' });

  const moods = ['Melancholy', 'Hopeful', 'Angry', 'Peaceful', 'Anxious', 'Numb', 'Grateful'];

  const paperStyles = [
      { id: 'classic', label: 'Classic', class: 'bg-amber-50 border-amber-100 text-amber-900' },
      { id: 'parchment', label: 'Parchment', class: 'bg-[#f0e6d2] border-[#e6dcc0] text-[#5c4b35]' },
      { id: 'dark', label: 'Midnight', class: 'bg-slate-900 border-slate-800 text-slate-200' },
      { id: 'lined', label: 'Notebook', class: 'bg-white border-blue-100 text-slate-800' }, // CSS for lines can be added later
  ];

  const poemBackgrounds = [
      { id: 'white', class: 'bg-white text-slate-900 border border-slate-100' },
      { id: 'dark', class: 'bg-slate-900 text-white' },
      { id: 'sunset', class: 'bg-gradient-to-br from-orange-100 to-rose-200 text-rose-900' },
      { id: 'ocean', class: 'bg-gradient-to-tr from-cyan-100 to-blue-200 text-blue-900' },
      { id: 'forest', class: 'bg-gradient-to-b from-emerald-50 to-teal-100 text-teal-900' },
      { id: 'midnight', class: 'bg-gradient-to-r from-slate-900 to-indigo-950 text-indigo-100' },
  ];

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

    // Validation: Must have content OR media (Unless it's a letter/poem which relies on content)
    if (!content.trim() && files.length === 0) {
        return alert("Please add text or media to your post.");
    }

    if (visibility === 'private') {
        // Journal Logic
        try {
            await axios.post('/journal', {
                title: title || 'Untitled',
                content: content || '[Media Entry]',
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

            if (type === 'letter') formData.append('letterFields', JSON.stringify(letterFields));
            if (type === 'poetry') formData.append('style', JSON.stringify(poemStyle));

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

        {type === 'letter' ? (
            <div className={`space-y-4 p-6 rounded-lg border shadow-sm transition-colors ${paperStyles.find(s => s.id === letterFields.paperType)?.class}`}>
                <div className="flex justify-end space-x-2 mb-2">
                    {paperStyles.map(s => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => setLetterFields({...letterFields, paperType: s.id})}
                            className={`w-6 h-6 rounded-full border border-slate-300 ${s.class.split(' ')[0]} ${letterFields.paperType === s.id ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                            title={s.label}
                        />
                    ))}
                </div>
                <input
                    type="text"
                    value={letterFields.header}
                    onChange={e => setLetterFields({...letterFields, header: e.target.value})}
                    className="w-full bg-transparent border-b border-current/20 focus:outline-none font-serif text-lg placeholder-current/50"
                    placeholder="Dear..."
                />
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="w-full bg-transparent border-none focus:ring-0 font-serif text-lg leading-relaxed placeholder-current/50 resize-none"
                    placeholder="Write your letter..."
                />
                <input
                    type="text"
                    value={letterFields.footer}
                    onChange={e => setLetterFields({...letterFields, footer: e.target.value})}
                    className="w-full bg-transparent border-t border-current/20 pt-2 focus:outline-none font-serif text-right placeholder-current/50"
                    placeholder="Sincerely,"
                />
            </div>
        ) : type === 'poetry' ? (
            <div className={`space-y-4 p-8 rounded-lg transition-colors shadow-sm ${poemStyle.backgroundColor}`}>
                <div className="flex space-x-4 mb-4 justify-between items-center">
                    <div className="flex space-x-2">
                        {poemBackgrounds.map(bg => (
                            <button
                                key={bg.id}
                                type="button"
                                onClick={() => setPoemStyle({...poemStyle, backgroundColor: bg.class})}
                                className={`w-6 h-6 rounded-full border border-black/10 ${bg.class.split(' ')[0] === 'bg-gradient-to-br' ? 'bg-gradient-to-br from-orange-100 to-rose-200' : bg.class.split(' ')[0]} ${poemStyle.backgroundColor === bg.class ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                            />
                        ))}
                    </div>
                    <select onChange={e => setPoemStyle({...poemStyle, align: e.target.value})} className="text-xs border rounded p-1 bg-white/50 backdrop-blur-sm">
                        <option value="text-left">Left</option>
                        <option value="text-center">Center</option>
                        <option value="text-right">Right</option>
                    </select>
                </div>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full bg-transparent border-b border-current/20 focus:outline-none text-2xl font-serif mb-4 placeholder-current/40 ${poemStyle.align}`}
                    placeholder="Untitled Poem"
                />
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    className={`w-full bg-transparent border-none focus:ring-0 text-lg leading-relaxed resize-none ${poemStyle.font} ${poemStyle.align} placeholder-current/40`}
                    placeholder="Verses go here..."
                />
            </div>
        ) : (
            <div>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required={files.length === 0}
                    rows={6}
                    className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-sage focus:outline-none font-serif text-lg"
                    placeholder="Write here..."
                />
            </div>
        )}

        {/* Media Preview (Hidden for Letters/Poems as requested) */}
        {type !== 'letter' && type !== 'poetry' && previews.length > 0 && (
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

                 {type !== 'letter' && type !== 'poetry' && (
                     <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
                         <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                         <Image size={20} />
                     </label>
                 )}
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
