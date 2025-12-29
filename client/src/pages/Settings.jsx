import React, { useState } from 'react';
import { ChevronRight, Settings as SettingsIcon, Shield, User, Lock, Edit3, MessageCircle, Bell, AlertTriangle, Book, Eye, Database, Info, ChevronLeft, Layout } from 'lucide-react';
import Modal from '../components/Modal';

const Settings = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeItem, setActiveItem] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const handleToolClick = (item) => {
    setActiveItem(item);
    setShowModal(true);
  };

  const sections = [
    {
      id: 1,
      icon: User,
      title: "Account Settings",
      description: "Manage your email, password, and sessions.",
      items: ["Change email", "Verify email status", "Change password", "Log out from all devices", "Active sessions list", "Soft delete account", "Account recovery window info"]
    },
    {
      id: 2,
      icon: Shield,
      title: "Identity & Privacy",
      description: "Control your anonymity and visibility.",
      items: ["Default posting identity", "Manage pseudonyms", "Lock identity per post", "Hide real name globally", "Hide profile from search", "Allow profile viewing", "Identity usage history"]
    },
    {
      id: 3,
      icon: Edit3,
      title: "Posting & Content",
      description: "Customize your creative tools and defaults.",
      items: ["Default post type", "Default mood", "Auto content warning", "Enable drafts auto-save", "Edit time window length", "Scheduled posting toggle", "Auto-delete timer", "Comment permission defaults"]
    },
    {
      id: 4,
      icon: Layout,
      title: "Interaction Controls",
      description: "Manage how others interact with your moments.",
      items: ["Enable reactions", "Enable comments by default", "Allow anonymous comments", "Allow pseudonym comments", "Limit comments per post", "Save posts automatically", "Share link permission"]
    },
    {
      id: 5,
      icon: MessageCircle,
      title: "Messaging",
      description: "Privacy settings for direct communications.",
      items: ["Enable private messaging", "Allow anonymous DMs", "Allow pseudonym DMs", "Message request approval", "Block new messages rule", "Typing indicator toggle", "Read receipts toggle", "Message auto-delete timer"]
    },
    {
      id: 6,
      icon: AlertTriangle,
      title: "Safety & Mental Health",
      description: "Tools to protect your peace of mind.",
      items: ["Enable safe-mode browsing", "Hide triggering content", "Crisis prompt sensitivity", "Cool-down posting timer", "Show emergency resources", "Country/region selection", "Content filter strength"]
    },
    {
      id: 7,
      icon: Bell,
      title: "Notifications",
      description: "Choose what alerts you receive.",
      items: ["In-app notifications preferences", "Email notifications preferences", "Notification quiet hours"]
    },
    {
      id: 8,
      icon: Lock,
      title: "Moderation & Blocking",
      description: "Manage blocked users and mute lists.",
      items: ["Blocked users list", "Muted users list", "Report history", "Appeal status", "Keyword mute list", "Shadow mute visibility"]
    },
    {
      id: 9,
      icon: Book,
      title: "Personal Journal",
      description: "Settings for your private diary.",
      items: ["Enable personal journal", "Journal lock (password)", "Mood tracking visibility", "Reflection prompt frequency", "Export format preference", "Journal auto-backup"]
    },
    {
      id: 10,
      icon: Eye,
      title: "Appearance",
      description: "Customize fonts, themes, and accessibility.",
      items: ["Theme", "Font selection", "Font size", "Line spacing", "Reading mode", "Reduced motion", "High contrast mode"]
    },
    {
      id: 11,
      icon: Database,
      title: "Data & Security",
      description: "Manage your data and account security.",
      items: ["Download user data", "Delete specific data types", "Login history", "Security alerts", "Two-factor authentication"]
    },
    {
      id: 12,
      icon: Info,
      title: "About & Support",
      description: "Learn more about Calmly.",
      items: ["Platform guidelines", "Safety resources", "Contact support", "Feedback form", "Terms & privacy", "App version info"]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
          {activeCategory ? (
              <button onClick={() => setActiveCategory(null)} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition">
                  <ChevronLeft size={24} />
              </button>
          ) : (
              <div className="p-3 bg-slate-900 text-white rounded-xl">
                  <SettingsIcon size={24} />
              </div>
          )}
          <h1 className="text-3xl font-serif font-bold text-slate-900">
              {activeCategory ? activeCategory.title : "Settings"}
          </h1>
      </div>

      {activeCategory ? (
          // Tools Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCategory.items.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => handleToolClick(item)}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
                  >
                      <span className="font-medium text-slate-700 group-hover:text-slate-900">{item}</span>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500" />
                  </div>
              ))}
          </div>
      ) : (
          // Categories Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section) => (
                  <div
                    key={section.id}
                    onClick={() => setActiveCategory(section)}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1"
                  >
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 mb-4 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                          <section.icon size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{section.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{section.description}</p>
                  </div>
              ))}
          </div>
      )}

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
