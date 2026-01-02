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

    // Emit socket event if needed (future)
    const io = req.app.get('io');
    // io.emit('new_clip', clip);

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
    // Logic similar to posts/quotes feed. For now, fetch all non-expired clips or filter by blocked.
    // In a real app, we filter by friends. Here we might just return all for the "community" feel
    // respecting blocks.

    const user = await User.findById(req.user._id);
    const blockedUsers = user.settings?.blockedUsers || [];
    const hiddenContent = user.settings?.hiddenContent || []; // if exists

    // Find clips not from blocked identities
    const clips = await Clip.find({
      identity: { $nin: blockedUsers },
      expiresAt: { $gt: new Date() }
    })
    .populate('identity', 'name handle avatar type')
    .sort({ createdAt: -1 });

    // Enhance with "viewed" status
    const identityIds = await Identity.find({ user: req.user._id }).distinct('_id'); // My identities

    const enhancedClips = clips.map(clip => {
        const isMine = identityIds.some(id => id.toString() === clip.identity._id.toString());
        // Check if ANY of my identities viewed it? Or just the current user context?
        // Usually viewed by "User". But we store Viewers as Identities or Users?
        // Schema says `viewers: [Identity]`.
        // So we need to check if any of my identities are in the viewers list.
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
    const { identityId } = req.body; // Which identity is viewing? Defaults to first if not sent?

    // If identityId not provided, maybe use default?
    // Ideally frontend sends the current viewing identity.

    // Determine viewer identity
    let viewerIdentityId = identityId;
    if (!viewerIdentityId) {
        // Fallback to first identity of user
        const firstId = await Identity.findOne({ user: req.user._id });
        if (firstId) viewerIdentityId = firstId._id;
    }

    if (!viewerIdentityId) return res.status(400).json({ message: 'Identity required' });

    const clip = await Clip.findById(id);
    if (!clip) return res.status(404).json({ message: 'Clip not found' });

    // Add to viewers if not already present
    if (!clip.viewers.includes(viewerIdentityId)) {
      clip.viewers.push(viewerIdentityId);
      await clip.save();
    }

    res.json({ success: true });
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
  deleteClip
};
