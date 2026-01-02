import React, { useState, useEffect } from 'react';
import { useIdentity } from '../context/IdentityContext';
import { useSettings } from '../hooks/useSettings';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Image, X, Globe, Lock, EyeOff, Smile, Frown, Meh, CloudRain, Heart, Zap, Coffee, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import Avatar from '../components/Avatar';
import SelectionCard from '../components/SelectionCard';
import PillSelection from '../components/PillSelection';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import FeedbackModal from '../components/FeedbackModal';

const moods = [
    { value: 'Melancholy', label: 'Melancholy', icon: <CloudRain size={16} /> },
    { value: 'Hopeful', label: 'Hopeful', icon: <Zap size={16} /> },
    { value: 'Angry', label: 'Angry', icon: <Frown size={16} /> },
    { value: 'Peaceful', label: 'Peaceful', icon: <Coffee size={16} /> },
    { value: 'Anxious', label: 'Anxious', icon: <Meh size={16} /> },
    { value: 'Numb', label: 'Numb', icon: <Lock size={16} /> }, // Using Lock as abstraction for numb/closed off
    { value: 'Grateful', label: 'Grateful', icon: <Heart size={16} /> },
];

const postTypes = [
    { value: 'confession', label: 'Confession', description: 'Share a secret or a thought.' },
    { value: 'poetry', label: 'Poetry', description: 'Express yourself in verse.' },
    { value: 'letter', label: 'Letter', description: 'Write a letter to someone.' },
    { value: 'mood', label: 'Mood Drop', description: 'Just a vibe.' },
    { value: 'plain', label: 'Plain', description: 'Simple post.' },
];

// Expanded Styles for Letters (Textures)
const paperStyles = [
    { id: 'classic', label: 'Classic', class: 'bg-amber-50 text-amber-900 border-amber-100', texture: '' },
    { id: 'parchment', label: 'Parchment', class: 'bg-[#f0e6d2] text-[#5c4b35] border-[#e6dcc0]', texture: 'https://www.transparenttextures.com/patterns/aged-paper.png' },
    { id: 'lined', label: 'Lined', class: 'bg-white text-slate-800 border-blue-100', texture: 'https://www.transparenttextures.com/patterns/notebook.png' },
    { id: 'dark', label: 'Midnight', class: 'bg-slate-900 text-slate-200 border-slate-800', texture: 'https://www.transparenttextures.com/patterns/stardust.png' },
    { id: 'flower', label: 'Floral', class: 'bg-rose-50 text-rose-900 border-rose-100', texture: 'https://www.transparenttextures.com/patterns/flowers.png' },
];

// Expanded Colors for Poetry (10+)
const poemBackgrounds = [
    { id: 'white', class: 'bg-white text-slate-900 border border-slate-100', preview: 'bg-white border-slate-200' },
    { id: 'dark', class: 'bg-slate-900 text-white', preview: 'bg-slate-900' },
    { id: 'sunset', class: 'bg-gradient-to-br from-orange-100 to-rose-200 text-rose-900', preview: 'bg-gradient-to-br from-orange-100 to-rose-200' },
    { id: 'ocean', class: 'bg-gradient-to-tr from-cyan-100 to-blue-200 text-blue-900', preview: 'bg-gradient-to-tr from-cyan-100 to-blue-200' },
    { id: 'forest', class: 'bg-gradient-to-b from-emerald-50 to-teal-100 text-teal-900', preview: 'bg-gradient-to-b from-emerald-50 to-teal-100' },
    { id: 'midnight', class: 'bg-gradient-to-r from-slate-900 to-indigo-950 text-indigo-100', preview: 'bg-gradient-to-r from-slate-900 to-indigo-950' },
    { id: 'berry', class: 'bg-gradient-to-bl from-pink-200 to-purple-300 text-purple-900', preview: 'bg-gradient-to-bl from-pink-200 to-purple-300' },
    { id: 'lemon', class: 'bg-yellow-50 text-yellow-800 border border-yellow-100', preview: 'bg-yellow-50 border-yellow-200' },
    { id: 'sky', class: 'bg-sky-100 text-sky-800', preview: 'bg-sky-100' },
    { id: 'lavender', class: 'bg-violet-100 text-violet-900', preview: 'bg-violet-100' },
    { id: 'cherry', class: 'bg-red-50 text-red-900 border border-red-100', preview: 'bg-red-50 border-red-200' },
    { id: 'gray', class: 'bg-gray-100 text-gray-700', preview: 'bg-gray-100' },
];

