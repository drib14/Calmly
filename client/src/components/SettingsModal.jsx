import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ChevronRight, Check, X, Smartphone, Globe, ExternalLink, Download } from 'lucide-react';
import axios from 'axios';
import PinInput from './PinInput';
import SelectionCard from './SelectionCard';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const SettingsModal = ({ isOpen, onClose, setting, onUpdate, currentValue }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [toggleState, setToggleState] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);

  // Specific states for password change
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  // Specific state for journal lock
  const [journalPassword, setJournalPassword] = useState('');

  useEffect(() => {
      if (isOpen && setting) {
          setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setJournalPassword('');
          setFormData({});

          if (setting.type === 'toggle') {
              setToggleState(!!currentValue);
          }
          if (setting.type === 'select') {
              setFormData({ [setting.id]: currentValue });
          }
          if (setting.id === 'sessions') {
              fetchSessions();
          }
      }
  }, [isOpen, setting, currentValue]);

  const fetchSessions = async () => {
      try {
          const res = await axios.get('/settings/sessions');
          setActiveSessions(res.data);
      } catch (err) {
          console.error(err);
      }
  };

  if (!setting) return null;

  const handleToggle = async (val) => {
      // Special handling for journal lock
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
          // If we are enabling (toggleState is currently false), we are sending locked=true
          // If we are disabling (toggleState is currently true), we are sending locked=false
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
          toast.success("Email updated. Please verify.");
          onClose();
      } catch (err) {
           toast.error(err.response?.data?.message || "Failed to update email");
      } finally {
          setLoading(false);
      }
  };

  const handleDownloadData = () => {
      // Mock download functionality
      const data = { message: "User Data Export", timestamp: new Date() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'calmly_user_data.json';
      a.click();
      toast.success("Data export started");
      onClose();
  };

  const renderContent = () => {
      return (
        <>
          {setting.description && (
              <p className="text-sm text-secondary mb-6 px-4 bg-background p-3 rounded-xl border border-soft-border mx-auto max-w-sm text-center">
                  {setting.description}
              </p>
          )}
          {(() => {
            switch (setting.id) {
                case 'change_password':
                    return (
                        <form onSubmit={handlePasswordChange} className="space-y-4 text-left">
                      <div>
                          <label className="text-xs font-bold text-secondary uppercase">Current Password</label>
                          <input type="password" required className="w-full border border-soft-border rounded-xl p-3 mt-1 bg-background text-text"
                              value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-secondary uppercase">New Password</label>
                          <input type="password" required className="w-full border border-soft-border rounded-xl p-3 mt-1 bg-background text-text"
                              value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-secondary uppercase">Confirm Password</label>
                          <input type="password" required className="w-full border border-soft-border rounded-xl p-3 mt-1 bg-background text-text"
                              value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} />
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-accent text-white py-3 rounded-xl mt-4 font-bold disabled:opacity-50">
                          {loading ? 'Updating...' : 'Update Password'}
                      </button>
                  </form>
              );

                case 'change_email':
                    return (
                        <form onSubmit={handleEmailChange} className="space-y-4 text-left">
                      <div>
                          <label className="text-xs font-bold text-secondary uppercase">New Email Address</label>
                          <input type="email" required className="w-full border border-soft-border rounded-xl p-3 mt-1 bg-background text-text"
                              value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-accent text-white py-3 rounded-xl mt-4 font-bold disabled:opacity-50">
                          {loading ? 'Sending Verification...' : 'Update Email'}
                      </button>
                  </form>
               );

                case 'sessions':
                    return (
                        <div className="space-y-4 text-left max-h-[300px] overflow-y-auto custom-scrollbar">
                      {activeSessions.map((session, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-soft-border">
                              <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-background rounded-lg shadow-sm text-secondary">
                                      <Smartphone size={20} />
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-text">{session.deviceId || 'Unknown Device'}</p>
                                      <p className="text-xs text-secondary truncate max-w-[180px]">{session.userAgent}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  {session.current ? (
                                      <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">Current</span>
                                  ) : (
                                      <span className="text-xs text-secondary">{formatDistanceToNow(new Date(session.lastActive), { addSuffix: true })}</span>
                                  )}
                              </div>
                          </div>
                      ))}
                      <div className="text-center mt-4">
                          <p className="text-xs text-secondary">Log out of all other sessions from the main menu.</p>
                      </div>
                  </div>
              );

                case 'download_data':
                    return (
                        <div className="text-center">
                      <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                          <Download size={32} />
                      </div>
                      <p className="text-secondary mb-6 px-4">
                          Download a copy of your personal data, posts, and journal entries in JSON format.
                      </p>
                      <button onClick={handleDownloadData} className="w-full bg-accent text-white py-3 rounded-xl font-bold hover:opacity-90">
                          Download Archive
                      </button>
                  </div>
              );

                default:
                    if (setting.id === 'journalLocked') {
                        return (
                            <div className="text-center py-6">
                                <p className="text-secondary mb-6 px-4">
                                    {toggleState
                                        ? "Enter your journal PIN to unlock it."
                                        : "Create a 4-digit PIN to lock your journal."}
                                </p>
                          <div className="flex justify-center mb-6">
                              <PinInput length={4} onChange={(pin) => setJournalPassword(pin)} />
                          </div>
                          <button
                              onClick={handleJournalLock}
                              disabled={loading || !journalPassword || journalPassword.length !== 4}
                              className={`w-full py-3 rounded-xl font-bold transition text-white ${toggleState ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-50`}
                          >
                              {loading ? 'Processing...' : (toggleState ? 'Unlock Journal' : 'Lock Journal')}
                          </button>
                      </div>
                  );
              }

                    if (setting.type === 'toggle') {
                        return (
                            <div className="text-center py-6">
                                <p className="text-text font-medium mb-6 px-4">
                              {toggleState
                                ? `Currently enabled.`
                                : `Currently disabled.`}
                          </p>
                          <div className="flex justify-center space-x-4">
                              <button
                                onClick={() => handleToggle(false)}
                                className={`px-6 py-3 rounded-xl font-bold transition ${!toggleState ? 'bg-soft-border text-secondary cursor-default' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                              >
                                  Disable
                              </button>
                              <button
                                onClick={() => handleToggle(true)}
                                className={`px-6 py-3 rounded-xl font-bold transition ${toggleState ? 'bg-soft-border text-secondary cursor-default' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                              >
                                  Enable
                              </button>
                          </div>
                      </div>
                  );
              }

                    if (setting.type === 'select') {
                        // Transform options to unified format for SelectionCard
                        const cardOptions = setting.options?.map(opt => {
                            if (typeof opt === 'object') {
                                return { value: opt.value, label: opt.label, description: opt.description };
                            }
                            return { value: opt, label: opt }; // Simple string
                        });

                        return (
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-secondary uppercase">Select Option</label>
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
                            <div className="text-center">
                          <p className="text-secondary mb-6">Manage {setting.label}</p>
                           <div className="bg-background p-4 rounded-xl mb-4 border border-soft-border">
                               <p className="text-sm text-secondary">
                                   {setting.type === 'info' ? 'External link or static content.' : 'List management will be available here.'}
                               </p>
                           </div>
                           {setting.type === 'info' && (
                               <a href="#" className="flex items-center justify-center space-x-2 text-accent font-bold hover:underline mb-4">
                                   <span>Open Resource</span>
                                   <ExternalLink size={16} />
                               </a>
                           )}
                           <button onClick={onClose} className="w-full bg-soft-border text-text py-3 rounded-xl font-bold hover:bg-opacity-80">Close</button>
                      </div>
                   );
              }

                    return (
                        <div className="text-center">
                            <p className="text-secondary mb-6">Configure {setting.label}</p>
                            <button onClick={onClose} className="w-full bg-soft-border text-text py-3 rounded-xl font-bold">Close</button>
                        </div>
                    );
            }
          })()}
        </>
      );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
        <div className="text-center mb-6">
            <h3 className="text-xl font-serif font-bold text-text">{setting.label}</h3>
        </div>
        {renderContent()}
    </Modal>
  );
};

export default SettingsModal;
