const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/cloudinary');
const {
  createClip,
  getClipFeed,
  viewClip,
  deleteClip,
  likeClip
} = require('../controllers/clipController');

router.use(protect);

router.post('/', upload.single('media'), createClip);
router.get('/feed', getClipFeed);
router.post('/:id/view', viewClip);
router.delete('/:id', deleteClip);
// router.put('/:id/like', likeClip); // Future implementation

module.exports = router;
