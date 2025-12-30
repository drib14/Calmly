const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Journal = require('../models/Journal');

// Get all journal entries
router.get('/', protect, async (req, res) => {
  try {
    // Security Check: If journal is locked, require a verification header/token
    // For simplicity in this session, we check if the user settings has lock enabled.
    // If enabled, we expect a 'x-journal-token' header which we (hypothetically) issued on verify.
    // However, implementing a full token issue system now is complex.
    // Instead, we will rely on the fact that the frontend only calls this AFTER unlock.
    // But to satisfy the "API Protection" requirement:
    // We can't easily protect it without session state or a token.
    // Let's assume the user IS authenticated. The requirement "prevent other person reading... if I forgot to logout"
    // implies someone has my session.
    // If I add a secondary password check here, I need to send the password with the GET request.
    // The most robust simple way: Pass the PIN in a header 'x-journal-pin'.

    if (req.user.settings?.journalLocked) {
        const pin = req.headers['x-journal-pin'];
        if (!pin) {
             return res.status(403).json({ message: 'Journal is locked. PIN required.' });
        }
        // Verify PIN
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(pin, req.user.settings.journalPassword);
        if (!isMatch) {
             return res.status(403).json({ message: 'Invalid Journal PIN.' });
        }
    }

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
