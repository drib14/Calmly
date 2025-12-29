import React, { useState } from 'react';
import { ChevronRight, Settings as SettingsIcon } from 'lucide-react';
import Modal from '../components/Modal';

const Settings = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeItem, setActiveItem] = useState('');

  const handleItemClick = (item) => {
    setActiveItem(item);
    setShowModal(true);
  };

  const sections = [
    {
      title: "1. Account Settings",
      items: ["Change email", "Verify email status", "Change password", "Log out from all devices", "Active sessions list", "Soft delete account", "Account recovery window info"]
    },
    {
      title: "2. Identity & Privacy Settings (Core)",
      items: ["Default posting identity", "Manage pseudonyms", "Lock identity per post", "Hide real name globally", "Hide profile from search", "Allow profile viewing", "Identity usage history"]
    },
    {
      title: "3. Posting & Content Controls",
      items: ["Default post type", "Default mood", "Auto content warning", "Enable drafts auto-save", "Edit time window length", "Scheduled posting toggle", "Auto-delete timer", "Comment permission defaults"]
    },
    {
      title: "4. Interaction Controls",
      items: ["Enable reactions", "Enable comments by default", "Allow anonymous comments", "Allow pseudonym comments", "Limit comments per post", "Save posts automatically", "Share link permission"]
    },
    {
      title: "5. Messaging & Communication",
      items: ["Enable private messaging", "Allow anonymous DMs", "Allow pseudonym DMs", "Message request approval", "Block new messages rule", "Typing indicator toggle", "Read receipts toggle", "Message auto-delete timer"]
    },
    {
      title: "6. Safety & Mental Health",
      items: ["Enable safe-mode browsing", "Hide triggering content", "Crisis prompt sensitivity", "Cool-down posting timer", "Show emergency resources", "Country/region selection", "Content filter strength"]
    },
    {
      title: "7. Notification Settings",
      items: ["In-app notifications preferences", "Email notifications preferences", "Notification quiet hours"]
    },
    {
      title: "8. Moderation & Blocking",
      items: ["Blocked users list", "Muted users list", "Report history", "Appeal status", "Keyword mute list", "Shadow mute visibility"]
    },
    {
      title: "9. Personal Journal",
      items: ["Enable personal journal", "Journal lock (password)", "Mood tracking visibility", "Reflection prompt frequency", "Export format preference", "Journal auto-backup"]
    },
    {
      title: "10. Appearance & Accessibility",
      items: ["Theme", "Font selection", "Font size", "Line spacing", "Reading mode", "Reduced motion", "High contrast mode"]
    },
    {
      title: "11. Data & Security",
      items: ["Download user data", "Delete specific data types", "Login history", "Security alerts", "Two-factor authentication"]
    },
    {
      title: "12. About & Support",
      items: ["Platform guidelines", "Safety resources", "Contact support", "Feedback form", "Terms & privacy", "App version info"]
    }
  ];

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-slate-900 text-white rounded-xl">
              <SettingsIcon size={24} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Settings</h1>
      </div>

      <div className="space-y-6">
          {sections.map((section, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                      <h3 className="font-bold text-slate-700">{section.title}</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                      {section.items.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => handleItemClick(item)}
                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition text-left group"
                          >
                              <span className="text-sm text-slate-600 font-medium group-hover:text-slate-900">{item}</span>
                              <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                          </button>
                      ))}
                  </div>
              </div>
          ))}
      </div>

      {/* Feature Placeholder Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <div className="text-center py-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SettingsIcon size={32} />
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900 mb-2">{activeItem}</h3>
              <p className="text-slate-500 text-sm">This feature is currently under development.</p>
              <div className="mt-6">
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wider">Implementing Soon</span>
              </div>
              <button
                  onClick={() => setShowModal(false)}
                  className="mt-8 w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition"
              >
                  Got it
              </button>
          </div>
      </Modal>
    </div>
  );
};

export default Settings;
