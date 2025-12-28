const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Journal = require('../models/Journal');

// Get all journal entries
router.get('/', protect, async (req, res) => {
  try {
    const entries = await Journal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create journal entry
router.post('/', protect, async (req, res) => {
  const { title, content, mood, tags, isLocked } = req.body;
  try {
    const entry = await Journal.create({
      user: req.user._id,
      title,
      content,
      mood,
      tags,
      isLocked
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete journal entry
router.delete('/:id', protect, async (req, res) => {
  try {
    const entry = await Journal.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await entry.deleteOne();
    res.json({ message: 'Entry removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
