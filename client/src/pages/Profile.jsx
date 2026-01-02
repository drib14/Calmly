import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import axios from 'axios';
import { Calendar, MessageCircle, Edit2, Camera, Trash2, X, Image as ImageIcon, Grid, Repeat, Archive, Film, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';
import QuoteBubble from '../components/QuoteBubble';
import ImageViewer from '../components/ImageViewer';
import StoriesWidget from '../components/StoriesWidget'; // Still needed? Maybe not on profile page itself if unified.
import { useIdentity } from '../context/IdentityContext';
import Modal from '../components/Modal';
import CreateQuoteModal from '../components/CreateQuoteModal';
import ReplyQuoteModal from '../components/ReplyQuoteModal';
import ConfirmationModal from '../components/ConfirmationModal';
import UnifiedViewerModal from '../components/Unified/UnifiedViewerModal';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { format } from 'date-fns';

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
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerType, setViewerType] = useState(null);

  // Archive Viewer State
  const [archiveViewerOpen, setArchiveViewerOpen] = useState(false);
  const [archiveStories, setArchiveStories] = useState([]);
  const [archiveIndex, setArchiveIndex] = useState(0);

  // Quote State
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [replyQuote, setReplyQuote] = useState(null);
  const [showMyQuoteOptions, setShowMyQuoteOptions] = useState(false);
  const [deletingQuote, setDeletingQuote] = useState(false);

  // New: Active Clip/Quote State for profile header dropdown
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [activeTab, setActiveTab] = useState('moments');

  if (isLoading) return <div className="text-center py-20 text-secondary">Loading profile...</div>;
  if (error) return <div className="text-center py-20 text-red-400">User not found or private.</div>;

  const { identity, posts, reposts, quote, clips, archives } = data;
  const isOwner = identities?.some(i => i._id === identity._id);
  const canMessage = identity.user?.settings?.enablePrivateMessaging !== false;

  const hasActiveClip = clips && clips.length > 0;

  const handleProfileImageClick = (e) => {
      e.stopPropagation();
      if (hasActiveClip) {
          setShowProfileDropdown(!showProfileDropdown);
      } else {
          openViewer(identity.avatar, identity.avatarHistory, 'avatar');
      }
  };

  const openStoryViewer = () => {
       // Construct a story object for the UnifiedViewer
       const story = {
           identity: identity,
           items: clips.map(c => ({...c, type: 'clip'})).concat(quote ? [{...quote, type: 'quote'}] : [])
           // Usually stories are sorted by date.
       };
       // Sort items
       story.items.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

       setArchiveStories([story]);
       setArchiveIndex(0);
       setArchiveViewerOpen(true);
       setShowProfileDropdown(false);
  };

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
          const newIdentity = { ...identity };
          if (type === 'avatar') newIdentity.avatar = url;
          else newIdentity.coverPhoto = url;

          mutate(`/profile/${handle}`, { ...data, identity: newIdentity }, false);

          await axios.put(`/identities/${identity._id}`, {
              [type === 'avatar' ? 'avatarUrl' : 'coverPhotoUrl']: url
          });
          toast.success(`${type === 'avatar' ? 'Profile picture' : 'Cover photo'} updated`);
          mutate(`/profile/${handle}`);
          setViewerOpen(false);
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
      setViewerType(type);
      setViewerOpen(true);
  };

  const openMediaViewer = (mediaUrl) => {
      const allMedia = posts.flatMap(p => p.media).filter(Boolean);
      setViewerImages(allMedia);
      const idx = allMedia.indexOf(mediaUrl);
      setViewerIndex(idx >= 0 ? idx : 0);
      setViewerType(null);
      setViewerOpen(true);
  };

  const openArchiveViewer = (item) => {
      // Archive viewer logic
      const story = { identity, items: [item] };
      setArchiveStories([story]);
      setArchiveIndex(0);
      setArchiveViewerOpen(true);
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
          mutate(`/profile/${handle}`);
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

  const formatDate = (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      if (date.getFullYear() === now.getFullYear()) {
          return format(date, 'MMM d');
      }
      return format(date, 'MMM d, yyyy');
  };

  const postMedia = posts.filter(p => p.media && p.media.length > 0).flatMap(p => p.media);
  const avatarMedia = identity.avatarHistory || [];
  if (identity.avatar) avatarMedia.unshift(identity.avatar);
  const coverMedia = identity.coverHistory || [];
  if (identity.coverPhoto) coverMedia.unshift(identity.coverPhoto);
  const allMedia = [...new Set([...postMedia, ...avatarMedia, ...coverMedia])].filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto pb-20" onClick={() => setShowProfileDropdown(false)}>
      <div className="bg-surface border border-soft-border rounded-3xl mb-6 shadow-sm relative group">
          <div
            className="h-48 bg-background relative overflow-hidden cursor-pointer rounded-t-3xl"
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

          <div className="px-6 pb-6 relative pt-20 rounded-b-3xl">
              {/* Quote Bubble - Active Quote */}
              {quote && (
                  <div className="absolute -top-16 left-6 w-32 h-32 z-30">
                      <QuoteBubble
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
                        onAvatarClick={handleProfileImageClick}
                        avatarClass={hasActiveClip ? 'border-[3px] border-fuchsia-500' : ''}
                      />

                      {/* Profile Dropdown */}
                      <AnimatePresence>
                          {showProfileDropdown && (
                             <motion.div
                                 initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                 animate={{ opacity: 1, scale: 1, y: 0 }}
                                 exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                 className="absolute top-full mt-2 left-0 w-40 bg-surface border border-soft-border shadow-xl rounded-xl overflow-hidden flex flex-col z-50"
                                 onClick={(e) => e.stopPropagation()}
                             >
                                 <button
                                     onClick={() => { openViewer(identity.avatar, identity.avatarHistory, 'avatar'); setShowProfileDropdown(false); }}
                                     className="flex items-center space-x-2 px-4 py-3 text-xs font-bold text-text hover:bg-background text-left transition-colors"
                                 >
                                     <User size={14} /> <span>View Profile Photo</span>
                                 </button>
                                 <button
                                     onClick={openStoryViewer}
                                     className="flex items-center space-x-2 px-4 py-3 text-xs font-bold text-text hover:bg-background text-left transition-colors"
                                 >
                                     <Film size={14} /> <span>View Story</span>
                                 </button>
                             </motion.div>
                          )}
                      </AnimatePresence>
                  </div>
              )}

              {/* If NO quote, we show just Avatar with potential Clip border */}
              {!quote && (
                 <div className="absolute -top-12 left-6 z-30 relative">
                     <div onClick={handleProfileImageClick} className={`rounded-full p-[2px] bg-surface cursor-pointer inline-block ${hasActiveClip ? 'border-[3px] border-fuchsia-500' : 'border border-soft-border'}`}>
                         <Avatar identity={identity} size="xl" />
                     </div>

                      {/* Profile Dropdown (Duplicate logic for no-quote state) */}
                      <AnimatePresence>
                          {showProfileDropdown && (
                             <motion.div
                                 initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                 animate={{ opacity: 1, scale: 1, y: 0 }}
                                 exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                 className="absolute top-full mt-2 left-0 w-40 bg-surface border border-soft-border shadow-xl rounded-xl overflow-hidden flex flex-col z-50"
                                 onClick={(e) => e.stopPropagation()}
                             >
                                 <button
                                     onClick={() => { openViewer(identity.avatar, identity.avatarHistory, 'avatar'); setShowProfileDropdown(false); }}
                                     className="flex items-center space-x-2 px-4 py-3 text-xs font-bold text-text hover:bg-background text-left transition-colors"
                                 >
                                     <User size={14} /> <span>View Profile Photo</span>
                                 </button>
                                 <button
                                     onClick={openStoryViewer}
                                     className="flex items-center space-x-2 px-4 py-3 text-xs font-bold text-text hover:bg-background text-left transition-colors"
                                 >
                                     <Film size={14} /> <span>View Story</span>
                                 </button>
                             </motion.div>
                          )}
                      </AnimatePresence>
                 </div>
              )}

              <button
                  onClick={() => navigate(-1)}
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

      <div className="flex border-b border-soft-border mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('moments')}
            className={clsx("px-4 py-3 text-sm font-bold transition flex items-center space-x-2 whitespace-nowrap", activeTab === 'moments' ? "text-text border-b-2 border-text" : "text-secondary hover:text-text")}
          >
              <Grid size={16} />
              <span>Moments</span>
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={clsx("px-4 py-3 text-sm font-bold transition flex items-center space-x-2 whitespace-nowrap", activeTab === 'media' ? "text-text border-b-2 border-text" : "text-secondary hover:text-text")}
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
          {isOwner && (
            <button
                onClick={() => setActiveTab('archives')}
                className={clsx("px-4 py-3 text-sm font-bold transition flex items-center space-x-2", activeTab === 'archives' ? "text-text border-b-2 border-text" : "text-secondary hover:text-text")}
            >
                <Archive size={16} />
                <span>Archives</span>
            </button>
          )}
      </div>

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

          {activeTab === 'archives' && isOwner && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {!archives || archives.length === 0 ? (
                      <div className="col-span-full text-center py-10 opacity-50">
                          <p className="text-secondary">No archived moments.</p>
                      </div>
                  ) : (
                      archives.map((item) => (
                          <div
                              key={item._id}
                              className="relative bg-surface rounded-xl overflow-hidden border border-soft-border group aspect-square cursor-pointer hover:opacity-90 transition"
                              onClick={() => openArchiveViewer(item)}
                          >
                                  {/* Logic for Thumbnail Display */}
                                  { (item.media && item.media.length > 0) || item.mediaUrl ? (

                                      (item.mediaUrl || item.media[0]).match(/\.(mp4|webm)|video/i) || item.mediaType === 'video' ? (
                                          <video src={item.mediaUrl || item.media[0]} className="w-full h-full object-cover" />
                                      ) : (
                                          <img src={item.mediaUrl || item.media[0]} className="w-full h-full object-cover" />
                                      )

                                  ) : item.content ? (
                                      // Render Text (Quote or Text Post)
                                      <div className={`w-full h-full p-4 flex items-center justify-center text-center text-xs ${item.mood ? 'bg-slate-100' : 'bg-surface'}`}>
                                          <p className="line-clamp-4 font-serif">"{item.content}"</p>
                                      </div>
                                  ) : (
                                      // Fallback
                                      <div className="w-full h-full bg-slate-100" />
                                  )}

                                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                                      <p className="text-white text-[10px] font-bold text-center">
                                          {formatDate(item.createdAt)}
                                      </p>
                                  </div>

                                  <div className="absolute top-2 right-2 opacity-50 pointer-events-none">
                                      {item.type === 'quote' && <MessageCircle size={12} className="text-white" />}
                                      {item.type === 'clip' && <Film size={12} className="text-white" />}
                                  </div>
                              </div>
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
              <div className="space-y-6">
                  {!reposts || reposts.length === 0 ? (
                      <div className="text-center py-10 opacity-50">
                          <p className="text-secondary">No reposts yet.</p>
                      </div>
                  ) : (
                      reposts.map((post) => (
                        <PostCard key={post._id} post={post} mutate={() => mutate(`/profile/${handle}`)} />
                      ))
                  )}
              </div>
          )}
      </div>

      <CreateQuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        identityId={currentIdentity?._id}
      />

      <Modal isOpen={showMyQuoteOptions} onClose={() => setShowMyQuoteOptions(false)}>
             <div className="text-center space-y-4">
                 <h3 className="text-lg font-bold text-text">Your Quote</h3>
                 <div className="grid grid-cols-2 gap-3 pt-4">
                     <button
                        onClick={() => { setShowMyQuoteOptions(false); setShowQuoteModal(true); }}
                        className="py-3 rounded-xl bg-background border border-soft-border font-medium hover:bg-surface text-text"
                     >
                         New quote
                     </button>
                     <button
                        onClick={handleDeleteQuote}
                        disabled={deletingQuote}
                        className="py-3 rounded-xl bg-red-50 text-red-500 font-medium hover:bg-red-100 disabled:opacity-50"
                     >
                         {deletingQuote ? 'Deleting...' : 'Delete'}
                     </button>
                 </div>
             </div>
      </Modal>

      <ReplyQuoteModal
        quote={replyQuote}
        onClose={() => setReplyQuote(null)}
      />

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
          <div className="text-left">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-text">Edit Profile</h3>
                  <button onClick={() => setShowEditModal(false)}><X size={20} className="text-secondary hover:text-text" /></button>
              </div>

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

      {/* Archive Viewer */}
      <UnifiedViewerModal
        isOpen={archiveViewerOpen}
        onClose={() => setArchiveViewerOpen(false)}
        stories={archiveStories}
        initialStoryIndex={archiveIndex}
      />
    </div>
  );
};

export default Profile;
