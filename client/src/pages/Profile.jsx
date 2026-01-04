import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import axios from 'axios';
import { Calendar, MessageCircle, Edit2, Camera, Trash2, X, Image as ImageIcon, Grid, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';
import NoteBubble from '../components/NoteBubble';
import ImageViewer from '../components/ImageViewer';
import QuotesWidget from '../components/QuotesWidget';
import { useIdentity } from '../context/IdentityContext';
import Modal from '../components/Modal';
import CreateQuoteModal from '../components/CreateQuoteModal';
import ReplyQuoteModal from '../components/ReplyQuoteModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

const fetcher = url => axios.get(url).then(res => res.data);

const Profile = () => {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { data, error, isLoading } = useSWR(`/profile/${handle}`, fetcher);
  const { mutate } = useSWRConfig();
  const { currentIdentity, identities } = useIdentity();

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [newAvatar, setNewAvatar] = useState(null);
  const [newCover, setNewCover] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState([]); // For navigation
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerType, setViewerType] = useState(null); // 'avatar' or 'coverPhoto' context for options

  // Quote State
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [replyQuote, setReplyQuote] = useState(null);
  const [showMyQuoteOptions, setShowMyQuoteOptions] = useState(false);
  const [deletingQuote, setDeletingQuote] = useState(false);

  const [activeTab, setActiveTab] = useState('moments');

  if (isLoading) return <div className="text-center py-20 text-secondary">Loading profile...</div>;
  if (error) return <div className="text-center py-20 text-red-400">User not found or private.</div>;

  const { identity, posts, quote } = data;
  const isOwner = identities?.some(i => i._id === identity._id);
  const canMessage = identity.user?.settings?.enablePrivateMessaging !== false;

  const openEditModal = () => {
      setEditName(identity.name);
      setEditBio(identity.bio);
      setAvatarPreview(identity.avatar);
      setCoverPreview(identity.coverPhoto);
      setNewAvatar(null);
      setNewCover(null);
      setShowEditModal(true);
  };

  const handleSetProfilePhoto = async (type, url) => {
      try {
          // Optimistic update
          const newIdentity = { ...identity };
          if (type === 'avatar') newIdentity.avatar = url;
          else newIdentity.coverPhoto = url;

          // Mutate local data
          mutate(`/profile/${handle}`, { ...data, identity: newIdentity }, false);

          await axios.put(`/identities/${identity._id}`, {
              [type === 'avatar' ? 'avatarUrl' : 'coverPhotoUrl']: url
          });
          toast.success(`${type === 'avatar' ? 'Profile picture' : 'Cover photo'} updated`);
          mutate(`/profile/${handle}`); // Re-fetch
          setViewerOpen(false); // Close viewer after setting
      } catch (err) {
          console.error(err);
          toast.error("Failed to update photo");
      }
  };

  const openViewer = (src, history = [], type = null) => {
      if (!src) return;
      let images = [src, ...history].filter(Boolean);
      images = [...new Set(images)];

      setViewerImages(images);
      setViewerIndex(0);
      setViewerType(type); // 'avatar' or 'coverPhoto' or null
      setViewerOpen(true);
  };

  const openMediaViewer = (mediaUrl) => {
      const allMedia = posts.flatMap(p => p.media).filter(Boolean);
      setViewerImages(allMedia);
      const idx = allMedia.indexOf(mediaUrl);
      setViewerIndex(idx >= 0 ? idx : 0);
      setViewerType(null); // No specific type context from media grid (could be ambiguous)
      setViewerOpen(true);
  };

  const handleDeleteQuote = async () => {
      if (!quote) return;
      setDeletingQuote(true);
      try {
          await axios.delete(`/quotes/${quote._id}`);
          toast.success("Quote removed");
          mutate(`/profile/${handle}`);
          mutate('/quotes/feed');
          setShowMyQuoteOptions(false);
      } catch (err) {
          toast.error("Failed to remove quote");
      } finally {
          setDeletingQuote(false);
      }
  };

  const handleSaveProfile = async () => {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', editName);
      formData.append('bio', editBio);
      if (newAvatar) formData.append('avatar', newAvatar);
      if (newCover) formData.append('coverPhoto', newCover);

      try {
          await axios.put(`/identities/${identity._id}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          toast.success("Profile updated");
          mutate(`/profile/${handle}`); // Refresh data
          setShowEditModal(false);
      } catch (err) {
          console.error(err);
          toast.error("Failed to update profile");
      } finally {
          setSaving(false);
      }
  };

  const initiateDeletePhoto = (type) => {
      setConfirmModal({ isOpen: true, type });
  };

  const handleConfirmDelete = async () => {
      const type = confirmModal.type;
      setDeletingPhoto(true);
      try {
          await axios.delete(`/identities/${identity._id}/photo?type=${type}`);
          toast.success("Photo removed");
          mutate(`/profile/${handle}`);
          if (type === 'avatar') setAvatarPreview('');
          if (type === 'coverPhoto') setCoverPreview('');
      } catch (err) {
          toast.error("Failed to remove photo");
      }
      setDeletingPhoto(false);
      setConfirmModal({ isOpen: false, type: null });
  };

  const handleFileChange = (e, type) => {
      const file = e.target.files[0];
      if (file) {
          const preview = URL.createObjectURL(file);
          if (type === 'avatar') {
              setNewAvatar(file);
              setAvatarPreview(preview);
          } else {
              setNewCover(file);
              setCoverPreview(preview);
          }
      }
  };

  // Aggregate Media for Gallery (Posts + Profile History)
  const postMedia = posts.filter(p => p.media && p.media.length > 0).flatMap(p => p.media);
  const avatarMedia = identity.avatarHistory || [];
  if (identity.avatar) avatarMedia.unshift(identity.avatar);
  const coverMedia = identity.coverHistory || [];
  if (identity.coverPhoto) coverMedia.unshift(identity.coverPhoto);

  // Combine unique
  const allMedia = [...new Set([...postMedia, ...avatarMedia, ...coverMedia])].filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header Card */}
      <div className="bg-surface border border-soft-border rounded-3xl overflow-hidden mb-6 shadow-sm relative group">
          {/* Cover Photo */}
          <div
            className="h-48 bg-background relative overflow-hidden cursor-pointer"
            onClick={() => openViewer(identity.coverPhoto, identity.coverHistory, 'coverPhoto')}
          >
              {identity.coverPhoto ? (
                  <img src={identity.coverPhoto} className="w-full h-full object-cover transition-transform hover:scale-105 duration-700" />
              ) : (
                  <div className="w-full h-full bg-gradient-to-r from-background to-soft-border flex items-center justify-center text-secondary">
                      <ImageIcon size={32} opacity={0.5} />
                  </div>
              )}
          </div>

          <div className="px-6 pb-6 relative pt-20">
              {/* Avatar with Note */}
              <div className="absolute -top-16 left-6 w-32 h-32">
                  <NoteBubble
                    identity={identity}
                    quote={quote}
                    isMe={isOwner}
                    size="xl"
                    onQuoteClick={() => {
                        if (isOwner) {
                            setShowMyQuoteOptions(true);
                        } else if (quote) {
                            setReplyQuote(quote);
                        }
                    }}
                    onAvatarClick={() => openViewer(identity.avatar, identity.avatarHistory, 'avatar')}
                  />
              </div>

              {/* Close/Back Button */}
              <button
                  onClick={() => navigate(-1)} // Navigate back
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition z-10"
              >
                  <X size={20} />
              </button>

              <div className="flex justify-between items-start mt-2 relative">
                  <div>
                      <h1 className="text-2xl font-serif text-text font-bold">{identity.name}</h1>
                      <p className="text-secondary text-sm">{identity.handle}</p>
                  </div>

                  {isOwner ? (
                      <button
                        onClick={openEditModal}
                        className="px-4 py-2 rounded-xl bg-background text-text text-sm font-medium hover:bg-soft-border transition flex items-center space-x-2 border border-soft-border"
                      >
                          <Edit2 size={16} />
                          <span>Edit Profile</span>
                      </button>
                  ) : canMessage ? (
                      <button
                        onClick={() => navigate('/chat', { state: { startConversationWith: identity } })}
                        className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition flex items-center space-x-2"
                      >
                          <MessageCircle size={16} className="text-white" />
                          <span>Message</span>
                      </button>
                  ) : (
                      <button
                        disabled
                        className="px-4 py-2 rounded-xl bg-soft-border text-secondary text-sm font-medium cursor-not-allowed flex items-center space-x-2"
                      >
                          <MessageCircle size={16} />
                          <span>Messages Disabled</span>
                      </button>
                  )}
              </div>

              {identity.bio && <p className="mt-4 text-text leading-relaxed font-serif text-sm">{identity.bio}</p>}

              <div className="mt-4 flex items-center space-x-4 text-xs text-secondary font-medium">
                   <div className="flex items-center space-x-1">
                       <Calendar size={14} />
                       <span>Joined {new Date(identity.createdAt).toLocaleDateString()}</span>
                   </div>
                   <div>
                       <span className="font-bold text-text">{posts.length}</span> Moments
                   </div>
              </div>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-soft-border mb-6">
          <button
            onClick={() => setActiveTab('moments')}
            className={clsx("px-4 py-3 text-sm font-bold transition flex items-center space-x-2", activeTab === 'moments' ? "text-text border-b-2 border-text" : "text-secondary hover:text-text")}
          >
              <Grid size={16} />
              <span>Moments</span>
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={clsx("px-4 py-3 text-sm font-bold transition flex items-center space-x-2", activeTab === 'media' ? "text-text border-b-2 border-text" : "text-secondary hover:text-text")}
          >
              <ImageIcon size={16} />
              <span>Media</span>
          </button>
          <button
            onClick={() => setActiveTab('reposts')}
            className={clsx("px-4 py-3 text-sm font-bold transition flex items-center space-x-2", activeTab === 'reposts' ? "text-text border-b-2 border-text" : "text-secondary hover:text-text")}
          >
              <Repeat size={16} />
              <span>Reposts</span>
          </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
          {activeTab === 'moments' && (
              <div className="space-y-6">
                  {posts.length === 0 ? (
                      <div className="text-center py-10 opacity-50">
                          <p className="text-secondary">This soul is quiet for now.</p>
                      </div>
                  ) : (
                      posts.map((post) => (
                        <PostCard key={post._id} post={post} mutate={() => mutate(`/profile/${handle}`)} />
                      ))
                  )}
              </div>
          )}

          {activeTab === 'media' && (
              <div className="grid grid-cols-3 gap-1">
                  {allMedia.length === 0 ? (
                       <div className="col-span-3 text-center py-10 opacity-50">
                          <p className="text-secondary">No visual memories yet.</p>
                      </div>
                  ) : (
                      allMedia.map((media, idx) => (
                          <div key={idx} className="aspect-square bg-slate-100 overflow-hidden cursor-pointer hover:opacity-90 transition" onClick={() => openMediaViewer(media)}>
                              {media.match(/\.(mp4|webm)$/) ? (
                                  <video src={media} className="w-full h-full object-cover" />
                              ) : (
                                  <img src={media} className="w-full h-full object-cover" loading="lazy" />
                              )}
                          </div>
                      ))
                  )}
              </div>
          )}

          {activeTab === 'reposts' && (
               <div className="text-center py-10 opacity-50">
                  <p className="text-secondary">No reposts yet.</p>
              </div>
          )}
      </div>

      {/* Create Quote Modal */}
      <CreateQuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        identityId={currentIdentity?._id}
      />

      {/* My Quote Options Modal */}
      <Modal isOpen={showMyQuoteOptions} onClose={() => setShowMyQuoteOptions(false)}>
             <div className="text-center space-y-6">
                 <div>
                    <h3 className="text-lg font-bold text-text mb-1">Your Quote</h3>
                    <p className="text-xs text-secondary">Visible for 24 hours</p>
                 </div>

                 {quote && (
                     <div className="flex justify-center">
                         <div className={`p-4 rounded-2xl max-w-[200px] text-center text-sm shadow-sm border ${
                             quote.mood === 'Neutral' ? 'bg-slate-100 text-slate-900 border-slate-200' :
                             quote.mood === 'Happy' ? 'bg-yellow-100 text-yellow-900 border-yellow-200' :
                             quote.mood === 'Sad' ? 'bg-blue-100 text-blue-900 border-blue-200' :
                             quote.mood === 'Angry' ? 'bg-red-100 text-red-900 border-red-200' :
                             quote.mood === 'Hopeful' ? 'bg-green-100 text-green-900 border-green-200' :
                             quote.mood === 'Anxious' ? 'bg-purple-100 text-purple-900 border-purple-200' :
                             'bg-slate-100 text-slate-900 border-slate-200'
                         } ${quote.font || ''}`}>
                             {quote.content}
                         </div>
                     </div>
                 )}

                 <div className="grid grid-cols-2 gap-3">
                     <button
                        onClick={() => { setShowMyQuoteOptions(false); setShowQuoteModal(true); }}
                        className="py-3 rounded-xl bg-background border border-soft-border font-medium hover:bg-surface text-text text-sm transition"
                     >
                         Replace
                     </button>
                     <button
                        onClick={handleDeleteQuote}
                        disabled={deletingQuote}
                        className="py-3 rounded-xl bg-red-50 text-red-500 font-medium hover:bg-red-100 disabled:opacity-50 text-sm transition"
                     >
                         {deletingQuote ? 'Deleting...' : 'Delete'}
                     </button>
                 </div>
             </div>
      </Modal>

      {/* Reply Modal */}
      <ReplyQuoteModal
        quote={replyQuote}
        onClose={() => setReplyQuote(null)}
      />

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
          <div className="text-left">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-text">Edit Profile</h3>
                  <button onClick={() => setShowEditModal(false)}><X size={20} className="text-secondary hover:text-text" /></button>
              </div>

              {/* Cover Edit */}
              <div className="relative h-32 bg-background rounded-xl overflow-hidden mb-8 group border border-soft-border">
                  {coverPreview ? (
                      <img src={coverPreview} className="w-full h-full object-cover" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center text-secondary"><ImageIcon /></div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <label className="p-2 bg-white/20 backdrop-blur rounded-full text-white cursor-pointer hover:bg-white/30">
                          <Camera size={18} />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} />
                      </label>
                      {coverPreview && (
                          <button onClick={() => initiateDeletePhoto('coverPhoto')} disabled={deletingPhoto} className="p-2 bg-red-500/80 backdrop-blur rounded-full text-white hover:bg-red-600 disabled:opacity-50">
                              <Trash2 size={18} />
                          </button>
                      )}
                  </div>
              </div>

              {/* Avatar Edit */}
              <div className="relative -mt-16 ml-4 mb-6 inline-block group">
                  <div className="w-24 h-24 rounded-full bg-white overflow-hidden shadow-sm border border-soft-border">
                      {avatarPreview ? (
                          <img src={avatarPreview} className="w-full h-full object-cover" />
                      ) : (
                          <Avatar identity={{...identity, avatar: ''}} size="xl" />
                      )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <label className="p-1.5 bg-black/50 rounded-full text-white cursor-pointer hover:bg-black/70">
                          <Camera size={14} />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                      </label>
                  </div>
              </div>

              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-secondary uppercase mb-1">Name</label>
                      <input
                          className="w-full border border-soft-border rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none bg-surface text-text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-secondary uppercase mb-1">Bio</label>
                      <textarea
                          className="w-full border border-soft-border rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none resize-none bg-surface text-text"
                          rows="3"
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                      />
                  </div>
              </div>

              <div className="mt-6">
                  <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition disabled:opacity-50"
                  >
                      {saving ? 'Saving...' : 'Save Changes'}
                  </button>
              </div>
          </div>
      </Modal>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Photo?"
        message={`Are you sure you want to remove your ${confirmModal.type === 'avatar' ? 'profile picture' : 'cover photo'}?`}
        confirmText="Remove"
        isDanger={true}
      />

      <ImageViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={viewerImages}
        initialIndex={viewerIndex}
        altText="Media"
        actions={isOwner && viewerType ? [
            {
                label: viewerType === 'avatar' ? "Make Profile Picture" : "Make Cover Photo",
                onClick: (url) => handleSetProfilePhoto(viewerType, url)
            }
        ] : []}
      />
    </div>
  );
};

export default Profile;
