const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: true,
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  refreshToken: [String],
  sessions: [{
    deviceId: String,
    lastActive: Date,
    userAgent: String
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Comprehensive Settings Schema
  settings: {
    // Account
    loginHistory: [{ date: Date, ip: String, device: String }],

    // Identity & Privacy
    defaultIdentityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Identity' },
    hideRealNameGlobally: { type: Boolean, default: false },
    hideProfileFromSearch: { type: Boolean, default: false },
    allowProfileViewing: { type: Boolean, default: true },

    // Posting & Content
    defaultPostType: { type: String, default: 'confession' }, // confession, poetry, letter, mood
    defaultMood: { type: String, default: 'Neutral' },
    autoContentWarning: { type: Boolean, default: false },
    enableDrafts: { type: Boolean, default: true },
    scheduledPosting: { type: Boolean, default: false },
    autoDeleteTimer: { type: Number, default: 0 }, // 0 = disabled, hours

    // Interaction Controls
    enableReactions: { type: Boolean, default: true },
    enableComments: { type: Boolean, default: true },
    allowAnonymousComments: { type: Boolean, default: true },
    allowPseudonymComments: { type: Boolean, default: true },
    limitCommentsPerPost: { type: Number, default: 0 }, // 0 = unlimited
    autoSavePosts: { type: Boolean, default: false },

    // Messaging
    enablePrivateMessaging: { type: Boolean, default: true },
    allowAnonymousDMs: { type: Boolean, default: false }, // Default off for safety
    allowPseudonymDMs: { type: Boolean, default: true },
    requireMessageApproval: { type: Boolean, default: true },
    showTypingIndicator: { type: Boolean, default: true },
    readReceipts: { type: Boolean, default: true },
    messageAutoDeleteTimer: { type: Number, default: 0 },

    // Safety & Mental Health
    enableSafeMode: { type: Boolean, default: false }, // Hide triggering words
    triggerKeywords: [String],
    coolDownTimer: { type: Number, default: 0 }, // Minutes between posts
    region: { type: String, default: 'Global' },

    // Notifications
    inAppNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    quietHoursStart: String, // "22:00"
    quietHoursEnd: String,   // "08:00"

    // Moderation
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Identity' }],
    mutedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Identity' }],
    mutedKeywords: [String],
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    hiddenPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],

    // Journal
    enableJournal: { type: Boolean, default: true },
    autoArchiveExpired: { type: Boolean, default: true }, // Archive Quotes/Clips instead of delete
    journalLocked: { type: Boolean, default: false },
    journalPassword: { type: String, default: null }, // Hashed separately ideally, or re-use login

    // Appearance
    theme: { type: String, default: 'soft-light' }, // soft-light, dark, sage, ocean
    fontFamily: { type: String, default: 'font-serif' },
    fontSize: { type: String, default: 'medium' }, // small, medium, large
    reducedMotion: { type: Boolean, default: false },
    highContrast: { type: Boolean, default: false },
  },
  deletedAt: {
    type: Date,
    default: null, // Soft delete
  },
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
