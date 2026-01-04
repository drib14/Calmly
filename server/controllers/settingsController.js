const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -refreshToken -verificationToken');
  if (user) {
    res.json(user.settings);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user settings (partial update)
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // Merge new settings with existing ones
    user.settings = { ...user.settings, ...req.body };
    await user.save();
    res.json({ message: 'Settings updated', settings: user.settings });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Change Password
// @route   PUT /api/settings/password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (user && (await user.matchPassword(currentPassword))) {
    user.password = newPassword; // Will be hashed by pre-save
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } else {
    res.status(401).json({ message: 'Invalid current password' });
  }
};

// @desc    Update Email
// @route   PUT /api/settings/email
// @access  Private
const updateEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findById(req.user._id);

  if (user) {
    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists && emailExists._id.toString() !== user._id.toString()) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    user.email = email;
    user.isVerified = false; // Require re-verification
    // Logic to send new verification email would go here
    await user.save();
    res.json({ message: 'Email updated. Please verify your new email address.' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Get Active Sessions
// @route   GET /api/settings/sessions
// @access  Private
const getSessions = async (req, res) => {
    // In a real implementation, we would query a Sessions collection or inspect User.sessions array
    // if we tracked detailed session info on login.
    // For now, we return a mock list simulating tracking to fulfill the UI requirement
    // while keeping the backend changes safe/minimal.

    // Check if we have sessions in user object (from schema update)
    const user = await User.findById(req.user._id).select('sessions');

    let sessionList = user.sessions || [];

    // If empty (legacy users), return current session mock
    if (sessionList.length === 0) {
        sessionList = [
            {
                _id: 'current',
                deviceId: 'Current Device',
                userAgent: req.headers['user-agent'],
                lastActive: new Date(),
                current: true
            }
        ];
    }

    res.json(sessionList);
};

// @desc    Logout All Devices
// @route   POST /api/settings/logout-all
// @access  Private
const logoutAllDevices = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.refreshToken = []; // Clear all refresh tokens
    user.sessions = []; // Clear session history if tracked
    await user.save();
    res.json({ message: 'Logged out from all devices' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Delete Account (Hard Delete as per request)
// @route   DELETE /api/settings/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const Identity = require('../models/Identity');
    const Post = require('../models/Post');
    const Comment = require('../models/Comment');
    const Message = require('../models/Message');
    const Journal = require('../models/Journal');

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find all identities associated with the user
    const identities = await Identity.find({ user: user._id });
    const identityIds = identities.map(i => i._id);

    // Delete all related data
    await Promise.all([
        // Delete User's Identities
        Identity.deleteMany({ user: user._id }),
        // Delete User's Journal Entries
        Journal.deleteMany({ user: user._id }),
        // Delete Posts by User's Identities
        Post.deleteMany({ identity: { $in: identityIds } }),
        // Delete Comments by User's Identities
        Comment.deleteMany({ identity: { $in: identityIds } }),
        // Delete Messages sent by or received by User's Identities
        Message.deleteMany({ $or: [{ sender: { $in: identityIds } }, { recipient: { $in: identityIds } }] })
    ]);

    // Finally, delete the user
    await User.findByIdAndDelete(user._id);

    res.json({ message: 'Account and all associated data permanently deleted.' });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle Journal Lock
// @route   PUT /api/settings/journal-lock
// @access  Private
const toggleJournalLock = async (req, res) => {
  const { locked, password } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Enabling Lock
  if (locked) {
    if (!password) {
      return res.status(400).json({ message: 'Password is required to lock journal' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.settings.journalLocked = true;
    user.settings.journalPassword = hashedPassword;
    await user.save();
    res.json({ message: 'Journal locked successfully' });
  }
  // Disabling Lock
  else {
    if (!password) {
      return res.status(400).json({ message: 'Password is required to unlock journal' });
    }

    // Verify password against stored journalPassword
    const isMatch = await bcrypt.compare(password, user.settings.journalPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect journal password' });
    }

    user.settings.journalLocked = false;
    user.settings.journalPassword = null; // Clear it or keep it? Clearing is safer.
    await user.save();
    res.json({ message: 'Journal unlocked successfully' });
  }
};

// @desc    Verify Journal Password
// @route   POST /api/settings/journal-verify
// @access  Private
const verifyJournalPassword = async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) return res.status(404).json({ message: 'User not found' });

  if (!user.settings.journalLocked) {
      return res.json({ success: true, message: 'Journal is not locked' });
  }

  const isMatch = await bcrypt.compare(password, user.settings.journalPassword);
  if (isMatch) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Incorrect password' });
  }
};

// Download User Data
const downloadUserData = async (req, res) => {
  try {
    const Identity = require('../models/Identity');
    const Post = require('../models/Post');
    const Comment = require('../models/Comment');
    const Message = require('../models/Message');
    const Journal = require('../models/Journal');

    const user = await User.findById(req.user.id).select('-password');
    const identities = await Identity.find({ user: req.user._id });
    const identityIds = identities.map(i => i._id);

    // Fetch Posts
    const posts = await Post.find({ identity: { $in: identityIds } });

    // Fetch Comments
    const comments = await Comment.find({ identity: { $in: identityIds } });

    // Fetch Messages (Sent and Received)
    const messages = await Message.find({
        $or: [{ sender: { $in: identityIds } }, { recipient: { $in: identityIds } }]
    }).populate('sender', 'name handle').populate('recipient', 'name handle');

    // Fetch Journal Entries
    const journalEntries = await Journal.find({ user: req.user._id });

    res.json({
        user,
        identities,
        posts,
        comments,
        messages,
        journalEntries
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Hide a post
// @route   POST /api/settings/hide-post
// @access  Private
const hidePost = async (req, res) => {
  const { postId } = req.body;
  const user = await User.findById(req.user._id);

  if (user) {
      if (!user.settings.hiddenPosts.includes(postId)) {
          user.settings.hiddenPosts.push(postId);
          await user.save();
      }
      res.json({ message: 'Post hidden', hiddenPosts: user.settings.hiddenPosts });
  } else {
      res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Block a user
// @route   POST /api/settings/block-user
// @access  Private
const blockUser = async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(req.user._id);

  if (user) {
      if (userId && userId.toString() !== user._id.toString()) {
          if (!user.settings.blockedUsers.includes(userId)) {
              user.settings.blockedUsers.push(userId);
              await user.save();
          }
          res.json({ message: 'User blocked', blockedUsers: user.settings.blockedUsers });
      } else {
          res.status(400).json({ message: 'Invalid user ID' });
      }
  } else {
      res.status(404).json({ message: 'User not found' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  changePassword,
  updateEmail,
  logoutAllDevices,
  getSessions,
  deleteAccount,
  toggleJournalLock,
  verifyJournalPassword,
  downloadUserData,
  hidePost,
  blockUser
};