const fontOptions = [
    { value: 'font-serif', label: 'Serif', fontClass: 'font-serif' },
    { value: 'font-sans', label: 'Sans', fontClass: 'font-sans' },
    { value: 'font-mono', label: 'Mono', fontClass: 'font-mono' },
    { value: 'font-[cursive]', label: 'Handwriting', fontClass: 'font-[cursive]' },
];

const alignOptions = [
    { value: 'text-left', label: 'Left', icon: <AlignLeft size={16} /> },
    { value: 'text-center', label: 'Center', icon: <AlignCenter size={16} /> },
    { value: 'text-right', label: 'Right', icon: <AlignRight size={16} /> },
];

const CreatePost = () => {
  const { identities, currentIdentity, selectIdentity, createPseudonym, deleteIdentity } = useIdentity();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [type, setType] = useState('confession');

  // Filter identities for Plain posts (Real & Anonymous only)
  const visibleIdentities = type === 'plain'
    ? identities.filter(id => id.type === 'real' || id.type === 'anonymous')
    : identities;
  const [mood, setMood] = useState('Neutral');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [showNewIdentity, setShowNewIdentity] = useState(false);
  const [newIdentityName, setNewIdentityName] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [creatingIdentity, setCreatingIdentity] = useState(false);
  const [deletingIdentity, setDeletingIdentity] = useState(false);

  // Modals
  const [showDeleteIdentityModal, setShowDeleteIdentityModal] = useState(false);
  const [identityToDelete, setIdentityToDelete] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Specialized Fields
  const [letterFields, setLetterFields] = useState({ header: 'Dear...', footer: 'Sincerely,', paperType: 'classic' });
  const [poemStyle, setPoemStyle] = useState({ backgroundColor: 'bg-white', font: 'font-serif', align: 'text-left' });

  useEffect(() => {
      if (settings) {
          if (settings.defaultPostType) setType(settings.defaultPostType);
          if (settings.defaultMood) setMood(settings.defaultMood);

          // Load Draft
          if (settings.enableDrafts) {
              const savedDraft = localStorage.getItem('post_draft');
              if (savedDraft) {
                  const draft = JSON.parse(savedDraft);
                  if (draft.content) setContent(draft.content);
                  if (draft.title) setTitle(draft.title);
                  if (draft.type) setType(draft.type);
                  if (draft.mood) setMood(draft.mood);
              }
          }
      }
  }, [settings]);

  // Force private visibility for Plain posts
  useEffect(() => {
      if (type === 'plain') {
          setVisibility('private');
      }
  }, [type]);

  // Save Draft
  useEffect(() => {
      if (settings?.enableDrafts) {
          const timeoutId = setTimeout(() => {
              const draft = { content, title, type, mood };
              if (content || title) {
                localStorage.setItem('post_draft', JSON.stringify(draft));
              }
          }, 1000);
          return () => clearTimeout(timeoutId);
      }
  }, [content, title, type, mood, settings]);

  const handleFileChange = (e) => {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length + files.length > 4) {
          toast.error("Max 4 files allowed");
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
      URL.revokeObjectURL(newPreviews[index]);
      newPreviews.splice(index, 1);
      setPreviews(newPreviews);
  };

  const checkFeedbackEligibility = () => {
      const postsCount = parseInt(localStorage.getItem('calmly_posts_count') || '0', 10) + 1;
      localStorage.setItem('calmly_posts_count', postsCount.toString());

      // Trigger on 1st, then every 3rd (1, 4, 7, 10...)
      if (postsCount === 1 || (postsCount - 1) % 3 === 0) {
          setShowFeedbackModal(true);
          return true;
      }
      return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && files.length === 0) {
        return toast.error("Please add text or media to your post.");
    }

    if (visibility === 'private') {
        try {
            await axios.post('/journal', {
                title: title || 'Untitled',
                content: content || '[Media Entry]',
                mood,
                tags: [],
                isLocked: false
            });
            localStorage.removeItem('post_draft'); // Clear draft
            toast.success("Journal entry saved");
            navigate('/journal');
        } catch (error) {
            console.error(error);
            toast.error("Failed to save journal entry");
        }
    } else {
        if (!currentIdentity) return toast.error("Select an identity");
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('identityId', currentIdentity._id);
            formData.append('type', type);
            formData.append('mood', mood);
            formData.append('content', content);
            formData.append('visibility', type === 'plain' ? 'private' : visibility); // Plain posts are private by default
            if ((type === 'poetry' || type === 'letter') && title) formData.append('title', title);

            if (type === 'letter') formData.append('letterFields', JSON.stringify(letterFields));
            if (type === 'poetry') formData.append('style', JSON.stringify(poemStyle));

            files.forEach(file => {
                formData.append('media', file);
            });

            await axios.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            localStorage.removeItem('post_draft'); // Clear draft

            const needsFeedback = checkFeedbackEligibility();
            if (!needsFeedback) {
                navigate('/feed');
            } else {
                // Stay for modal
            }

        } catch (error) {
            console.error(error);
            toast.error("Failed to post");
        } finally {
            setUploading(false);
        }
    }
  };

  const handleCreateIdentity = async (e) => {
      e.preventDefault();
      setCreatingIdentity(true);
      const res = await createPseudonym(newIdentityName, '');
      if (res.success) {
          setShowNewIdentity(false);
          setNewIdentityName('');
          toast.success("Identity created");
      }
      setCreatingIdentity(false);
  };

  const confirmDeleteIdentity = (id) => {
      setIdentityToDelete(id);
      setShowDeleteIdentityModal(true);
  };

  const executeDeleteIdentity = async () => {
      if (identityToDelete) {
          setDeletingIdentity(true);
          await deleteIdentity(identityToDelete);
          setShowDeleteIdentityModal(false);
          setIdentityToDelete(null);
          toast.success("Identity removed");
          setDeletingIdentity(false);
      }
  };

  return (
    <div className="max-w-2xl mx-auto bg-surface p-8 rounded-lg shadow-sm">
      <h2 className="text-2xl font-serif mb-6 text-text">Share a Moment</h2>

      {/* Identity Selector */}
      <div className="mb-6 p-4 bg-background rounded-2xl border border-soft-border">
          <label className="block text-xs font-bold uppercase tracking-wide text-secondary mb-3">Posting As</label>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {visibleIdentities.map(id => (
                  <div key={id._id} className="relative group">
                      <button
                        onClick={() => selectIdentity(id._id)}
                        className={`flex items-center space-x-3 pr-4 pl-2 py-2 rounded-full border transition whitespace-nowrap ${currentIdentity?._id === id._id ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-offset-2 ring-slate-200' : 'bg-surface text-secondary border-soft-border hover:border-slate-300'}`}
                      >
                          <Avatar identity={id} size="sm" />
                          <div className="flex flex-col items-start leading-none">
                              <span className="text-sm font-bold">{id.name}</span>
                              <span className="text-[9px] opacity-75 uppercase tracking-wider mt-0.5">{id.type}</span>
                          </div>
                      </button>
                      {id.type === 'pseudonym' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); confirmDeleteIdentity(id._id); }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                              <X size={10} />
                          </button>
                      )}
                  </div>
              ))}
              <button onClick={() => setShowNewIdentity(!showNewIdentity)} className="text-sm font-medium text-secondary hover:text-text whitespace-nowrap px-4 py-2 border border-dashed border-soft-border rounded-full hover:bg-surface transition">
                  + New Pseudonym
              </button>
          </div>

          {showNewIdentity && (
              <div className="mt-3 flex space-x-2">
                  <input
                    type="text"
                    placeholder="Pseudonym Name"
                    className="border border-soft-border bg-surface text-text rounded px-2 py-1 text-sm focus:outline-none"
                    value={newIdentityName}
                    onChange={(e) => setNewIdentityName(e.target.value)}
                  />
                  <button onClick={handleCreateIdentity} disabled={creatingIdentity} className="bg-sage text-white px-3 py-1 rounded text-sm disabled:opacity-50">
                    {creatingIdentity ? '...' : 'Create'}
                  </button>
              </div>
          )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
            <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-secondary mb-3">Format</label>
                <SelectionCard
                    options={postTypes}
                    value={type}
                    onChange={setType}
                    columns={2}
                />
            </div>
            {type !== 'plain' && (
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-secondary mb-3">Mood</label>
                    <SelectionCard
                        options={moods}
                        value={mood}
                        onChange={setMood}
                        columns={4}
                    />
                </div>
            )}
        </div>

        {type === 'letter' ? (
            <div className={`space-y-4 p-6 rounded-lg border shadow-sm transition-colors relative overflow-hidden ${paperStyles.find(s => s.id === letterFields.paperType)?.class}`}>
                {/* Texture overlay */}
                {paperStyles.find(s => s.id === letterFields.paperType)?.texture && (
                     <div
                        className="absolute inset-0 opacity-10 pointer-events-none bg-repeat"
                        style={{ backgroundImage: `url(${paperStyles.find(s => s.id === letterFields.paperType).texture})` }}
                     ></div>
                )}

                <div className="flex justify-end space-x-2 mb-2 relative z-10">
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
                    className="w-full bg-transparent border-b border-current/20 focus:outline-none font-serif text-lg placeholder-current/50 relative z-10"
                    placeholder="Dear..."
                />
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="w-full bg-transparent border-none focus:ring-0 font-serif text-lg leading-relaxed placeholder-current/50 resize-none relative z-10"
                    placeholder="Write your letter..."
                />
                <input
                    type="text"
                    value={letterFields.footer}
                    onChange={e => setLetterFields({...letterFields, footer: e.target.value})}
                    className="w-full bg-transparent border-t border-current/20 pt-2 focus:outline-none font-serif text-right placeholder-current/50 relative z-10"
                    placeholder="Sincerely,"
                />
            </div>
        ) : type === 'poetry' ? (
            <div className={`space-y-4 p-8 rounded-lg transition-colors shadow-sm ${poemStyle.backgroundColor}`}>
                <div className="flex space-x-4 mb-4 justify-between items-center">
                    <div className="flex space-x-2 flex-wrap gap-y-2">
                        {poemBackgrounds.map(bg => (
                            <button
                                key={bg.id}
                                type="button"
                                onClick={() => setPoemStyle({...poemStyle, backgroundColor: bg.class})}
                                className={`w-6 h-6 rounded-full border border-black/10 ${bg.preview} ${poemStyle.backgroundColor === bg.class ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                            />
                        ))}
                    </div>
                    <div className="flex flex-col space-y-2">
                        {/* Font Selection */}
                        <div className="bg-white/80 backdrop-blur-md rounded-xl p-2 border border-slate-200 shadow-sm">
                             <SelectionCard
                                options={fontOptions}
                                value={poemStyle.font}
                                onChange={(val) => setPoemStyle({...poemStyle, font: val})}
                                columns={2}
                                layout="grid"
                             />
                        </div>
                        {/* Align Selection */}
                         <div className="bg-white/80 backdrop-blur-md rounded-xl p-2 border border-slate-200 shadow-sm flex justify-center">
                            <PillSelection
                                options={alignOptions}
                                value={poemStyle.align}
                                onChange={(val) => setPoemStyle({...poemStyle, align: val})}
                            />
                        </div>
                    </div>
                </div>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full bg-transparent border-b border-current/20 focus:outline-none text-2xl mb-4 placeholder-current/40 ${poemStyle.align} ${poemStyle.font}`}
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
        ) : type === 'plain' ? (
             <div className={`space-y-4 p-8 rounded-lg transition-colors shadow-sm relative overflow-hidden ${poemStyle.backgroundColor} ${paperStyles.find(s => s.class === poemStyle.backgroundColor)?.class || ''}`}>

                 {/* Texture Overlay if matched from paperStyles */}
                 {paperStyles.find(s => s.class === poemStyle.backgroundColor)?.texture && (
                      <div
                        className="absolute inset-0 opacity-10 pointer-events-none bg-repeat z-0"
                        style={{ backgroundImage: `url(${paperStyles.find(s => s.class === poemStyle.backgroundColor).texture})` }}
                      ></div>
                 )}

                <div className="flex space-x-4 mb-4 justify-between items-center relative z-10">
                     <div className="flex space-x-2 flex-wrap gap-y-2">
                        {/* Colors */}
                        {poemBackgrounds.map(bg => (
                            <button
                                key={bg.id}
                                type="button"
                                onClick={() => setPoemStyle({...poemStyle, backgroundColor: bg.class})}
                                className={`w-6 h-6 rounded-full border border-black/10 ${bg.preview} ${poemStyle.backgroundColor === bg.class ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                            />
                        ))}
                        {/* Wallpapers (from paperStyles) */}
                        {paperStyles.map(s => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setPoemStyle({...poemStyle, backgroundColor: s.class})} // Reusing s.class as backgroundColor identifier
                                className={`w-6 h-6 rounded-full border border-slate-300 ${s.class.split(' ')[0]} ${poemStyle.backgroundColor === s.class ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                                title={s.label}
                            />
                        ))}
                    </div>
                     <div className="bg-white/80 backdrop-blur-md rounded-xl p-2 border border-slate-200 shadow-sm">
                             <SelectionCard
                                options={fontOptions}
                                value={poemStyle.font}
                                onChange={(val) => setPoemStyle({...poemStyle, font: val})}
                                columns={2}
                                layout="grid"
                             />
                    </div>
                </div>
                 <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    className={`w-full bg-transparent border-none focus:ring-0 text-lg leading-relaxed resize-none relative z-10 ${poemStyle.font} placeholder-current/40`}
                    placeholder="Share something..."
                />
            </div>
        ) : (
            <div>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required={files.length === 0}
                    rows={6}
                    className="w-full border border-soft-border bg-surface text-text rounded-md px-3 py-2 focus:ring-1 focus:ring-sage focus:outline-none font-serif text-lg"
                    placeholder="Write here..."
                />
            </div>
        )}

        {/* Media Preview */}
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

        <div className="flex justify-between items-center pt-4 border-t border-soft-border">
             <div className="flex items-center space-x-4">
                 <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={() => {
                            if (type !== 'plain') {
                                setVisibility(v => v === 'public' ? 'unlisted' : v === 'unlisted' ? 'private' : 'public');
                            }
                        }}
                        className={`flex items-center space-x-1 text-sm font-medium px-3 py-1.5 rounded-full transition ${type === 'plain' ? 'opacity-50 cursor-not-allowed text-secondary' : 'text-secondary hover:text-text hover:bg-background'}`}
                        title={type === 'plain' ? 'Plain posts are always private' : 'Click to cycle visibility'}
                        disabled={type === 'plain'}
                    >
                        {visibility === 'public' && <Globe size={16} />}
                        {visibility === 'unlisted' && <EyeOff size={16} />}
                        {visibility === 'private' && <Lock size={16} />}
                        <span className="capitalize">{visibility}</span>
                    </button>
                 </div>

                 {type !== 'letter' && type !== 'poetry' && (
                     <label className="cursor-pointer p-2 hover:bg-background rounded-full text-secondary transition">
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

      {/* Identity Delete Modal */}
      <Modal isOpen={showDeleteIdentityModal} onClose={() => setShowDeleteIdentityModal(false)}>
          <div className="text-center">
              <h3 className="text-xl font-bold mb-2 text-text">Delete Identity?</h3>
              <p className="text-secondary mb-6 text-sm">This will mark the identity as deleted. Your posts will remain but attribution will be anonymized.</p>
              <div className="flex space-x-3">
                  <button onClick={() => setShowDeleteIdentityModal(false)} disabled={deletingIdentity} className="flex-1 py-2 bg-background text-text rounded-lg disabled:opacity-50 border border-soft-border">Cancel</button>
                  <button onClick={executeDeleteIdentity} disabled={deletingIdentity} className="flex-1 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50">
                    {deletingIdentity ? 'Deleting...' : 'Delete'}
                  </button>
              </div>
          </div>
      </Modal>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
            setShowFeedbackModal(false);
            navigate('/feed');
        }}
      />
    </div>
  );
};

export default CreatePost;
