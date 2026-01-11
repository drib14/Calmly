import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import axios from 'axios';
import { Calendar, MessageCircle, Edit2, Camera, Trash2, X, Image as ImageIcon, Grid, Repeat, Heart, Archive, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';
import NoteBubble from '../components/NoteBubble';
import MediaViewer from '../components/MediaViewer';
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
  if (error || !data) return <div className="text-center py-20 text-red-400">User not found or private.</div>;

  const { identity, posts, quote, archives } = data;
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
      // Reconstruct all media list from the unified list
      const allUrls = allMedia.map(m => m.url);
      setViewerImages(allUrls);
      const idx = allUrls.indexOf(mediaUrl);
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
  // Normalize to object: { url, type, stats: { likes, comments, reposts } }
  const postMediaItems = posts.flatMap(p => {
      if (!p.media || p.media.length === 0) return [];
      return p.media.map(m => ({
          url: m.url,
          type: m.type,
          stats: {
              likes: p.likes?.length || 0,
              comments: p.commentCount || 0,
              reposts: p.reposts?.length || 0
          }
      }));
  });

  const avatarMediaItems = (identity.avatarHistory || []).map(url => ({
      url, type: 'image', stats: null
  }));
  if (identity.avatar) avatarMediaItems.unshift({ url: identity.avatar, type: 'image', stats: null });

  const coverMediaItems = (identity.coverHistory || []).map(url => ({
      url, type: 'image', stats: null
  }));
  if (identity.coverPhoto) coverMediaItems.unshift({ url: identity.coverPhoto, type: 'image', stats: null });

  // Combine and Deduplicate by URL
  const allMediaRaw = [...postMediaItems, ...avatarMediaItems, ...coverMediaItems];
  const uniqueMediaMap = new Map();
  allMediaRaw.forEach(item => {
      if (item.url && !uniqueMediaMap.has(item.url)) {
          uniqueMediaMap.set(item.url, item);
      }
  });
  const allMedia = Array.from(uniqueMediaMap.values());

  // Sort Oldest to Newest ("FIFO stack" based on user request)
  // Note: 'posts' are Newest First. 'postMediaItems' respects that.
  // So 'allMedia' is currently roughly Newest First (because map iterates in order).
  // We need to reverse it or sort by date if we had date attached.
  // Since we stripped date in 'postMediaItems', we can rely on index if we reverse it?
  // No, let's attach date in postMediaItems to be safe.
  // Actually, 'posts' is Newest First. So postMediaItems is Newest First.
  // To get Oldest First, we just reverse the array.
  allMedia.reverse();

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
                            if (quote) {
                                setShowMyQuoteOptions(true);
                            } else {
                                setShowQuoteModal(true);
                            }
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
      <div className="flex border-b border-soft-border mb-6 sticky top-0 md:top-16 bg-background/95 backdrop-blur z-20 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('moments')}
            className={clsx("flex-1 md:flex-none justify-center md:justify-start px-4 py-3 text-sm font-bold transition flex items-center space-x-2 whitespace-nowrap", activeTab === 'moments' ? "text-text border-b-2 border-text" : "text-secondary hover:text-text")}
          >
              <Grid size={16} />
              <span className="hidden md:inline">Moments</span>
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={clsx("flex-1 md:flex-none justify-center md:justify-start px-4 py-3 text-sm font-bold transition flex items-center space-x-2 whitespace-nowrap", activeTab === 'media' ? "text-text border-b-2 border-text" : "text-secondary hover:text-text")}
          >
              <ImageIcon size={16} />
              <span className="hidden md:inline">Media</span>
          </button>
          <button
            onClick={() => setActiveTab('reposts')}
            className={clsx("flex-1 md:flex-none justify-center md:justify-start px-4 py-3 text-sm font-bold transition flex items-center space-x-2 whitespace-nowrap", activeTab === 'reposts' ? "text-text border-b-2 border-text" : "text-secondary hover:text-text")}
          >
              <Repeat size={16} />
              <span className="hidden md:inline">Reposts</span>
          </button>
          {isOwner && (
            <button
                onClick={() => setActiveTab('archives')}
                className={clsx("flex-1 md:flex-none justify-center md:justify-start px-4 py-3 text-sm font-bold transition flex items-center space-x-2 whitespace-nowrap", activeTab === 'archives' ? "text-text border-b-2 border-text" : "text-secondary hover:text-text")}
            >
                <Archive size={16} />
                <span className="hidden md:inline">Archives</span>
            </button>
          )}
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
                          <div key={idx} className="aspect-square bg-slate-100 overflow-hidden cursor-pointer relative group" onClick={() => openMediaViewer(media.url)}>
                              {/* Media Content */}
                              {media.type === 'video' || (media.url && media.url.match(/\.(mp4|webm)$/)) ? (
                                  <video src={media.url} className="w-full h-full object-cover" />
                              ) : (
                                  <img src={media.url} className="w-full h-full object-cover" loading="lazy" />
                              )}

                              {/* Hover Overlay with Stats */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                                  {media.stats && (
                                      <>
                                          <div className="flex items-center gap-1 font-bold text-sm">
                                              <Heart size={16} className="fill-white" />
                                              <span>{media.stats.likes}</span>
                                          </div>
                                          <div className="flex items-center gap-1 font-bold text-sm">
                                              <MessageCircle size={16} className="fill-white" />
                                              <span>{media.stats.comments}</span>
                                          </div>
                                          <div className="flex items-center gap-1 font-bold text-sm">
                                              <Repeat size={16} />
                                              <span>{media.stats.reposts}</span>
                                          </div>
                                      </>
                                  )}
                              </div>
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

          {activeTab === 'archives' && isOwner && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {!archives || archives.length === 0 ? (
                      <div className="col-span-full text-center py-10 opacity-50">
                          <p className="text-secondary">No archived moments.</p>
                      </div>
                  ) : (
                      archives.map(post => (
                          <div
                              key={post._id}
                              className="bg-surface border border-soft-border rounded-xl p-4 cursor-pointer hover:shadow-md transition relative group overflow-hidden"
                              onClick={() => navigate(`/post/${post._id}`)}
                          >
                              <div className="flex justify-between items-start mb-2 opacity-50">
                                  <span className="text-[10px] font-bold uppercase">{post.type}</span>
                                  <EyeOff size={14} />
                              </div>
                              <p className="text-sm font-serif line-clamp-3 mb-2">{post.content || (post.media ? 'Media content' : '')}</p>
                              {post.media?.length > 0 && (
                                  <div className="h-20 bg-background rounded-lg mb-2 overflow-hidden">
                                      {post.media[0].type === 'video' ? (
                                        <div className="w-full h-full flex items-center justify-center bg-black"><ImageIcon className="text-white"/></div>
                                      ) : (
                                        <img src={post.media[0].url} className="w-full h-full object-cover" />
                                      )}
                                  </div>
                              )}

                              {/* Hover Stats */}
                              <div className="absolute inset-0 bg-surface/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex space-x-4 text-xs font-bold text-text">
                                      <div className="flex items-center space-x-1"><Heart size={14}/> <span>{post.likes?.length || 0}</span></div>
                                      <div className="flex items-center space-x-1"><MessageCircle size={14}/> <span>{post.commentCount || 0}</span></div>
                                      <div className="flex items-center space-x-1"><Repeat size={14}/> <span>{post.reposts?.length || 0}</span></div>
                                  </div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          )}
      </div>

      {/* Create Quote Modal */}
      <CreateQuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        identityId={currentIdentity?._id}
      />

      {/* Unified Reply/View Modal */}
      <ReplyQuoteModal
        quote={showMyQuoteOptions ? quote : replyQuote}
        onClose={() => {
            setShowMyQuoteOptions(false);
            setReplyQuote(null);
        }}
        isOwner={!!showMyQuoteOptions}
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

      <MediaViewer
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
