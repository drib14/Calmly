const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Identity = require('../models/Identity');

// Get all identities for the logged in user
router.get('/', protect, async (req, res) => {
  try {
    const identities = await Identity.find({ user: req.user._id });
    res.json(identities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new identity (Pseudonym)
router.post('/', protect, async (req, res) => {
  const { name, bio, avatar } = req.body;
  try {
    const identity = await Identity.create({
      user: req.user._id,
      type: 'pseudonym',
      name,
      bio,
      avatar,
      handle: `@${name.replace(/\s+/g, '').toLowerCase()}`,
    });
    res.status(201).json(identity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
