const express = require('express');
const protect = require('../middleware/authMiddleware');

const router = express.Router();
const userController = require('../controllers/userController');

router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

router.get('/leaderboard', userController.getLeaderboard);

module.exports = router;
