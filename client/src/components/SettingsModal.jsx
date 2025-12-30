import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ChevronRight, Check, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const SettingsModal = ({ isOpen, onClose, setting, onUpdate, currentValue }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [toggleState, setToggleState] = useState(false);

  // Specific states for password change
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
      if (isOpen && setting) {
          setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setFormData({});

          if (setting.type === 'toggle') {
              setToggleState(!!currentValue);
          }
          if (setting.type === 'select') {
              setFormData({ [setting.id]: currentValue });
          }
      }
  }, [isOpen, setting, currentValue]);

  if (!setting) return null;

  const handleToggle = async (val) => {
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

  const handleSelectChange = async (e) => {
      const val = e.target.value;
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

  const renderContent = () => {
      switch (setting.id) {
          case 'change_password':
              return (
                  <form onSubmit={handlePasswordChange} className="space-y-4 text-left">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Current Password</label>
                          <input type="password" required className="w-full border rounded-xl p-3 mt-1"
                              value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
                          <input type="password" required className="w-full border rounded-xl p-3 mt-1"
                              value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Confirm Password</label>
                          <input type="password" required className="w-full border rounded-xl p-3 mt-1"
                              value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} />
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl mt-4 font-bold disabled:opacity-50">
                          {loading ? 'Updating...' : 'Update Password'}
                      </button>
                  </form>
              );

          case 'change_email':
               return (
                  <form onSubmit={handleEmailChange} className="space-y-4 text-left">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">New Email Address</label>
                          <input type="email" required className="w-full border rounded-xl p-3 mt-1"
                              value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl mt-4 font-bold disabled:opacity-50">
                          {loading ? 'Sending Verification...' : 'Update Email'}
                      </button>
                  </form>
               );

          default:
              if (setting.type === 'toggle') {
                  return (
                      <div className="text-center py-6">
                          <p className="text-slate-500 mb-6 px-4">
                              {toggleState
                                ? `Currently enabled. Disable ${setting.label}?`
                                : `Currently disabled. Enable ${setting.label}?`}
                          </p>
                          <div className="flex justify-center space-x-4">
                              <button
                                onClick={() => handleToggle(false)}
                                className={`px-6 py-3 rounded-xl font-bold transition ${!toggleState ? 'bg-slate-200 text-slate-500 cursor-default' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                              >
                                  Disable
                              </button>
                              <button
                                onClick={() => handleToggle(true)}
                                className={`px-6 py-3 rounded-xl font-bold transition ${toggleState ? 'bg-slate-200 text-slate-500 cursor-default' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                              >
                                  Enable
                              </button>
                          </div>
                      </div>
                  );
              }

              if (setting.type === 'select') {
                  return (
                      <div className="space-y-4">
                          <label className="text-xs font-bold text-slate-500 uppercase">Select Option</label>
                          <select
                            className="w-full border rounded-xl p-3 bg-white"
                            value={formData[setting.id] || currentValue || ''}
                            onChange={handleSelectChange}
                          >
                              {setting.options?.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                              ))}
                          </select>
                      </div>
                  );
              }

              return (
                  <div className="text-center">
                      <p className="text-slate-500 mb-6">Configure {setting.label}</p>
                       <div className="bg-slate-50 p-4 rounded-xl mb-4">
                           <p className="text-sm text-slate-400">Advanced configuration coming soon.</p>
                       </div>
                       <button onClick={onClose} className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold">Close</button>
                  </div>
              );
      }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
        <div className="text-center mb-6">
            <h3 className="text-xl font-serif font-bold text-slate-900">{setting.label}</h3>
        </div>
        {renderContent()}
    </Modal>
  );
};

export default SettingsModal;
