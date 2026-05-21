import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useSWR, { mutate } from 'swr';
import { Lock, Unlock, Trash2, Plus, Calendar, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import PinInput from '../components/PinInput';
import PillSelection from '../components/PillSelection';

// Custom fetcher that includes PIN header
const fetcher = (url, pin) => axios.get(url, { headers: { 'x-journal-pin': pin } }).then(res => res.data);

const Journal = () => {
  const { user, loading } = useAuth();

  // Lock Logic
  // We default to true if we don't know yet (safety first), but if user loaded and not locked, we set false.
  // We strictly check user.settings.journalLocked on mount.
  const [isLocked, setIsLocked] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [journalPin, setJournalPin] = useState(null); // Store verified PIN in memory

  useEffect(() => {
      // If still loading, keep it locked (default true)
      // Once user is loaded:
      if (!loading && user) {
          if (user.settings?.journalLocked) {
              setIsLocked(true);
          } else {
              setIsLocked(false);
          }
      } else if (!loading && !user) {
          // If no user, maybe redirect? But component might unmount.
          setIsLocked(true);
      }
  }, [user, loading]);

  // Only fetch if unlocked AND we have the PIN (if one is required)
  // If user.settings.journalLocked is true, we MUST have journalPin to fetch.
  // If isLocked is true, shouldFetch is false.
  // If isLocked is false but settings.locked is true, we need pin.
  // We rely on isLocked state which is managed by unlock flow.

  const shouldFetch = user && !isLocked;

  const { data: entries, error } = useSWR(
      shouldFetch ? ['/journal', journalPin] : null,
      ([url, pin]) => fetcher(url, pin),
      {
          // Prevent retry on 403 to avoid loop
          shouldRetryOnError: (err) => {
              if (err.response && err.response.status === 403) return false;
              return true;
          }
      }
  );

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isWriting, setIsWriting] = useState(false);

  // Editor State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Neutral');
  const [saving, setSaving] = useState(false);

  // Mobile View State
  const [view, setView] = useState('list'); // 'list' or 'editor'

  // Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleUnlock = async (pin) => {
      setUnlocking(true);
      setPinError(false);
      try {
          await axios.post('/settings/journal-verify', { password: pin }); // Controller accepts password or pin
          setJournalPin(pin); // Store PIN in memory for subsequent API calls
          setIsLocked(false);
      } catch (err) {
          toast.error("Incorrect PIN");
          setPinError(true);
      } finally {
          setUnlocking(false);
      }
  };

  const handleEntryClick = (entry) => {
      setSelectedEntry(entry);
      setIsWriting(false);
      setView('editor');
  };

  const handleNewEntry = () => {
      setIsWriting(true);
      setSelectedEntry(null);
      setTitle('');
      setContent('');
      setMood('Neutral');
      setView('editor');
  };

  const handleBackToList = () => {
      setView('list');
  };

  const handleSave = async () => {
    if (!content.trim()) return toast.error("Write something first");

    setSaving(true);
    try {
        await axios.post('/journal', {
            title: title || 'Untitled',
            content,
            mood,
            tags: [],
            isLocked: true
        });
        toast.success("Saved to Journal");
        setIsWriting(false);
        setTitle('');
        setContent('');
        mutate(['/journal', journalPin]);
        setView('list');
    } catch (err) {
        console.error(err);
        toast.error("Failed to save");
    } finally {
        setSaving(false);
    }
  };

  const confirmDelete = (e, id) => {
      e.stopPropagation();
      setEntryToDelete(id);
      setShowDeleteModal(true);
  };

  const handleDelete = async () => {
      if (!entryToDelete) return;
      setDeleting(true);
      try {
          await axios.delete(`/journal/${entryToDelete}`);
          toast.success("Entry deleted");
          mutate(['/journal', journalPin]);
          if (selectedEntry?._id === entryToDelete) {
              setSelectedEntry(null);
              setView('list');
          }
      } catch (err) {
          console.error(err);
          toast.error("Failed to delete");
      }
      setDeleting(false);
      setShowDeleteModal(false);
      setEntryToDelete(null);
  };

  if (!user) return <div className="p-10 text-center">Loading Calmly...</div>;

  if (isLocked) {
      return (
          <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] flex flex-col items-center justify-center bg-surface rounded-3xl shadow-sm border border-soft-border p-6">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-6 text-accent">
                  <Lock size={32} />
              </div>
              <h2 className="text-2xl font-serif font-bold text-text mb-2">Journal Locked</h2>
              <p className="text-secondary mb-8">Please enter your 4-digit PIN.</p>

              <div className="w-full max-w-xs flex justify-center">
                  <PinInput
                    length={4}
                    onComplete={handleUnlock}
                    error={pinError}
                    onClear={pinError}
                  />
              </div>
              {unlocking && <p className="text-xs text-secondary mt-4 animate-pulse">Unlocking...</p>}
          </div>
      );
  }

  // Loading state for fetching entries
  if (!entries && !error) return <div className="p-10 text-center text-secondary">Decrypting journal...</div>;

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] flex gap-6 relative overflow-hidden bg-surface md:bg-transparent rounded-3xl md:rounded-none shadow-sm md:shadow-none border md:border-none border-soft-border">

        {/* Sidebar List */}
        <div className={clsx(
            "w-full md:w-1/3 bg-surface md:rounded-3xl p-6 md:shadow-sm md:border border-soft-border flex flex-col absolute md:relative h-full transition-transform duration-300 z-10",
            view === 'list' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-text">My Journal</h2>
                <button
                    onClick={handleNewEntry}
                    className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center hover:bg-slate-700 transition"
                >
                    <Plus size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {entries?.length === 0 && (
                    <div className="text-center text-secondary py-10 text-sm">
                        No entries yet. Start writing...
                    </div>
                )}
                {entries?.map(entry => (
                    <div
                        key={entry._id}
                        onClick={() => handleEntryClick(entry)}
                        className={`p-4 rounded-2xl cursor-pointer transition border ${selectedEntry?._id === entry._id ? 'bg-background border-soft-border' : 'bg-surface border-transparent hover:bg-background'}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-text truncate pr-2">{entry.title}</h3>
                            {entry.isLocked ? <Lock size={12} className="text-secondary shrink-0" /> : <Unlock size={12} className="text-secondary shrink-0" />}
                        </div>
                        <p className="text-xs text-secondary line-clamp-2 mb-2 font-serif">{entry.content}</p>
                        <div className="flex justify-between items-center text-[10px] text-secondary uppercase tracking-wide">
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
        <div className={clsx(
            "w-full md:flex-1 bg-surface md:rounded-3xl p-8 md:shadow-sm md:border border-soft-border flex flex-col absolute md:relative h-full transition-transform duration-300 bg-background/50 md:bg-surface",
            view === 'editor' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        )}>
            {/* Mobile Back Button */}
            <div className="md:hidden mb-4">
                <button onClick={handleBackToList} className="flex items-center text-secondary hover:text-text">
                    <ChevronLeft size={20} />
                    <span className="ml-1 text-sm font-bold">Back</span>
                </button>
            </div>

            {isWriting ? (
                <div className="h-full flex flex-col animate-fadeIn">
                    <input
                        className="text-3xl font-serif font-bold text-text placeholder:text-secondary border-none focus:ring-0 p-0 mb-4 w-full bg-transparent"
                        placeholder="Title your thoughts..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <div className="flex flex-col space-y-3 mb-6">
                        <div className="flex items-center justify-between">
                             <span className="text-xs font-bold text-secondary uppercase tracking-wide">Mood</span>
                             <div className="text-xs text-secondary flex items-center">
                                <Calendar size={12} className="mr-1" />
                                Today
                            </div>
                        </div>
                        <PillSelection
                            options={['Neutral', 'Happy', 'Sad', 'Anxious']}
                            value={mood}
                            onChange={setMood}
                        />
                    </div>
                    <textarea
                        className="flex-1 w-full resize-none border-none focus:ring-0 p-0 font-serif text-lg leading-loose text-text placeholder:text-secondary bg-transparent"
                        placeholder="Start writing..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-accent text-white px-6 py-2 rounded-xl font-medium hover:bg-slate-800 transition disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Entry'}
                        </button>
                    </div>
                </div>
            ) : selectedEntry ? (
                <div className="h-full flex flex-col animate-fadeIn overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start mb-6">
                         <div>
                            <h1 className="text-3xl font-serif font-bold text-text mb-2">{selectedEntry.title}</h1>
                            <div className="flex items-center space-x-3 text-xs text-secondary uppercase tracking-wide">
                                <span>{format(new Date(selectedEntry.createdAt), 'MMMM d, yyyy • h:mm a')}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span>{selectedEntry.mood}</span>
                            </div>
                         </div>
                    </div>
                    <div className="font-serif text-lg leading-loose text-text whitespace-pre-wrap">
                        {selectedEntry.content}
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-secondary">
                    <Lock size={48} className="mb-4 opacity-50" />
                    <p className="font-serif text-lg text-center px-4">Select an entry or start writing<br/><span className="text-sm opacity-70">Your secrets are safe here.</span></p>
                </div>
            )}
        </div>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
            <div className="text-center">
                 <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <Trash2 size={24} />
                 </div>
                 <h3 className="text-xl font-bold mb-2 text-text">Delete Entry?</h3>
                 <p className="text-slate-500 mb-6 text-sm">This journal entry will be lost forever.</p>
                 <div className="flex space-x-3">
                     <button onClick={() => setShowDeleteModal(false)} disabled={deleting} className="flex-1 py-2 bg-slate-100 rounded-lg disabled:opacity-50">Cancel</button>
                     <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50">
                        {deleting ? 'Deleting...' : 'Delete'}
                     </button>
                 </div>
            </div>
        </Modal>
    </div>
  );
};

export default Journal;
