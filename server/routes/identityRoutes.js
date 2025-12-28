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
  const handle = `@${name.replace(/\s+/g, '').toLowerCase()}`;

  try {
    const exists = await Identity.findOne({ handle });
    if (exists) {
        return res.status(400).json({ message: 'Pseudonym already taken' });
    }

    const identity = await Identity.create({
      user: req.user._id,
      type: 'pseudonym',
      name,
      bio,
      avatar,
      handle,
    });
    res.status(201).json(identity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Identity (Photo Uploads)
router.put('/:id', protect, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'coverPhoto', maxCount: 1 }]), async (req, res) => {
    try {
        const identity = await Identity.findOne({ _id: req.params.id, user: req.user._id });
        if (!identity) return res.status(404).json({ message: 'Identity not found' });

        if (req.files['avatar']) {
            identity.avatar = req.files['avatar'][0].path;
        }
        if (req.files['coverPhoto']) {
            identity.coverPhoto = req.files['coverPhoto'][0].path;
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
