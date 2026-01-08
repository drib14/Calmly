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

    useEffect(() => {
        if (post) {
            setContent(post.content || '');
            setTitle(post.title || '');
            setMood(post.mood || '');
            setTags(post.tags?.join(', ') || '');
            setVisibility(post.visibility || 'public');

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

    const handleSave = async () => {
        setSaving(true);
        try {
            const updateData = {
                content,
                title,
                mood,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                visibility
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
