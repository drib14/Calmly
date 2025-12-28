import React, { useState } from 'react';
import axios from 'axios';
import useSWR, { mutate } from 'swr';
import { Lock, Unlock, Trash2, Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';

const fetcher = url => axios.get(url).then(res => res.data);

const Journal = () => {
  const { data: entries, error } = useSWR('/journal', fetcher);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isWriting, setIsWriting] = useState(false);

  // Editor State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Neutral');

  // Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  const handleSave = async () => {
    if (!content.trim()) return toast.error("Write something first");

    try {
        await axios.post('/journal', {
            title: title || 'Untitled',
            content,
            mood,
            tags: [],
            isLocked: true // Default locked
        });
        toast.success("Saved to Journal");
        setIsWriting(false);
        setTitle('');
        setContent('');
        mutate('/journal');
    } catch (err) {
        console.error(err);
        toast.error("Failed to save");
    }
  };

  const confirmDelete = (e, id) => {
      e.stopPropagation();
      setEntryToDelete(id);
      setShowDeleteModal(true);
  };

  const handleDelete = async () => {
      if (!entryToDelete) return;
      try {
          await axios.delete(`/journal/${entryToDelete}`);
          toast.success("Entry deleted");
          mutate('/journal');
          if (selectedEntry?._id === entryToDelete) setSelectedEntry(null);
      } catch (err) {
          console.error(err);
          toast.error("Failed to delete");
      }
      setShowDeleteModal(false);
      setEntryToDelete(null);
  };

  if (!entries && !error) return <div className="p-10 text-center">Loading your safe space...</div>;

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
        {/* Sidebar List */}
        <div className="w-1/3 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-slate-800">My Journal</h2>
                <button
                    onClick={() => { setIsWriting(true); setSelectedEntry(null); }}
                    className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-slate-700 transition"
                >
                    <Plus size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {entries?.length === 0 && (
                    <div className="text-center text-slate-400 py-10 text-sm">
                        No entries yet. Start writing...
                    </div>
                )}
                {entries?.map(entry => (
                    <div
                        key={entry._id}
                        onClick={() => { setSelectedEntry(entry); setIsWriting(false); }}
                        className={`p-4 rounded-2xl cursor-pointer transition border ${selectedEntry?._id === entry._id ? 'bg-slate-50 border-slate-200' : 'bg-white border-transparent hover:bg-slate-50'}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-slate-800 truncate pr-2">{entry.title}</h3>
                            {entry.isLocked ? <Lock size={12} className="text-slate-400 shrink-0" /> : <Unlock size={12} className="text-slate-400 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-2 font-serif">{entry.content}</p>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wide">
                            <span>{format(new Date(entry.createdAt), 'MMM d, yyyy')}</span>
                            <button onClick={(e) => confirmDelete(e, entry._id)} className="hover:text-red-500 p-1">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Main Content / Editor */}
        <div className="flex-1 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
            {isWriting ? (
                <div className="h-full flex flex-col animate-fadeIn">
                    <input
                        className="text-3xl font-serif font-bold text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 p-0 mb-4 w-full"
                        placeholder="Title your thoughts..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <div className="flex items-center space-x-4 mb-6">
                        <select
                            value={mood}
                            onChange={(e) => setMood(e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-slate-600 outline-none"
                        >
                            <option>Neutral</option>
                            <option>Happy</option>
                            <option>Sad</option>
                            <option>Anxious</option>
                        </select>
                        <div className="text-xs text-slate-400 flex items-center">
                            <Calendar size={12} className="mr-1" />
                            Today
                        </div>
                    </div>
                    <textarea
                        className="flex-1 w-full resize-none border-none focus:ring-0 p-0 font-serif text-lg leading-loose text-slate-700 placeholder:text-slate-300"
                        placeholder="Start writing..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <div className="flex justify-end pt-4">
                        <button onClick={handleSave} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-medium hover:bg-slate-800 transition">
                            Save Entry
                        </button>
                    </div>
                </div>
            ) : selectedEntry ? (
                <div className="h-full flex flex-col animate-fadeIn overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start mb-6">
                         <div>
                            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">{selectedEntry.title}</h1>
                            <div className="flex items-center space-x-3 text-xs text-slate-500 uppercase tracking-wide">
                                <span>{format(new Date(selectedEntry.createdAt), 'MMMM d, yyyy • h:mm a')}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span>{selectedEntry.mood}</span>
                            </div>
                         </div>
                    </div>
                    <div className="font-serif text-lg leading-loose text-slate-700 whitespace-pre-wrap">
                        {selectedEntry.content}
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <Lock size={48} className="mb-4 opacity-50" />
                    <p className="font-serif text-lg">Select an entry or start writing</p>
                </div>
            )}
        </div>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
            <div className="text-center">
                 <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <Trash2 size={24} />
                 </div>
                 <h3 className="text-xl font-bold mb-2">Delete Entry?</h3>
                 <p className="text-slate-500 mb-6 text-sm">This journal entry will be lost forever.</p>
                 <div className="flex space-x-3">
                     <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 bg-slate-100 rounded-lg">Cancel</button>
                     <button onClick={handleDelete} className="flex-1 py-2 bg-red-500 text-white rounded-lg">Delete</button>
                 </div>
            </div>
        </Modal>
    </div>
  );
};

export default Journal;
