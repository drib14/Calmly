const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Identity = require('../models/Identity');

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
    // Check duplication (Handle uniqueness)
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

// Delete Identity (Soft Delete or Hard Delete logic if unused)
// For MVP, we'll hard delete if no posts, or soft delete if posts exist?
// User asked to delete pseudonym but keep posts. So we cannot hard delete if referenced.
// However, if we delete the identity document, the population in Post will be null.
// Solution: We should mark it as deleted in DB, and frontend should handle null identity.
// Or we just block deletion if posts exist?
// User said "post card that uses that pseudoname will remain". This implies keeping the data.
// So we keep the identity but maybe mark `isDeleted: true` and remove it from the user's selection list.

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
