const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/cloudinary');
const {
  createClip,
  getClipFeed,
  viewClip,
  likeClip,
  deleteClip,
  getClipDetails
} = require('../controllers/clipController');

router.use(protect);

router.post('/', upload.single('media'), createClip);
router.get('/feed', getClipFeed);
router.post('/:id/view', viewClip);
router.put('/:id/like', likeClip);
router.get('/:id/details', getClipDetails);
router.delete('/:id', deleteClip);

module.exports = router;
