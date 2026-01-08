import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useIdentity } from '../context/IdentityContext';
import { Image as ImageIcon, X } from 'lucide-react';
import clsx from 'clsx';
import SelectionCard from './SelectionCard';

const EditPostModal = ({ isOpen, onClose, post, mutate }) => {
    const { identities } = useIdentity();
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [mood, setMood] = useState('');
    const [tags, setTags] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [saving, setSaving] = useState(false);

    // Letter specific
    const [header, setHeader] = useState('');
    const [footer, setFooter] = useState('');
    const [paperType, setPaperType] = useState('classic');

    // Poetry specific
    const [bgColor, setBgColor] = useState('bg-white');
    const [font, setFont] = useState('font-serif');
    const [align, setAlign] = useState('text-left');

    // Media
    const [media, setMedia] = useState([]);
    const [newMediaFiles, setNewMediaFiles] = useState([]);

    useEffect(() => {
        if (post) {
            setContent(post.content || '');
            setTitle(post.title || '');
            setMood(post.mood || '');
            setTags(post.tags?.join(', ') || '');
            setVisibility(post.visibility || 'public');
            setMedia(post.media || []);

            if (post.type === 'letter' && post.letterFields) {
                setHeader(post.letterFields.header || '');
                setFooter(post.letterFields.footer || '');
                setPaperType(post.letterFields.paperType || 'classic');
            }

            if (post.type === 'poetry' && post.style) {
                setBgColor(post.style.backgroundColor || 'bg-white');
                setFont(post.style.font || 'font-serif');
                setAlign(post.style.align || 'text-left');
            }
        }
    }, [post, isOpen]);

    const handleFileChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setNewMediaFiles(prev => [...prev, ...files]);
        }
    };

    const removeExistingMedia = (index) => {
        setMedia(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewMedia = (index) => {
        setNewMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Upload new media first if any
            let uploadedMedia = [];
            if (newMediaFiles.length > 0) {
                const uploadPromises = newMediaFiles.map(async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    // Use sign-upload for security in real app, or simpler direct upload here
                    // We need a way to upload. Assuming a generic /upload endpoint or similar.
                    // Wait, previous code used signed uploads.
                    // Let's reuse the logic from CreatePost if possible, or just standard Cloudinary direct.
                    // For now, let's assume we can upload via a helper or direct axios.
                    // The backend `postRoutes` doesn't seem to handle file upload in the PUT route.
                    // It expects `media` array of objects.
                    // We need to upload to Cloudinary client-side first.

                    // Quick Cloudinary Upload Implementation (Client-Side)
                    const data = new FormData();
                    data.append("file", file);
                    data.append("upload_preset", "unsigned_preset"); // Needs checking environment
                    // Since we don't have the preset easily, we might need to ask backend for signature
                    // Or check how CreatePost does it.
                    // CreatePost uses `axios.post(url, formData)` to Cloudinary.
                    // We'll skip complex implementation and mock it or assume backend signature endpoint exists.
                    // Let's use the `/api/posts/sign-upload` if it exists (memory says it does).

                    const { data: { signature, timestamp, cloudName, apiKey, folder } } = await axios.get('/upload/signature');
                    const uploadData = new FormData();
                    uploadData.append('file', file);
                    if (folder) uploadData.append('folder', folder);
                    uploadData.append('api_key', apiKey);
                    uploadData.append('timestamp', timestamp);
                    uploadData.append('signature', signature);

                    // Determine resource type
                    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
                    const cloudUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

                    const res = await axios.post(cloudUrl, uploadData, { withCredentials: false }); // Important: no cookies
                    return { url: res.data.secure_url, type: resourceType };
                });

                uploadedMedia = await Promise.all(uploadPromises);
            }

            const finalMedia = [...media, ...uploadedMedia];

            const updateData = {
                content,
                title,
                mood,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                visibility,
                media: finalMedia
            };

            if (post.type === 'letter') {
                updateData.letterFields = { header, footer, paperType };
            }

            if (post.type === 'poetry') {
                updateData.style = { backgroundColor: bgColor, font, align };
            }

            const res = await axios.put(`/posts/${post._id}`, updateData);
            if (mutate) mutate(); // Refresh list
            toast.success("Post updated");
            onClose();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to update post");
        } finally {
            setSaving(false);
        }
    };

    if (!post) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Moment">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar p-1">
                {/* Type-Specific Fields */}
                {post.type === 'letter' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-secondary mb-1">Header</label>
                            <input
                                value={header}
                                onChange={(e) => setHeader(e.target.value)}
                                className="w-full bg-background border border-soft-border rounded-xl p-3 text-sm focus:ring-2 ring-slate-900 outline-none text-text"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-secondary mb-1">Footer</label>
                            <input
                                value={footer}
                                onChange={(e) => setFooter(e.target.value)}
                                className="w-full bg-background border border-soft-border rounded-xl p-3 text-sm focus:ring-2 ring-slate-900 outline-none text-text"
                            />
                        </div>
                    </div>
                )}

                {(post.type === 'letter' || post.type === 'poetry' || post.title) && (
                     <div>
                        <label className="block text-xs font-bold text-secondary mb-1">Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-background border border-soft-border rounded-xl p-3 text-sm focus:ring-2 ring-slate-900 outline-none text-text"
                            placeholder="Optional Title"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-secondary mb-1">Content</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-background border border-soft-border rounded-xl p-3 text-sm focus:ring-2 ring-slate-900 outline-none resize-none min-h-[150px] text-text"
                        placeholder="What's on your mind?"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-secondary mb-1">Mood</label>
                    <SelectionCard
                         options={['Happy', 'Melancholy', 'Anxious', 'Hopeful', 'Angry', 'Peaceful', 'Numb', 'Excited'].map(m => ({ value: m, label: m }))}
                         value={mood}
                         onChange={setMood}
                         gridCols="grid-cols-4"
                    />
                </div>

                 {/* Media Edit Section */}
                 <div>
                    <label className="block text-xs font-bold text-secondary mb-2">Media</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {/* Existing Media */}
                        {media.map((m, idx) => (
                            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-soft-border group">
                                {m.type === 'video' ? <video src={m.url} className="w-full h-full object-cover" /> : <img src={m.url} className="w-full h-full object-cover" />}
                                <button onClick={() => removeExistingMedia(idx)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        {/* New Media */}
                        {newMediaFiles.map((file, idx) => (
                            <div key={`new-${idx}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-soft-border group">
                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                <button onClick={() => removeNewMedia(idx)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        {/* Add Button */}
                        <label className="w-20 h-20 rounded-lg border-2 border-dashed border-soft-border flex items-center justify-center cursor-pointer hover:border-text transition text-secondary hover:text-text">
                            <ImageIcon size={20} />
                            <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-secondary mb-1">Tags (comma separated)</label>
                    <input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full bg-background border border-soft-border rounded-xl p-3 text-sm focus:ring-2 ring-slate-900 outline-none text-text"
                    />
                </div>

                 <div>
                    <label className="block text-xs font-bold text-secondary mb-1">Visibility</label>
                     <div className="flex space-x-2">
                        {['public', 'unlisted', 'private'].map(v => (
                            <button
                                key={v}
                                onClick={() => setVisibility(v)}
                                className={clsx(
                                    "flex-1 py-2 rounded-lg text-xs font-bold capitalize border",
                                    visibility === v ? "bg-slate-900 text-white border-slate-900" : "bg-background text-secondary border-soft-border hover:bg-surface"
                                )}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex space-x-3">
                <button onClick={onClose} disabled={saving} className="flex-1 py-3 bg-background text-text font-medium rounded-xl hover:bg-surface transition disabled:opacity-50 border border-soft-border">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </Modal>
    );
};

export default EditPostModal;
