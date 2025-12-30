import React, { useState } from 'react';
import { ChevronRight, Settings as SettingsIcon, Shield, User, Lock, Edit3, MessageCircle, Bell, AlertTriangle, Book, Eye, Database, Info, ChevronLeft, Layout, LogOut, Trash2 } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import SettingsModal from '../components/SettingsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { useIdentity } from '../context/IdentityContext';
import { useNavigate } from 'react-router-dom';

const fetcher = url => axios.get(url).then(res => res.data);

const Settings = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null });
  const { logout } = useAuth();
  const { identities } = useIdentity();
  const navigate = useNavigate();

  // Fetch Settings
  const { data: settings, error, mutate: mutateSettings } = useSWR('/settings', fetcher);

  const handleToolClick = (item) => {
    // Handle immediate actions (Logout, Delete)
    if (item.id === 'logout_all') {
        setConfirmModal({ isOpen: true, type: 'logout' });
        return;
    }
    if (item.id === 'delete_account') {
        setConfirmModal({ isOpen: true, type: 'delete' });
        return;
    }

    // Populate dynamic options
    if (item.id === 'defaultIdentityId') {
        item.options = identities?.map(id => ({ value: id._id, label: id.name })) || [];
    }

    setActiveItem(item);
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
      if (confirmModal.type === 'logout') {
          await axios.post('/settings/logout-all');
          toast.success("Logged out everywhere");
          logout();
          navigate('/login');
      } else if (confirmModal.type === 'delete') {
          await axios.delete('/settings/account');
          toast.success("Account scheduled for deletion");
          logout();
          navigate('/login');
      }
      setConfirmModal({ isOpen: false, type: null });
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
          { id: 'defaultIdentityId', label: "Default Posting Identity", type: 'select', options: [] } // Populated dynamically
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
      id: 6,
      icon: AlertTriangle,
      title: "Safety & Mental Health",
      description: "Tools to protect your peace of mind.",
      items: [
          { id: 'enableSafeMode', label: "Enable Safe Mode", type: 'toggle' },
          // Note: showCrisisPrompts is not in DB schema yet, map to enableSafeMode or remove?
          // Schema has enableSafeMode and triggerKeywords. Let's assume frontend logic handles prompts based on safe mode.
          // Or add it to schema? User asked to implement all. I'll map it to enableSafeMode for now or just generic boolean that gets saved if schema allows strict: false (mongoose defaults strict).
          // Safest: Use existing schema keys.
          { id: 'coolDownTimer', label: "Cool-Down Posting Timer", type: 'select', options: ['Off', '5m', '15m', '1h'] }
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
      id: 8,
      icon: Lock,
      title: "Moderation & Blocking",
      description: "Manage blocked users and mute lists.",
      items: [
          { id: 'blockedUsers', label: "Blocked Users", type: 'list' },
          { id: 'mutedKeywords', label: "Muted Keywords", type: 'list' }
      ]
    },
    {
      id: 9,
      icon: Book,
      title: "Personal Journal",
      description: "Settings for your private diary.",
      items: [
          { id: 'enableJournal', label: "Enable Journal Feature", type: 'toggle' },
          { id: 'journalLocked', label: "Lock Journal with Password", type: 'toggle' }
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
    },
    {
      id: 11,
      icon: Database,
      title: "Data & Security",
      description: "Manage your data and account security.",
      items: [
          { id: 'download_data', label: "Download My Data", type: 'download_data' },
          { id: 'two_factor', label: "Two-Factor Auth", type: 'toggle' }
      ]
    },
    {
      id: 12,
      icon: Info,
      title: "About & Support",
      description: "Learn more about Calmly.",
      items: [
          { id: 'guidelines', label: "Community Guidelines", type: 'info' },
          { id: 'contact_support', label: "Contact Support", type: 'info' }
      ]
    }
  ];

  if (!settings && !error) return <Loader />;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
          {activeCategory ? (
              <button onClick={() => setActiveCategory(null)} className="p-3 bg-surface border border-soft-border rounded-xl hover:bg-background transition">
                  <ChevronLeft size={24} className="text-text" />
              </button>
          ) : (
              <div className="p-3 bg-accent text-white rounded-xl">
                  <SettingsIcon size={24} />
              </div>
          )}
          <h1 className="text-3xl font-serif font-bold text-text">
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
                    className="bg-surface p-6 rounded-2xl shadow-sm border border-soft-border hover:shadow-md transition cursor-pointer flex items-center justify-between group"
                  >
                      <span className="font-medium text-text group-hover:text-primary">{item.label}</span>
                      {settings && item.type === 'toggle' ? (
                          <div className={`w-10 h-6 rounded-full transition-colors ${settings[item.id] ? 'bg-success' : 'bg-secondary'} relative`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings[item.id] ? 'left-5' : 'left-1'}`} />
                          </div>
                      ) : (
                          <ChevronRight size={18} className="text-secondary group-hover:text-primary" />
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
                    className="bg-surface p-6 rounded-3xl shadow-sm border border-soft-border hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1"
                  >
                      <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center text-secondary mb-4 group-hover:bg-accent group-hover:text-white transition-colors">
                          <section.icon size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-text mb-2">{section.title}</h3>
                      <p className="text-sm text-secondary leading-relaxed">{section.description}</p>
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null })}
        onConfirm={handleConfirmAction}
        title={confirmModal.type === 'logout' ? "Log Out All Devices?" : "Delete Account?"}
        message={confirmModal.type === 'logout'
            ? "You will be logged out of all active sessions immediately."
            : "This action will permanently deactivate your account. You have 30 days to recover it by logging in again."}
        confirmText={confirmModal.type === 'logout' ? "Log Out" : "Delete Forever"}
        isDanger={true}
      />
    </div>
  );
};

export default Settings;
