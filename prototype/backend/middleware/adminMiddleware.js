const admin = (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin only' });
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = admin;
