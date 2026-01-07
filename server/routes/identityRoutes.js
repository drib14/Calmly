const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Identity = require('../models/Identity');
const { upload } = require('../utils/cloudinary');

// Get all identities for the logged in user (excluding deleted)
router.get('/', protect, async (req, res) => {
  try {
    const identities = await Identity.find({ user: req.user._id, isDeleted: false });
    res.json(identities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new identity (Pseudonym)
router.post('/', protect, async (req, res) => {
  const { name, bio, avatar } = req.body;

  if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
  }

  // Base handle generation
  let handle = `@${name.trim().replace(/\s+/g, '').toLowerCase()}`;

  // Ensure handle isn't empty/invalid
  if (handle === '@') {
      handle = `@user_${Math.floor(Math.random() * 10000)}`;
  }

  try {
    // Check for collision and retry with suffix
    let exists = await Identity.findOne({ handle });
    if (exists) {
        // Append random 4-digit number
        const suffix = Math.floor(1000 + Math.random() * 9000); // 1000-9999
        handle = `${handle}_${suffix}`;

        // Double check (unlikely to collide again, but good practice)
        exists = await Identity.findOne({ handle });
        if (exists) {
             return res.status(400).json({ message: 'Pseudonym handle collision. Please try a different name.' });
        }
    }

    const identity = await Identity.create({
      user: req.user._id,
      type: 'pseudonym',
      name: name.trim(),
      bio,
      avatar,
      handle,
    });
    res.status(201).json(identity);
  } catch (error) {
    console.error("Create Identity Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update Identity (Photo Uploads)
router.put('/:id', protect, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'coverPhoto', maxCount: 1 }]), async (req, res) => {
    try {
        const identity = await Identity.findOne({ _id: req.params.id, user: req.user._id });
        if (!identity) return res.status(404).json({ message: 'Identity not found' });

        if (req.files && req.files['avatar']) {
            if (identity.avatar) {
                identity.avatarHistory.push(identity.avatar);
            }
            identity.avatar = req.files['avatar'][0].path;
        }
        if (req.files && req.files['coverPhoto']) {
             if (identity.coverPhoto) {
                identity.coverHistory.push(identity.coverPhoto);
            }
            identity.coverPhoto = req.files['coverPhoto'][0].path;
        }

        // Allow setting existing URL as avatar/cover (from history)
        if (req.body.avatarUrl) {
            if (identity.avatar && identity.avatar !== req.body.avatarUrl) {
                identity.avatarHistory.push(identity.avatar);
            }
            identity.avatar = req.body.avatarUrl;
        }
        if (req.body.coverPhotoUrl) {
            if (identity.coverPhoto && identity.coverPhoto !== req.body.coverPhotoUrl) {
                identity.coverHistory.push(identity.coverPhoto);
            }
            identity.coverPhoto = req.body.coverPhotoUrl;
        }

        // Allow updating text fields too if sent
        if (req.body.name) identity.name = req.body.name;
        if (req.body.bio) identity.bio = req.body.bio;

        await identity.save();
        res.json(identity);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Remove Photo (Avatar or Cover)
router.delete('/:id/photo', protect, async (req, res) => {
    const { type } = req.query; // 'avatar' or 'coverPhoto'
    try {
        const identity = await Identity.findOne({ _id: req.params.id, user: req.user._id });
        if (!identity) return res.status(404).json({ message: 'Identity not found' });

        if (type === 'avatar') identity.avatar = '';
        if (type === 'coverPhoto') identity.coverPhoto = '';

        await identity.save();
        res.json(identity);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Identity (Soft Delete)
router.delete('/:id', protect, async (req, res) => {
    try {
        const identity = await Identity.findOne({ _id: req.params.id, user: req.user._id });
        if (!identity) return res.status(404).json({ message: 'Identity not found' });

        if (identity.type === 'real') return res.status(400).json({ message: 'Cannot delete real identity' });

        identity.isDeleted = true;
        await identity.save();

        res.json({ message: 'Identity removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
