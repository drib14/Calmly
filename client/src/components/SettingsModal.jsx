import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ChevronRight, Check, X, Smartphone, Globe, ExternalLink, Download, Sun, Moon, Trash2 } from 'lucide-react';
import axios from 'axios';
import PinInput from './PinInput';
import SelectionCard from './SelectionCard';
import Avatar from './Avatar';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const SettingsModal = ({ isOpen, onClose, setting, onUpdate, currentValue }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [toggleState, setToggleState] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [listItems, setListItems] = useState([]);
  const [newItem, setNewItem] = useState('');

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [journalPassword, setJournalPassword] = useState('');

  useEffect(() => {
      if (isOpen && setting) {
          setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setJournalPassword('');
          setFormData({});
          setNewItem('');
          setListItems([]);

          if (setting.type === 'toggle') {
              setToggleState(!!currentValue);
          }
          if (setting.type === 'select') {
              setFormData({ [setting.id]: currentValue });
          }
          if (setting.id === 'sessions') {
              fetchSessions();
          }
          if (setting.type === 'list') {
              fetchList(setting.id);
          }
      }
  }, [isOpen, setting, currentValue]);

  const fetchSessions = async () => {
      try {
          const res = await axios.get('/settings/sessions');
          setActiveSessions(res.data);
      } catch (err) {
          console.error(err);
          toast.error("Failed to load sessions");
      }
  };

  const fetchList = async (id) => {
      try {
          const endpoint = id === 'blockedUsers' ? '/settings/blocked-users' : '/settings/muted-keywords';
          const res = await axios.get(endpoint);
          setListItems(res.data);
      } catch (err) {
          console.error(err);
      }
  };

  const handleAddItem = async () => {
      if (!newItem.trim()) return;
      try {
          const res = await axios.post('/settings/muted-keywords', { keyword: newItem.trim() });
          setListItems(res.data);
          setNewItem('');
          toast.success("Keyword added");
      } catch (err) {
          toast.error("Failed to add");
      }
  };

  const handleRemoveItem = async (item) => {
      try {
          if (setting.id === 'blockedUsers') {
              await axios.delete(`/settings/blocked-users/${item._id}`);
              setListItems(listItems.filter(i => i._id !== item._id));
              toast.success("User unblocked");
          } else {
              await axios.delete(`/settings/muted-keywords/${encodeURIComponent(item)}`);
              setListItems(listItems.filter(i => i !== item));
              toast.success("Keyword removed");
          }
      } catch (err) {
          toast.error("Failed to remove");
      }
  };

  const handleToggle = async (val) => {
      if (setting.id === 'journalLocked') return;

      setToggleState(val); // Optimistic UI
      try {
          await axios.put('/settings', { [setting.id]: val });
          toast.success(`${setting.label} ${val ? 'Enabled' : 'Disabled'}`);
          onUpdate(setting.id, val);
      } catch (err) {
          setToggleState(!val); // Revert
          toast.error("Failed to update");
      }
  };

  const handleJournalLock = async () => {
      setLoading(true);
      try {
          const targetState = !toggleState;
          if (!journalPassword || journalPassword.length !== 4) {
              toast.error("Please enter a 4-digit PIN");
              setLoading(false);
              return;
          }

          await axios.put('/settings/journal-lock', {
              locked: targetState,
              password: journalPassword.join('')
          });

          setToggleState(targetState);
          onUpdate(setting.id, targetState);
          toast.success(targetState ? "Journal Locked" : "Journal Unlocked");
          onClose();
      } catch (err) {
          toast.error(err.response?.data?.message || "Failed to update journal lock");
      } finally {
          setLoading(false);
      }
  };

  const handleSelectChange = async (val) => {
      setFormData({ ...formData, [setting.id]: val });
      try {
          await axios.put('/settings', { [setting.id]: val });
          toast.success("Setting updated");
          onUpdate(setting.id, val);
      } catch (err) {
          toast.error("Failed to update");
      }
  };

  const handlePasswordChange = async (e) => {
      e.preventDefault();
      if (passwords.newPassword !== passwords.confirmPassword) return toast.error("Passwords do not match");
      setLoading(true);
      try {
          await axios.put('/settings/password', {
              currentPassword: passwords.currentPassword,
              newPassword: passwords.newPassword
          });
          toast.success("Password changed successfully");
          onClose();
      } catch (err) {
          toast.error(err.response?.data?.message || "Failed to change password");
      } finally {
          setLoading(false);
      }
  };

  const handleEmailChange = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
          await axios.put('/settings/email', { email: formData.email });
          toast.success("Email updated.");
          onClose();
      } catch (err) {
           toast.error(err.response?.data?.message || "Failed to update email");
      } finally {
          setLoading(false);
      }
  };

  const handleDownloadData = async () => {
      setLoading(true);
      try {
          const res = await axios.get('/settings/download-data');
          const data = res.data;
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'calmly_user_data.json';
          a.click();
          toast.success("Data export started");
          onClose();
      } catch (err) {
          toast.error("Failed to download data");
      } finally {
          setLoading(false);
      }
  };

  if (!setting) return null;

  const renderContent = () => {
      return (
        <div className="space-y-6">
          {setting.description && (
              <div className="bg-surface/50 border border-soft-border p-4 rounded-xl text-center">
                  <p className="text-sm text-secondary">{setting.description}</p>
              </div>
          )}

          {(() => {
            switch (setting.id) {
                case 'change_password':
                    return (
                        <form onSubmit={handlePasswordChange} className="space-y-4 text-left">
                           <div className="space-y-2">
                              <label className="text-xs font-bold text-secondary uppercase tracking-wider">Current Password</label>
                              <input type="password" required className="w-full border border-soft-border rounded-xl p-3 bg-background text-text focus:border-text focus:outline-none transition-colors"
                                  value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-xs font-bold text-secondary uppercase tracking-wider">New Password</label>
                              <input type="password" required className="w-full border border-soft-border rounded-xl p-3 bg-background text-text focus:border-text focus:outline-none transition-colors"
                                  value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-xs font-bold text-secondary uppercase tracking-wider">Confirm Password</label>
                              <input type="password" required className="w-full border border-soft-border rounded-xl p-3 bg-background text-text focus:border-text focus:outline-none transition-colors"
                                  value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} />
                           </div>
                           <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl mt-4 font-bold disabled:opacity-50 hover:bg-black transition-colors">
                               {loading ? 'Updating...' : 'Update Password'}
                           </button>
                        </form>
                    );

                case 'change_email':
                    return (
                        <form onSubmit={handleEmailChange} className="space-y-4 text-left">
                           <div className="space-y-2">
                              <label className="text-xs font-bold text-secondary uppercase tracking-wider">New Email Address</label>
                              <input type="email" required className="w-full border border-soft-border rounded-xl p-3 bg-background text-text focus:border-text focus:outline-none transition-colors"
                                  value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                           </div>
                           <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl mt-4 font-bold disabled:opacity-50 hover:bg-black transition-colors">
                               {loading ? 'Processing...' : 'Update Email'}
                           </button>
                        </form>
                    );

                case 'sessions':
                    return (
                        <div className="space-y-4 text-left">
                           <div className="bg-background rounded-xl border border-soft-border overflow-hidden">
                               {activeSessions.length === 0 ? (
                                   <div className="p-4 text-center text-secondary">Loading sessions...</div>
                               ) : (
                                   activeSessions.map((session, i) => (
                                       <div key={i} className={`flex items-center justify-between p-4 ${i !== activeSessions.length - 1 ? 'border-b border-soft-border' : ''}`}>
                                            <div className="flex items-center space-x-4">
                                                <div className="p-3 bg-surface rounded-full text-secondary">
                                                    <Smartphone size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-text">{session.deviceId || 'Unknown Device'}</p>
                                                    <p className="text-xs text-secondary truncate max-w-[150px]">{session.userAgent}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {session.current ? (
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Current</span>
                                                ) : (
                                                    <span className="text-xs text-secondary">{formatDistanceToNow(new Date(session.lastActive), { addSuffix: true })}</span>
                                                )}
                                            </div>
                                       </div>
                                   ))
                               )}
                           </div>
                           <p className="text-xs text-center text-secondary mt-4">
                               To log out of other devices, please use the "Log Out All Devices" option in the main menu.
                           </p>
                        </div>
                    );

                case 'download_data':
                    return (
                        <div className="text-center py-4">
                            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 text-text border border-soft-border">
                                <Download size={32} />
                            </div>
                            <button onClick={handleDownloadData} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors">
                                Download Archive
                            </button>
                        </div>
                    );

                default:
                    if (setting.id === 'journalLocked') {
                        return (
                            <div className="text-center py-4">
                                <div className="mb-8">
                                    <PinInput length={4} onChange={(pin) => setJournalPassword(pin)} />
                                </div>
                                <button
                                    onClick={handleJournalLock}
                                    disabled={loading || !journalPassword || journalPassword.length !== 4}
                                    className={`w-full py-3 rounded-xl font-bold transition text-white ${toggleState ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:opacity-50`}
                                >
                                    {loading ? 'Processing...' : (toggleState ? 'Unlock Journal' : 'Lock Journal')}
                                </button>
                            </div>
                        );
                    }

                    if (setting.type === 'toggle') {
                        return (
                            <div className="flex flex-col items-center py-4 space-y-6">
                                <div className={`w-16 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out flex items-center ${toggleState ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'}`}
                                     onClick={() => handleToggle(!toggleState)}>
                                    <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
                                </div>
                                <p className="text-sm font-medium text-secondary">
                                    {toggleState ? 'Enabled' : 'Disabled'}
                                </p>
                            </div>
                        );
                    }

                    if (setting.type === 'select') {
                         const cardOptions = setting.options?.map(opt => {
                            let icon = null;
                            if (opt.icon === 'Sun') icon = <Sun size={20} />;
                            if (opt.icon === 'Moon') icon = <Moon size={20} />;

                            if (typeof opt === 'object') {
                                return { value: opt.value, label: opt.label, description: opt.description, icon };
                            }
                            return { value: opt, label: opt };
                        });

                        return (
                            <div className="text-left space-y-2">
                                <SelectionCard
                                    options={cardOptions || []}
                                    value={formData[setting.id] || currentValue}
                                    onChange={handleSelectChange}
                                    columns={1}
                                />
                            </div>
                        );
                    }

                    if (setting.type === 'list' || setting.type === 'info') {
                        return (
                             <div className="text-left space-y-4">
                                {setting.type === 'info' ? (
                                    <a href="#" className="block w-full bg-surface border border-soft-border p-4 rounded-xl text-center text-text font-bold hover:bg-slate-50 transition-colors">
                                        Open Resource <ExternalLink size={16} className="inline ml-2"/>
                                    </a>
                                ) : (
                                    <>
                                        {setting.id === 'mutedKeywords' && (
                                            <div className="flex space-x-2">
                                                <input
                                                    className="flex-1 bg-background border border-soft-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-text transition-colors"
                                                    placeholder="Add keyword..."
                                                    value={newItem}
                                                    onChange={(e) => setNewItem(e.target.value)}
                                                />
                                                <button onClick={handleAddItem} className="bg-slate-900 text-white px-6 rounded-xl font-bold text-sm hover:bg-black transition-colors">Add</button>
                                            </div>
                                        )}

                                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar bg-surface/30 rounded-xl p-2">
                                            {listItems.length === 0 && <p className="text-sm text-secondary italic text-center py-6">List is empty.</p>}
                                            {listItems.map((item, i) => (
                                                <div key={i} className="flex justify-between items-center p-3 bg-background rounded-xl border border-soft-border shadow-sm">
                                                    {setting.id === 'blockedUsers' ? (
                                                        <div className="flex items-center space-x-3">
                                                            <Avatar identity={item} size="xs" />
                                                            <span className="text-sm font-bold text-text">{item.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-text font-medium">"{item}"</span>
                                                    )}
                                                    <button onClick={() => handleRemoveItem(item)} className="p-2 text-secondary hover:text-red-500 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                             </div>
                        );
                    }

                    return (
                        <div className="text-center py-8">
                            <p className="text-secondary">Configuration available soon.</p>
                        </div>
                    );
            }
          })()}
        </div>
      );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
        <div className="text-center mb-8 relative">
            <h3 className="text-xl font-serif font-bold text-text">{setting.label}</h3>
            {/* Decorative line */}
            <div className="absolute bottom-[-12px] left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-transparent via-soft-border to-transparent"></div>
        </div>
        {renderContent()}
    </Modal>
  );
};

export default SettingsModal;
