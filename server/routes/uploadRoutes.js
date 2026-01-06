const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { cloudinary } = require('../utils/cloudinary');

// Get upload signature
router.get('/signature', protect, (req, res) => {
  const timestamp = Math.round((new Date).getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request({
    timestamp: timestamp,
    folder: 'calmly_uploads',
  }, process.env.CLOUDINARY_API_SECRET);

  res.json({
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder: 'calmly_uploads'
  });
});

module.exports = router;
