import React, { useState } from 'react';
import { ChevronRight, Settings as SettingsIcon, Shield, User, Lock, Edit3, MessageCircle, Bell, AlertTriangle, Book, Eye, Database, Info, ChevronLeft, Layout, LogOut, Trash2 } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import SettingsModal from '../components/SettingsModal';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const fetcher = url => axios.get(url).then(res => res.data);

const Settings = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Fetch Settings
  const { data: settings, mutate: mutateSettings } = useSWR('/settings', fetcher);

  const handleToolClick = (item) => {
    // Handle immediate actions (Logout, Delete)
    if (item.id === 'logout_all') {
        if (window.confirm("Are you sure you want to log out from all devices?")) {
            axios.post('/settings/logout-all').then(() => {
                toast.success("Logged out everywhere");
                logout();
                navigate('/login');
            });
        }
        return;
    }
    if (item.id === 'delete_account') {
        if (window.confirm("This will permanently deactivate your account. Continue?")) {
             axios.delete('/settings/account').then(() => {
                toast.success("Account scheduled for deletion");
                logout();
                navigate('/login');
            });
        }
        return;
    }

    setActiveItem(item);
    setShowModal(true);
  };

  const updateSetting = (key, value) => {
      // Optimistic update
      if (settings) {
          mutateSettings({ ...settings, [key]: value }, false);
      }
  };

  const sections = [
    {
      id: 1,
      icon: User,
      title: "Account Settings",
      description: "Manage your email, password, and sessions.",
      items: [
          { id: 'change_email', label: "Change Email" },
          { id: 'change_password', label: "Change Password" },
          { id: 'logout_all', label: "Log out from all devices" },
          { id: 'sessions', label: "Active Sessions" },
          { id: 'delete_account', label: "Soft Delete Account" }
      ]
    },
    {
      id: 2,
      icon: Shield,
      title: "Identity & Privacy",
      description: "Control your anonymity and visibility.",
      items: [
          { id: 'hideRealNameGlobally', label: "Hide Real Name Globally", type: 'toggle' },
          { id: 'hideProfileFromSearch', label: "Hide Profile From Search", type: 'toggle' },
          { id: 'allowProfileViewing', label: "Allow Profile Viewing", type: 'toggle' },
          { id: 'defaultIdentityId', label: "Default Posting Identity", type: 'select' } // Needs identity list
      ]
    },
    {
      id: 3,
      icon: Edit3,
      title: "Posting & Content",
      description: "Customize your creative tools and defaults.",
      items: [
          { id: 'defaultPostType', label: "Default Post Type", type: 'select', options: ['confession', 'poetry', 'letter', 'mood'] },
          { id: 'defaultMood', label: "Default Mood", type: 'select', options: ['Neutral', 'Happy', 'Sad', 'Anxious', 'Hopeful'] },
          { id: 'autoContentWarning', label: "Auto Content Warning", type: 'toggle' },
          { id: 'enableDrafts', label: "Enable Drafts Auto-Save", type: 'toggle' }
      ]
    },
    {
      id: 4,
      icon: Layout,
      title: "Interaction Controls",
      description: "Manage how others interact with your moments.",
      items: [
          { id: 'enableReactions', label: "Enable Reactions", type: 'toggle' },
          { id: 'enableComments', label: "Enable Comments by Default", type: 'toggle' },
          { id: 'allowAnonymousComments', label: "Allow Anonymous Comments", type: 'toggle' },
          { id: 'allowPseudonymComments', label: "Allow Pseudonym Comments", type: 'toggle' }
      ]
    },
    {
      id: 5,
      icon: MessageCircle,
      title: "Messaging",
      description: "Privacy settings for direct communications.",
      items: [
          { id: 'enablePrivateMessaging', label: "Enable Private Messaging", type: 'toggle' },
          { id: 'allowAnonymousDMs', label: "Allow Anonymous DMs", type: 'toggle' },
          { id: 'allowPseudonymDMs', label: "Allow Pseudonym DMs", type: 'toggle' },
          { id: 'readReceipts', label: "Read Receipts", type: 'toggle' },
          { id: 'showTypingIndicator', label: "Typing Indicator", type: 'toggle' }
      ]
    },
    {
      id: 7,
      icon: Bell,
      title: "Notifications",
      description: "Choose what alerts you receive.",
      items: [
          { id: 'inAppNotifications', label: "In-App Notifications", type: 'toggle' },
          { id: 'emailNotifications', label: "Email Notifications", type: 'toggle' }
      ]
    },
    {
      id: 10,
      icon: Eye,
      title: "Appearance",
      description: "Customize fonts, themes, and accessibility.",
      items: [
          { id: 'theme', label: "Theme", type: 'select', options: ['soft-light', 'dark', 'sage', 'ocean'] },
          { id: 'fontFamily', label: "Font Family", type: 'select', options: ['font-serif', 'font-sans', 'font-mono'] },
          { id: 'highContrast', label: "High Contrast Mode", type: 'toggle' }
      ]
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
                      <span className="font-medium text-slate-700 group-hover:text-slate-900">{item.label}</span>
                      {settings && item.type === 'toggle' ? (
                          <div className={`w-10 h-6 rounded-full transition-colors ${settings[item.id] ? 'bg-green-500' : 'bg-gray-300'} relative`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings[item.id] ? 'left-5' : 'left-1'}`} />
                          </div>
                      ) : (
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500" />
                      )}
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

      {/* Reusable Settings Modal */}
      <SettingsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        setting={activeItem}
        onUpdate={updateSetting}
        currentValue={activeItem && settings ? settings[activeItem.id] : null}
      />
    </div>
  );
};

export default Settings;
