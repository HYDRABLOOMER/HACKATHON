const CommunityIssue = require('../models/CommunityIssue');

const createIssue = async (req, res) => {
  try {
    const { title, description, location, locationLat, locationLng } = req.body;
    if (!title || !description)
      return res.status(400).json({ message: 'Title and description required' });

    const images = [];
    if (req.files && req.files.length) {
      for (const f of req.files) images.push(`/uploads/${f.filename}`);
    }

    const issue = await CommunityIssue.create({
      title,
      description,
      location,
      locationLat: locationLat ? parseFloat(locationLat) : undefined,
      locationLng: locationLng ? parseFloat(locationLng) : undefined,
      images,
      createdBy: req.user._id
    });

    const populated = await issue.populate('createdBy', 'name email');
    res.status(201).json({ success: true, issue: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listIssues = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const { status, q, sort } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };

    let query = CommunityIssue.find(filter)
      .populate('createdBy', 'name email')
      .skip(skip)
      .limit(limit);

    if (sort === 'votes' || sort === 'popular') query = query.sort({ votes: -1 });
    else if (sort === 'urgent') query = query.sort({ priority: -1, createdAt: -1 });
    else query = query.sort({ createdAt: -1 });

    const [issues, total] = await Promise.all([query.exec(), CommunityIssue.countDocuments(filter)]);
    res.json({ success: true, total, page, pages: Math.ceil(total / limit), issues });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const resolved = await CommunityIssue.countDocuments({ status: 'resolved' });
    const inProgress = await CommunityIssue.countDocuments({ status: 'in_progress' });
    const openCount = await CommunityIssue.countDocuments({ status: 'open' });
    const activeAgg = await CommunityIssue.aggregate([{ $group: { _id: '$createdBy' } }, { $count: 'active' }]);
    const active = (activeAgg[0] && activeAgg[0].active) || 0;
    res.json({ success: true, resolved, inProgress, open: openCount, active });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const topContributors = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 50);
    const agg = await CommunityIssue.aggregate([
      { $group: { _id: '$createdBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);
    const User = require('../models/User');
    const results = [];
    for (const row of agg) {
      const user = await User.findById(row._id).select('name');
      results.push({ user: user ? { id: user._id, name: user.name } : null, count: row.count });
    }
    res.json({ success: true, contributors: results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getIssue = async (req, res) => {
  try {
    const issue = await CommunityIssue.findById(req.params.id).populate('createdBy', 'name email').populate('comments.user', 'name email');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json({ success: true, issue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateIssue = async (req, res) => {
  try {
    const issue = await CommunityIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (issue.createdBy.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });
    const allowed = ['title', 'description', 'location', 'images', 'status'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) issue[field] = req.body[field];
    });
    await issue.save();
    res.json({ success: true, issue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteIssue = async (req, res) => {
  try {
    const issue = await CommunityIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (issue.createdBy.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });
    await issue.remove();
    res.json({ success: true, message: 'Issue deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const voteIssue = async (req, res) => {
  try {
    const issue = await CommunityIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    const userId = req.user._id.toString();
    const idx = issue.voters.findIndex((v) => v.toString() === userId);
    if (idx === -1) {
      issue.voters.push(req.user._id);
      issue.votes = (issue.votes || 0) + 1;
    } else {
      issue.voters.splice(idx, 1);
      issue.votes = Math.max(0, (issue.votes || 1) - 1);
    }
    await issue.save();
    res.json({ success: true, votes: issue.votes, voters: issue.voters.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text required' });
    const issue = await CommunityIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    issue.comments.push({ user: req.user._id, text });
    await issue.save();
    const lastComment = issue.comments[issue.comments.length - 1];
    await lastComment.populate('user', 'name email').execPopulate?.();
    res.status(201).json({ success: true, comment: lastComment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resolve issue (admin) - marks as resolved and records timestamp + admin
const resolveIssue = async (req, res) => {
  try {
    const issue = await CommunityIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    issue.status = 'resolved';
    issue.resolvedAt = new Date();
    issue.resolvedBy = req.user._id;

    await issue.save();

    const populated = await CommunityIssue.findById(issue._id).populate('createdBy', 'name email').populate('resolvedBy', 'name email');
    res.json({ success: true, issue: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createIssue,
  listIssues,
  getStats,
  topContributors,
  getIssue,
  updateIssue,
  deleteIssue,
  voteIssue,
  addComment
  , resolveIssue
};
