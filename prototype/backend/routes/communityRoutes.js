const express = require("express");
const protect = require("../middleware/authMiddleware");
const controller = require("../controllers/communityController");
const admin = require('../middleware/adminMiddleware');

const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

router.get('/', controller.listIssues);
router.get('/:id', controller.getIssue);
router.get('/stats', controller.getStats);
router.get('/top-contributors', controller.topContributors);

router.post('/', protect, upload.array('images', 5), controller.createIssue);
router.put('/:id', protect, upload.array('images', 5), controller.updateIssue);
router.delete('/:id', protect, controller.deleteIssue);
router.post('/:id/vote', protect, controller.voteIssue);
router.post('/:id/comments', protect, controller.addComment);
router.post('/:id/resolve', protect, admin, controller.resolveIssue);

module.exports = router;
