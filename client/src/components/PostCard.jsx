// ⬇️ imports unchanged (trimmed for readability)
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import useSWR from "swr";
import ReactDOM from "react-dom";
import {
  Heart,
  Repeat,
  MoreHorizontal,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Eye,
  Globe,
  Lock,
  Trash2,
  Flag,
  X,
} from "lucide-react";

import Avatar from "./Avatar";
import MediaPlayer from "./MediaPlayer";
import MediaViewer from "./MediaViewer";
import CommentsSection from "./CommentsSection";
import Modal from "./Modal";
import ConfirmationModal from "./ConfirmationModal";
import EditPostModal from "./EditPostModal";
import ShareModal from "./ShareModal";
import ReactorsModal from "./ReactorsModal";

import { useIdentity } from "../context/IdentityContext";
import { useSettings } from "../hooks/useSettings";
import { useClickOutside } from "../hooks/useClickOutside";
import { formatShortTime } from "../utils/dateUtils";
import { toast } from "react-hot-toast";

const PostCard = ({ post, mutate }) => {
  const navigate = useNavigate();
  const { currentIdentity, identities } = useIdentity();
  const { settings } = useSettings();

  const [expanded, setExpanded] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const optionsRef = useRef(null);

  useClickOutside(optionsRef, () => setShowOptions(false));

  useEffect(() => {
    if (post.likes) {
      setIsLiked(
        post.likes.some(
          (l) =>
            l.identity === currentIdentity?._id ||
            l.identity?._id === currentIdentity?._id
        )
      );
      setLikeCount(post.likes.length);
    }
  }, [post.likes, currentIdentity]);

  const handleLike = async () => {
    if (!currentIdentity) return toast.error("Select an identity first");

    setIsLiked((prev) => !prev);
    setLikeCount((c) => (isLiked ? c - 1 : c + 1));

    try {
      await axios.put(`/posts/${post._id}/like`, {
        identityId: currentIdentity._id,
      });
      mutate();
    } catch {
      toast.error("Failed to update like");
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-3xl p-6 mb-6 border"
    >
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <Avatar identity={post.identity} />
          <div>
            <p className="font-bold">{post.identity?.name}</p>
            <div className="text-xs text-secondary flex gap-2 items-center">
              <span>{formatShortTime(post.createdAt)}</span>
              {post.visibility === "public" && <Globe size={12} />}
              {post.visibility === "private" && <Lock size={12} />}
              {post.visibility === "unlisted" && <EyeOff size={12} />}
            </div>
          </div>
        </div>

        <div ref={optionsRef} className="relative">
          <button onClick={() => setShowOptions((v) => !v)}>
            <MoreHorizontal />
          </button>

          <AnimatePresence>
            {showOptions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-8 bg-surface rounded-xl shadow-lg p-2"
              >
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex gap-2 px-3 py-2 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex gap-2 px-3 py-2 text-sm text-red-500"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CONTENT */}
      <div className="whitespace-pre-wrap mb-4">{post.content}</div>

      {/* MEDIA */}
      {post.media?.length > 0 && (
        <div className="mb-4">
          {post.media[0].type === "video" ? (
            <MediaPlayer src={post.media[0].url} />
          ) : (
            <img
              src={post.media[0].url}
              className="rounded-xl max-h-[70vh] object-contain"
            />
          )}
        </div>
      )}

      {/* ACTION BAR */}
      <div className="flex gap-6 pt-4 border-t">
        <button onClick={handleLike} className="flex gap-2">
          <Heart className={isLiked ? "fill-red-500 text-red-500" : ""} />
          <span>{likeCount}</span>
        </button>

        <button onClick={() => setExpanded((v) => !v)} className="flex gap-2">
          <MessageCircle />
          <span>{post.commentCount || 0}</span>
        </button>

        <button className="flex gap-2">
          <Repeat />
          <span>{post.reposts?.length || 0}</span>
        </button>
      </div>

      {/* COMMENTS */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden mt-4"
          >
            <CommentsSection postId={post._id} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {}}
        title="Delete post?"
      />

      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={post}
      />
    </motion.div>
  );
};

export default PostCard;
