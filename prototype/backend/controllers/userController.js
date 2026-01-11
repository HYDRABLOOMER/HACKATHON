const User = require('../models/User');

const getLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const top = await User.find({}).sort({ ecoPoints: -1, streak: -1 }).limit(limit).select('name email ecoPoints streak completedTasks completedQuizzes');
    let me = null;
    if (req.user) {
      const myUser = await User.findById(req.user._id).select('name email ecoPoints streak completedTasks completedQuizzes');
      if (myUser) {
        const higherCount = await User.countDocuments({ ecoPoints: { $gt: myUser.ecoPoints } });
        me = { user: myUser, rank: higherCount + 1 };
      }
    }
    res.json({ success: true, leaderboard: top, me });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getLeaderboard };
