const Clip = require('../models/Clip');
const Identity = require('../models/Identity');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new clip
// @route   POST /api/clips
// @access  Private
const createClip = async (req, res) => {
  try {
    const { identityId } = req.body;

    let mediaUrl = req.body.mediaUrl;
    let mediaType = req.body.mediaType || 'image';

    if (req.file) {
        mediaUrl = req.file.path;
        if (req.file.mimetype.startsWith('video')) {
            mediaType = 'video';
        } else {
            mediaType = 'image';
        }
    }

    if (!mediaUrl) {
        return res.status(400).json({ message: 'Media is required' });
    }

    const identity = await Identity.findOne({ _id: identityId, user: req.user._id });
    if (!identity) {
      return res.status(401).json({ message: 'Unauthorized identity' });
    }

    const clip = await Clip.create({
      user: req.user._id,
      identity: identityId,
      mediaUrl,
      mediaType,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await clip.populate('identity', 'name handle avatar type');

    const io = req.app.get('io');
    if (io) {
        io.emit('new_clip', clip);
    }

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
        const liked = clip.likes ? clip.likes.some(l => identityIds.some(myId => myId.toString() === l.toString())) : false;
        return {
            ...clip.toObject(),
            isMine,
            viewed,
            liked
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

// @desc    Like a clip
// @route   PUT /api/clips/:id/like
// @access  Private
const likeClip = async (req, res) => {
  try {
    const { identityId } = req.body;
    const clip = await Clip.findById(req.params.id);

    if (!clip) return res.status(404).json({ message: 'Clip not found' });

    const identity = await Identity.findOne({ _id: identityId, user: req.user._id });
    if (!identity) return res.status(403).json({ message: 'Invalid identity' });

    if (!clip.likes) clip.likes = [];

    const index = clip.likes.indexOf(identityId);
    if (index === -1) {
        clip.likes.push(identityId);

        // Notify owner
        if (clip.user.toString() !== req.user._id.toString()) {
            const recipientIdentity = await Identity.findById(clip.identity);
            if (recipientIdentity) {
                const notification = await Notification.create({
                    recipient: clip.identity,
                    user: recipientIdentity.user,
                    sender: identityId,
                    type: 'clip_like', // Ensure this type is handled in frontend
                    clip: clip._id
                });
                const io = req.app.get('io');
                if (io) io.to(recipientIdentity.user.toString()).emit('new_notification', notification);
            }
        }

    } else {
        clip.likes.splice(index, 1);
    }

    await clip.save();
    res.json(clip.likes);
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
            .populate('viewers', 'name handle avatar type')
            .populate('likes', 'name handle avatar type');

        if (!clip) return res.status(404).json({ message: 'Clip not found' });
        if (clip.user.toString() !== req.user._id.toString()) {
             return res.status(403).json({ message: 'Only owner can view analytics' });
        }

        const views = clip.viewers.map(v => ({ identity: v, timestamp: new Date() }));
        const reactions = clip.likes ? clip.likes.map(l => ({ identity: l, type: 'heart' })) : [];

        res.json({
            views: views,
            reactions: reactions
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
  likeClip,
  getClipDetails,
  deleteClip
};
