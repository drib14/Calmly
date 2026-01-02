const Clip = require('../models/Clip');
const Identity = require('../models/Identity');
const User = require('../models/User');

// @desc    Create a new clip
// @route   POST /api/clips
// @access  Private
const createClip = async (req, res) => {
  try {
    const { identityId } = req.body;

    // Check if file was uploaded
    let mediaUrl = req.body.mediaUrl; // Allow passing URL directly if needed
    let mediaType = req.body.mediaType || 'image';

    if (req.file) {
        mediaUrl = req.file.path;
        // Determine type from mimetype
        if (req.file.mimetype.startsWith('video')) {
            mediaType = 'video';
        } else {
            mediaType = 'image';
        }
    }

    if (!mediaUrl) {
        return res.status(400).json({ message: 'Media is required' });
    }

    // Verify identity ownership
    const identity = await Identity.findOne({ _id: identityId, user: req.user._id });
    if (!identity) {
      return res.status(401).json({ message: 'Unauthorized identity' });
    }

    const clip = await Clip.create({
      user: req.user._id,
      identity: identityId,
      mediaUrl,
      mediaType,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Populate identity for immediate return
    await clip.populate('identity', 'name handle avatar type');

    res.status(201).json(clip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get clip feed (friends + mine)
// @route   GET /api/clips/feed
// @access  Private
const getClipFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const blockedUsers = user.settings?.blockedUsers || [];

    // Only show clips that expire in the future
    const clips = await Clip.find({
      identity: { $nin: blockedUsers },
      expiresAt: { $gt: new Date() }
    })
    .populate('identity', 'name handle avatar type')
    .sort({ createdAt: -1 });

    const identityIds = await Identity.find({ user: req.user._id }).distinct('_id');

    const enhancedClips = clips.map(clip => {
        const isMine = identityIds.some(id => id.toString() === clip.identity._id.toString());
        const viewed = clip.viewers.some(v => identityIds.some(myId => myId.toString() === v.toString()));
        return {
            ...clip.toObject(),
            isMine,
            viewed
        };
    });

    res.json(enhancedClips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark clip as viewed
// @route   POST /api/clips/:id/view
// @access  Private
const viewClip = async (req, res) => {
  try {
    const { id } = req.params;
    const { identityId } = req.body;

    let viewerIdentityId = identityId;
    if (!viewerIdentityId) {
        const firstId = await Identity.findOne({ user: req.user._id });
        if (firstId) viewerIdentityId = firstId._id;
    }

    if (!viewerIdentityId) return res.status(400).json({ message: 'Identity required' });

    const clip = await Clip.findById(id);
    if (!clip) return res.status(404).json({ message: 'Clip not found' });

    if (!clip.viewers.includes(viewerIdentityId)) {
      clip.viewers.push(viewerIdentityId);
      await clip.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Clip Details
// @route   GET /api/clips/:id/details
// @access  Private
const getClipDetails = async (req, res) => {
    try {
        const clip = await Clip.findById(req.params.id)
            .populate('viewers', 'name handle avatar type');

        if (!clip) return res.status(404).json({ message: 'Clip not found' });
        if (clip.user.toString() !== req.user._id.toString()) {
             return res.status(403).json({ message: 'Only owner can view analytics' });
        }

        // Clip schema stores viewers as Identity IDs in 'viewers' array
        // We map this to match Quote analytics format { views: [{ identity: ... }], reactions: [] }
        // Clips don't have reactions in schema yet? Check schema.
        // Clip schema: viewers: [Identity]
        // No reactions array in Clip schema provided earlier.

        const views = clip.viewers.map(v => ({ identity: v, timestamp: new Date() })); // Timestamp mock if not in schema

        res.json({
            views: views,
            reactions: [] // Placeholder
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete clip
// @route   DELETE /api/clips/:id
// @access  Private
const deleteClip = async (req, res) => {
  try {
    const clip = await Clip.findById(req.params.id);

    if (!clip) {
      return res.status(404).json({ message: 'Clip not found' });
    }

    if (clip.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await clip.deleteOne();
    res.json({ message: 'Clip removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createClip,
  getClipFeed,
  viewClip,
  getClipDetails,
  deleteClip
};
