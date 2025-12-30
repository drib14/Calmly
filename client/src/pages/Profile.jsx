import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import axios from 'axios';
import { Calendar, MessageCircle, Edit2, Camera, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';
import ImageViewer from '../components/ImageViewer';
import { useIdentity } from '../context/IdentityContext';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { toast } from 'react-hot-toast';

const fetcher = url => axios.get(url).then(res => res.data);

const Profile = () => {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { data, error, isLoading, mutate } = useSWR(`/profile/${handle}`, fetcher);
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
  const [viewerImage, setViewerImage] = useState(null);

  if (isLoading) return <div className="text-center py-20 text-secondary">Loading profile...</div>;
  if (error) return <div className="text-center py-20 text-red-400">User not found or private.</div>;

  const { identity, posts } = data;
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

  const openViewer = (src) => {
      if (!src) return;
      setViewerImage(src);
      setViewerOpen(true);
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
          mutate(); // Refresh data
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
          mutate();
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

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header Card */}
      <div className="bg-surface border border-soft-border rounded-3xl overflow-hidden mb-6 shadow-sm relative group">
          {/* Cover Photo */}
          <div
            className="h-48 bg-background relative overflow-hidden cursor-pointer"
            onClick={() => openViewer(identity.coverPhoto)}
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
              {/* Avatar */}
              <div
                className="absolute -top-16 left-6 w-32 h-32 rounded-full bg-surface flex items-center justify-center shadow-md overflow-hidden cursor-pointer hover:opacity-90 transition"
                onClick={(e) => { e.stopPropagation(); openViewer(identity.avatar); }}
              >
                  <Avatar identity={identity} size="xl" className="w-full h-full" />
              </div>

              <div className="flex justify-between items-start">
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
          <button className="px-4 py-3 text-sm font-bold text-text border-b-2 border-text">Moments</button>
          <button className="px-4 py-3 text-sm font-medium text-secondary hover:text-text transition">Reposts</button>
      </div>

      {/* Posts Grid */}
      <div className="space-y-6">
          {posts.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                  <p className="text-secondary">This soul is quiet for now.</p>
              </div>
          ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} mutate={mutate} />
              ))
          )}
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
          <div className="text-left">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Edit Profile</h3>
                  <button onClick={() => setShowEditModal(false)}><X size={20} className="text-slate-400" /></button>
              </div>

              {/* Cover Edit */}
              <div className="relative h-32 bg-slate-100 rounded-xl overflow-hidden mb-8 group">
                  {coverPreview ? (
                      <img src={coverPreview} className="w-full h-full object-cover" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon /></div>
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
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm">
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
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                      <input
                          className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bio</label>
                      <textarea
                          className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none resize-none"
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
        imageSrc={viewerImage}
        altText="Profile Photo"
      />
    </div>
  );
};

export default Profile;
