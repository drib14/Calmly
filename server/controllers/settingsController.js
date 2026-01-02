const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Identity = require('../models/Identity');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Message = require('../models/Message');
const Journal = require('../models/Journal');
const Quote = require('../models/Quote');
const Clip = require('../models/Clip');
const Notification = require('../models/Notification');
const Report = require('../models/Report');

// Helper to safely get user
const getUser = async (id) => {
    try {
        return await User.findById(id);
    } catch (e) {
        return null;
    }
};

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
      const user = await User.findById(req.user._id).select('-password -refreshToken -verificationToken');
      if (user) {
        // Ensure default settings structure exists if schema was updated
        if (!user.settings) user.settings = {};
        res.json(user.settings);
      } else {
        res.status(404).json({ message: 'User not found' });
      }
  } catch (error) {
      console.error("Get Settings Error:", error);
      res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update user settings (partial update)
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
      const user = await User.findById(req.user._id);

      if (user) {
        // Merge new settings with existing ones
        // Validate keys if necessary, for now trust schema
        user.settings = { ...user.settings, ...req.body };
        await user.save();
        res.json({ message: 'Settings updated', settings: user.settings });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
  } catch (error) {
      console.error("Update Settings Error:", error);
      res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Change Password
// @route   PUT /api/settings/password
// @access  Private
const changePassword = async (req, res) => {
  try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id);

      if (user && (await user.matchPassword(currentPassword))) {
        user.password = newPassword; // Will be hashed by pre-save
        await user.save();
        res.json({ message: 'Password updated successfully' });
      } else {
        res.status(401).json({ message: 'Invalid current password' });
      }
  } catch (error) {
      console.error("Change Password Error:", error);
      res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update Email
// @route   PUT /api/settings/email
// @access  Private
const updateEmail = async (req, res) => {
  try {
      const { email } = req.body;
      const user = await User.findById(req.user._id);

      if (user) {
        // Check if email already exists
        const emailExists = await User.findOne({ email });
        if (emailExists && emailExists._id.toString() !== user._id.toString()) {
          return res.status(400).json({ message: 'Email already in use' });
        }

        user.email = email;
        await user.save();
        res.json({ message: 'Email updated successfully.' });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
  } catch (error) {
      console.error("Update Email Error:", error);
      res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get Active Sessions
// @route   GET /api/settings/sessions
// @access  Private
const getSessions = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('sessions');

        if (!user) return res.status(404).json({ message: 'User not found' });

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
    } catch (error) {
        console.error("Get Sessions Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Logout All Devices
// @route   POST /api/settings/logout-all
// @access  Private
const logoutAllDevices = async (req, res) => {
  try {
      const user = await User.findById(req.user._id);
      if (user) {
        user.refreshToken = []; // Clear all refresh tokens
        user.sessions = []; // Clear session history
        await user.save();
        res.json({ message: 'Logged out from all devices' });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
  } catch (error) {
      console.error("Logout All Error:", error);
      res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete Account (Hard Delete as per request)
// @route   DELETE /api/settings/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
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
        Message.deleteMany({ $or: [{ sender: { $in: identityIds } }, { recipient: { $in: identityIds } }] }),
        // Delete Quotes
        Quote.deleteMany({ identity: { $in: identityIds } }),
        // Delete Clips
        Clip.deleteMany({ identity: { $in: identityIds } }),
        // Delete Notifications (sent by or for user)
        Notification.deleteMany({ $or: [{ sender: { $in: identityIds } }, { recipient: { $in: identityIds } }, { user: user._id }] }),
        // Delete Reports
        Report.deleteMany({ reporter: user._id })
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
  try {
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
        user.settings.journalPassword = null;
        await user.save();
        res.json({ message: 'Journal unlocked successfully' });
      }
  } catch (error) {
      console.error("Journal Lock Error:", error);
      res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Verify Journal Password
// @route   POST /api/settings/journal-verify
// @access  Private
const verifyJournalPassword = async (req, res) => {
  try {
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
  } catch (error) {
      console.error("Verify Journal Error:", error);
      res.status(500).json({ message: 'Server Error' });
  }
};

// Download User Data
const downloadUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

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
    console.error("Download Data Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Blocked Users Management
const getBlockedUsers = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('settings.blockedUsers', 'name handle avatar');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user.settings.blockedUsers || []);
    } catch (error) {
        console.error("Get Blocked Users Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const blockUser = async (req, res) => {
    try {
        const { identityId } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.settings.blockedUsers) user.settings.blockedUsers = [];

        if (!user.settings.blockedUsers.includes(identityId)) {
            user.settings.blockedUsers.push(identityId);
            await user.save();
        }
        res.json({ message: 'User blocked', blockedUsers: user.settings.blockedUsers });
    } catch (error) {
        console.error("Block User Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const unblockUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.settings.blockedUsers) {
            user.settings.blockedUsers = user.settings.blockedUsers.filter(id => id.toString() !== req.params.id);
            await user.save();
        }
        res.json({ message: 'User unblocked' });
    } catch (error) {
        console.error("Unblock User Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Muted Keywords Management
const getMutedKeywords = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user.settings.mutedKeywords || []);
    } catch (error) {
        console.error("Get Muted Keywords Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const addMutedKeyword = async (req, res) => {
    try {
        const { keyword } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.settings.mutedKeywords.includes(keyword)) {
            user.settings.mutedKeywords.push(keyword);
            await user.save();
        }
        res.json(user.settings.mutedKeywords);
    } catch (error) {
        console.error("Add Muted Keyword Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const removeMutedKeyword = async (req, res) => {
    try {
        const { keyword } = req.params;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.settings.mutedKeywords = user.settings.mutedKeywords.filter(k => k !== keyword);
        await user.save();
        res.json(user.settings.mutedKeywords);
    } catch (error) {
        console.error("Remove Muted Keyword Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Muted Conversations Management
const getMutedConversations = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const mutedIds = user.settings.mutedConversations || [];
        const mutedIdentities = await Identity.find({ _id: { $in: mutedIds } }).select('name handle avatar');

        res.json(mutedIdentities);
    } catch (error) {
        console.error("Get Muted Conversations Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const unmuteConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.settings.mutedConversations) {
            user.settings.mutedConversations = user.settings.mutedConversations.filter(mutedId => mutedId.toString() !== id);
            await user.save();
        }
        res.json({ message: 'Conversation unmuted' });
    } catch (error) {
        console.error("Unmute Conversation Error:", error);
        res.status(500).json({ message: 'Server Error' });
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
  getBlockedUsers,
  blockUser,
  unblockUser,
  getMutedKeywords,
  addMutedKeyword,
  removeMutedKeyword,
  getMutedConversations,
  unmuteConversation
};
