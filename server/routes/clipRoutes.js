const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/cloudinary');
const {
  createClip,
  getClipFeed,
  viewClip,
  deleteClip,
  getClipDetails
} = require('../controllers/clipController');

router.use(protect);

router.post('/', upload.single('media'), createClip);
router.get('/feed', getClipFeed);
router.post('/:id/view', viewClip);
router.get('/:id/details', getClipDetails);
router.delete('/:id', deleteClip);

module.exports = router;
