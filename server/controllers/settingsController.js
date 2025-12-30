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

// @desc    Delete Account (Soft)
// @route   DELETE /api/settings/account
// @access  Private
const deleteAccount = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.deletedAt = new Date();
    user.refreshToken = [];
    await user.save();
    res.json({ message: 'Account scheduled for deletion. Goodbye.' });
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
  deleteAccount
};
