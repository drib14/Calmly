import React, { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import { toast } from 'react-hot-toast';

const EditPostModal = ({ isOpen, onClose, post, onUpdate }) => {
  const [content, setContent] = useState(post.content || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
      setSaving(true);
      try {
          // Assuming backend supports PATCH /posts/:id
          // If not, I might need to implement it. Check postRoutes.js
          const res = await axios.put(`/posts/${post._id}`, { content });
          toast.success("Post updated");
          if (onUpdate) onUpdate(res.data);
          onClose();
      } catch (err) {
          console.error(err);
          toast.error("Failed to update post");
      } finally {
          setSaving(false);
      }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-text">Edit Post</h3>
            <textarea
                className="w-full bg-background border border-soft-border rounded-xl p-3 text-sm focus:ring-1 focus:ring-slate-900 outline-none resize-none text-text"
                rows="6"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
                <button onClick={onClose} className="px-4 py-2 bg-background border border-soft-border rounded-xl text-sm font-medium text-text hover:bg-surface transition">Cancel</button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    </Modal>
  );
};

export default EditPostModal;
