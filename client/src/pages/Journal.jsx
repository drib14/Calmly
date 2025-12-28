import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Lock, Unlock } from 'lucide-react';

const Journal = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await axios.get('/journal');
      setEntries(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      await axios.delete(`/journal/${id}`);
      setEntries(entries.filter(e => e._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-soft-dark">My Journal</h1>
        <a href="/create" className="text-sage font-medium">+ New Entry</a>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading your thoughts...</p>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg">
            <p className="text-gray-500 mb-4">Your journal is empty.</p>
            <p className="text-sm text-gray-400">Write for yourself. No one else will see it.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => (
            <div key={entry._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:border-sage transition relative group">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-serif text-gray-800">{entry.title}</h3>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                    {entry.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    <span>{formatDistanceToNow(new Date(entry.createdAt))} ago</span>
                </div>
              </div>

              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap font-serif mb-4">
                  {entry.content}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                   <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md text-xs">{entry.mood}</span>
                   <button
                     onClick={() => deleteEntry(entry._id)}
                     className="text-red-300 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition"
                   >
                       Delete
                   </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Journal;
