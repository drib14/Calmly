import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';
import SelectionCard from './SelectionCard';
import PillSelection from './PillSelection';
import { toast } from 'react-hot-toast';
import { Image, X, Globe, Lock, EyeOff, Smile, Frown, Meh, CloudRain, Heart, Zap, Coffee, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

const moods = [
    { value: 'Melancholy', label: 'Melancholy', icon: <CloudRain size={16} /> },
    { value: 'Hopeful', label: 'Hopeful', icon: <Zap size={16} /> },
    { value: 'Angry', label: 'Angry', icon: <Frown size={16} /> },
    { value: 'Peaceful', label: 'Peaceful', icon: <Coffee size={16} /> },
    { value: 'Anxious', label: 'Anxious', icon: <Meh size={16} /> },
    { value: 'Numb', label: 'Numb', icon: <Lock size={16} /> },
    { value: 'Grateful', label: 'Grateful', icon: <Heart size={16} /> },
];

const postTypes = [
    { value: 'confession', label: 'Confession', description: 'Share a secret or a thought.' },
    { value: 'poetry', label: 'Poetry', description: 'Express yourself in verse.' },
    { value: 'letter', label: 'Letter', description: 'Write a letter to someone.' },
    { value: 'mood', label: 'Mood Drop', description: 'Just a vibe.' },
];

const EditPostModal = ({ isOpen, onClose, post, mutate }) => {
    const [content, setContent] = useState('');
    const [type, setType] = useState('confession');
    const [mood, setMood] = useState('Neutral');
    const [visibility, setVisibility] = useState('public');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (post && isOpen) {
            setContent(post.content || '');
            setType(post.type || 'confession');
            setMood(post.mood || 'Neutral');
            setVisibility(post.visibility || 'public');
        }
    }, [post, isOpen]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put(`/posts/${post._id}`, {
                content,
                type,
                mood,
                visibility
            });
            toast.success("Post updated successfully");
            if (mutate) mutate();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update post");
        } finally {
            setSaving(false);
        }
    };

    if (!post) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="text-xl font-serif font-bold text-text">Edit Post</h3>
                    <p className="text-xs text-secondary">Update your moment.</p>
                </div>

                <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-secondary mb-2">Mood</label>
                        <PillSelection
                            options={moods}
                            value={mood}
                            onChange={setMood}
                        />
                    </div>

                    <div>
                         <label className="block text-xs font-bold uppercase tracking-wide text-secondary mb-2">Content</label>
                         <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={6}
                            className="w-full border border-soft-border bg-background text-text rounded-xl px-3 py-2 focus:ring-1 focus:ring-sage focus:outline-none font-serif text-sm resize-none"
                            placeholder="Edit your content..."
                        />
                    </div>

                    <div className="flex items-center justify-between">
                         <button
                            type="button"
                            onClick={() => setVisibility(v => v === 'public' ? 'unlisted' : v === 'unlisted' ? 'private' : 'public')}
                            className="flex items-center space-x-1 text-sm font-medium text-secondary hover:text-text px-3 py-2 rounded-lg bg-background border border-soft-border transition"
                         >
                            {visibility === 'public' && <Globe size={16} />}
                            {visibility === 'unlisted' && <EyeOff size={16} />}
                            {visibility === 'private' && <Lock size={16} />}
                            <span className="capitalize">{visibility}</span>
                        </button>

                         <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 font-medium"
                         >
                             {saving ? 'Saving...' : 'Save Changes'}
                         </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default EditPostModal;
