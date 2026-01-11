const express = require("express");

const multer = require("multer");
const path = require("path");

const authMiddleware = require("../middleware/auth.js");
const Task = require("../models/Task.js");
const TaskSubmission = require("../models/TaskSubmission.js");
const UserScore = require("../models/UserScore.js");
const User = require("../models/User.js");
const IssueReport = require("../models/IssueReport.js");
const KnowledgeAttempt = require("../models/KnowledgeAttempt.js");
const VerificationResult = require("../models/VerificationResult.js");
const TaskEvent = require("../models/TaskEvent.js");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "..", "uploads");
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      const safeExt = ext && ext.length <= 10 ? ext : "";
      const name = `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`;
      cb(null, name);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
});

function decideVerification({ aiConfidence, fraudScore, minConfidence }) {
  const confidenceThreshold = typeof minConfidence === "number" ? minConfidence : 0.75;
  const high = confidenceThreshold;
  const mid = Math.max(0, confidenceThreshold - 0.25);

  if (typeof aiConfidence !== "number") return "manual_review";
  if (aiConfidence >= high && (typeof fraudScore !== "number" || fraudScore <= 0.3)) return "approved";
  if (aiConfidence >= mid) return "manual_review";
  return "rejected";
}

function startOfDayUtc(d) {
  const date = d instanceof Date ? d : new Date(d);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function awardPointsIfNeeded(submission) {
  if (submission.status !== "verified") return null;
  if (submission.pointsAwardedAt) return null;

  const task = await Task.findById(submission.taskId);
  const pointsAwarded = task ? task.basePoints : 0;

  const now = new Date();
  const todayUtc = startOfDayUtc(now);
  const yesterdayUtc = new Date(todayUtc);
  yesterdayUtc.setUTCDate(yesterdayUtc.getUTCDate() - 1);

  const existingScore = await UserScore.findOneAndUpdate(
    { userId: submission.userId },
    { $setOnInsert: { userId: submission.userId } },
    { upsert: true, new: true }
  );

  const last = existingScore?.streakLastDate ? startOfDayUtc(existingScore.streakLastDate) : null;
  const currentStreak = typeof existingScore?.streakDays === "number" ? existingScore.streakDays : 0;
  const bestStreak = typeof existingScore?.streakBestDays === "number" ? existingScore.streakBestDays : 0;

  let nextStreakDays;
  if (!last) {
    nextStreakDays = 1;
  } else if (last.getTime() === todayUtc.getTime()) {
    nextStreakDays = Math.max(1, currentStreak);
  } else if (last.getTime() === yesterdayUtc.getTime()) {
    nextStreakDays = currentStreak + 1;
  } else {
    nextStreakDays = 1;
  }

  const nextBest = Math.max(bestStreak, nextStreakDays);

  const score = await UserScore.findOneAndUpdate(
    { userId: submission.userId },
    {
      $inc: { totalPoints: pointsAwarded, tasksCompleted: 1 },
      $set: { streakDays: nextStreakDays, streakLastDate: todayUtc, streakBestDays: nextBest }
    },
    { new: true }
  );

  submission.pointsAwardedAt = new Date();
  await submission.save();

  return { pointsAwarded, totalPoints: score.totalPoints };
}

async function ensureSeededTasks() {
  const existing = await Task.find({}).lean();
  const existingTitles = new Set(existing.map((t) => t.title));

  const newTasks = [
    {
      title: "Community Recycling Drive",
      description:
        "Organize or participate in a local recycling collection event. Document the amount of materials collected and properly sorted.",
      category: "recycling",
      basePoints: 150,
      scope: "local",
      isActive: true
    },
    {
      title: "Tree Planting Initiative",
      description:
        "Plant native trees in designated areas. Submit a short description and location of the planting.",
      category: "conservation",
      basePoints: 200,
      scope: "local",
      isActive: true
    },
    {
      title: "Environmental Workshop",
      description:
        "Conduct or attend an environmental awareness workshop. Share key learnings and location.",
      category: "education",
      basePoints: 100,
      scope: "local",
      isActive: true
    },
    {
      title: "Climate Action Campaign",
      description:
        "Organize a climate awareness campaign in your community. Document participation, reach, and impact metrics.",
      category: "advocacy",
      basePoints: 300,
      scope: "local",
      isActive: true
    },
    {
      title: "Beach Cleanup Drive",
      description:
        "Participate in coastal cleanup activities. Log what you cleaned up and where.",
      category: "waste",
      basePoints: 120,
      scope: "local",
      isActive: true
    },
    {
      title: "Neighborhood Plastic Collection",
      description:
        "Collect and properly sort plastic waste from your neighborhood. Submit photos of the sorted bags and drop-off receipt.",
      category: "waste",
      basePoints: 100,
      scope: "local",
      isActive: true
    },
    {
      title: "Home Energy Audit",
      description:
        "Perform a home energy audit and share at least three efficiency improvements you implemented. Include before/after photos.",
      category: "energy",
      basePoints: 180,
      scope: "local",
      isActive: true
    },
    {
      title: "LED Bulb Replacement",
      description:
        "Replace incandescent bulbs with LED bulbs in your home. Document the number of bulbs replaced and estimated savings.",
      category: "energy",
      basePoints: 80,
      scope: "local",
      isActive: true
    },
    {
      title: "Rainwater Harvesting Setup",
      description:
        "Set up a rainwater harvesting system at your home or community space. Submit installation photos and usage notes.",
      category: "water",
      basePoints: 160,
      scope: "local",
      isActive: true
    },
    {
      title: "Riverbank Restoration",
      description:
        "Join or organize a riverbank cleanup and native planting event. Document the area restored and species planted.",
      category: "water",
      basePoints: 220,
      scope: "local",
      isActive: true
    },
    {
      title: "Bike-to-Work Week",
      description:
        "Commit to biking to work or school for a full week. Log your daily rides and total distance traveled.",
      category: "transport",
      basePoints: 140,
      scope: "local",
      isActive: true
    },
    {
      title: "Carpool Coordination",
      description:
        "Organize a carpool group for your workplace or school. Share the schedule, participants, and weekly mileage saved.",
      category: "transport",
      basePoints: 120,
      scope: "local",
      isActive: true
    },
    {
      title: "Composting at Home",
      description:
        "Start a compost bin for kitchen scraps. Submit photos of the setup and the amount of waste diverted per week.",
      category: "waste",
      basePoints: 90,
      scope: "local",
      isActive: true
    },
    {
      title: "Solar Panel Site Survey",
      description:
        "Conduct a site survey for potential solar panel installation. Submit the assessment report and photos.",
      category: "energy",
      basePoints: 130,
      scope: "local",
      isActive: true
    },
    {
      title: "Watershed Cleanup Day",
      description:
        "Participate in a watershed cleanup event. Document the types of waste collected and total weight removed.",
      category: "water",
      basePoints: 110,
      scope: "local",
      isActive: true
    },
    {
      title: "Public Transit Promotion",
      description:
        "Promote public transit use in your community with flyers or social media. Share reach and engagement metrics.",
      category: "transport",
      basePoints: 100,
      scope: "local",
      isActive: true
    },
    {
      title: "School Recycling Program",
      description:
        "Help set up or improve a recycling program at a local school. Document the process and participation rates.",
      category: "recycling",
      basePoints: 170,
      scope: "local",
      isActive: true
    },
    {
      title: "Urban Garden Creation",
      description:
        "Create an urban garden in a vacant lot or community space. Share photos and the types of plants grown.",
      category: "conservation",
      basePoints: 190,
      scope: "local",
      isActive: true
    },
    {
      title: "Eco-Fair Booth",
      description:
        "Run an educational booth at a local eco-fair. Document the topics covered and visitor interactions.",
      category: "education",
      basePoints: 120,
      scope: "local",
      isActive: true
    },
    {
      title: "Policy Letter Campaign",
      description:
        "Write letters to local officials advocating for green policies. Submit copies of the letters and any responses.",
      category: "advocacy",
      basePoints: 150,
      scope: "local",
      isActive: true
    }
  ];

  const toInsert = newTasks.filter((t) => !existingTitles.has(t.title));
  if (toInsert.length > 0) {
    await Task.insertMany(toInsert);
  }
}

router.get("/tasks", authMiddleware, async (req, res, next) => {
  try {
    await ensureSeededTasks();

    const { category, scope } = req.query;
    const query = { isActive: true };

    if (category) query.category = String(category).toLowerCase();
    if (scope) query.scope = String(scope).toLowerCase();

    const tasks = await Task.find(query).sort({ createdAt: -1 });

    // Find submissions for these tasks to hide globally-completed ones and mark user progress
    const taskIds = tasks.map((t) => t._id);
    const allSubmissions = await TaskSubmission.find({
      taskId: { $in: taskIds }
    }).lean();

    const globallyVerifiedTaskIds = new Set(
      allSubmissions.filter((s) => s.status === "verified").map((s) => String(s.taskId))
    );

    const userSubmissionsByTask = allSubmissions.reduce((acc, s) => {
      if (String(s.userId) === String(req.user._id)) {
        acc[String(s.taskId)] = s;
      }
      return acc;
    }, {});

    // Hide tasks that anyone has already verified
    const visibleTasks = tasks.filter((t) => !globallyVerifiedTaskIds.has(String(t._id)));

    res.json(
      visibleTasks.map((t) => {
        const submission = userSubmissionsByTask[String(t._id)];
        return {
          id: t._id,
          title: t.title,
          description: t.description,
          category: t.category,
          points: t.basePoints,
          scope: t.scope,
          submissionId: submission?._id,
          submissionStatus: submission?.status
        };
      })
    );
  } catch (err) {
    next(err);
  }
});

// --- Issue Reports ---
router.post("/issues", authMiddleware, async (req, res, next) => {
  try {
    const { title, category, description, imageUrl, latitude, longitude, locationText, priority } = req.body || {};
    const doc = await IssueReport.create({
      userId: req.user._id,
      title: title || "",
      category: category || "",
      description: description || "",
      imageUrl: imageUrl || "",
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
      locationText: locationText || "",
      priority: priority || "medium"
    });
    res.status(201).json({ id: doc._id });
  } catch (err) {
    next(err);
  }
});

router.get("/issues", authMiddleware, async (req, res, next) => {
  try {
    const { category, search, status } = req.query;
    const query = {};
    if (category) query.category = String(category);
    if (status) query.status = String(status);
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { locationText: { $regex: search, $options: "i" } }
      ];
    }
    const items = await IssueReport.find(query).sort({ createdAt: -1 }).limit(100);
    res.json({
      issues: items.map((i) => ({
        id: i._id,
        title: i.title,
        category: i.category,
        description: i.description,
        imageUrl: i.imageUrl,
        latitude: i.latitude,
        longitude: i.longitude,
        locationText: i.locationText,
        priority: i.priority,
        status: i.status,
        createdAt: i.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

router.get("/issues/:id", authMiddleware, async (req, res, next) => {
  try {
    const issue = await IssueReport.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    res.json({
      id: issue._id,
      title: issue.title,
      category: issue.category,
      description: issue.description,
      imageUrl: issue.imageUrl,
      latitude: issue.latitude,
      longitude: issue.longitude,
      locationText: issue.locationText,
      priority: issue.priority,
      status: issue.status,
      createdAt: issue.createdAt
    });
  } catch (err) {
    next(err);
  }
});

// --- Knowledge Attempts ---
router.post("/quiz/attempts", authMiddleware, async (req, res, next) => {
  try {
    const { topic, score, maxScore } = req.body || {};
    const doc = await KnowledgeAttempt.create({
      userId: req.user._id,
      topic: topic || "",
      score: Number.isFinite(score) ? score : 0,
      maxScore: Number.isFinite(maxScore) ? maxScore : 0
    });
    res.status(201).json({ id: doc._id });
  } catch (err) {
    next(err);
  }
});

router.get("/quiz/attempts/me", authMiddleware, async (req, res, next) => {
  try {
    const attempts = await KnowledgeAttempt.find({ userId: req.user._id }).sort({ attemptedAt: -1 }).limit(50);
    res.json({
      attempts: attempts.map((a) => ({
        id: a._id,
        topic: a.topic,
        score: a.score,
        maxScore: a.maxScore,
        attemptedAt: a.attemptedAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

// --- Verification log (MVP manual endpoint) ---
router.post("/tasks/submissions/:submissionId/verify", authMiddleware, async (req, res, next) => {
  try {
    const submission = await TaskSubmission.findById(req.params.submissionId);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const { aiConfidence, fraudScore, flags, finalStatus } = req.body || {};
    if (!["approved", "rejected", "manual_review"].includes(finalStatus)) {
      return res.status(400).json({ message: "Invalid finalStatus" });
    }

    const vr = await VerificationResult.create({
      submissionId: submission._id,
      aiConfidence,
      fraudScore,
      flags: Array.isArray(flags) ? flags : [],
      verifiedBy: req.user._id,
      finalStatus
    });

    submission.status =
      finalStatus === "approved"
        ? "verified"
        : finalStatus === "rejected"
          ? "rejected"
          : "manual_review";
    submission.verification = {
      aiConfidence,
      fraudScore,
      flags: Array.isArray(flags) ? flags : [],
      finalDecision: finalStatus,
      reviewedAt: new Date()
    };
    await submission.save();

    if (finalStatus === "approved") {
      await TaskEvent.create({
        submissionId: submission._id,
        eventType: "TASK_VERIFIED",
        payload: { finalStatus }
      });
    }

    const awarded = await awardPointsIfNeeded(submission);
    res.json({ verificationId: vr._id, status: submission.status, ...awarded });
  } catch (err) {
    next(err);
  }
});

router.get("/tasks/submissions/:submissionId/verification", authMiddleware, async (req, res, next) => {
  try {
    const vr = await VerificationResult.findOne({ submissionId: req.params.submissionId }).sort({ verifiedAt: -1 });
    if (!vr) return res.status(404).json({ message: "Verification not found" });
    res.json({
      submissionId: vr.submissionId,
      aiConfidence: vr.aiConfidence,
      fraudScore: vr.fraudScore,
      flags: vr.flags,
      verifiedBy: vr.verifiedBy,
      finalStatus: vr.finalStatus,
      verifiedAt: vr.verifiedAt
    });
  } catch (err) {
    next(err);
  }
});

router.get("/tasks/:taskId", async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task || !task.isActive) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Block if anyone already verified this task
    const existingVerified = await TaskSubmission.findOne({
      taskId: task._id,
      status: "verified"
    });
    if (existingVerified) {
      return res.status(400).json({
        message: "Task already completed by another user",
        submissionId: existingVerified._id,
        status: existingVerified.status
      });
    }

    res.json({
      id: task._id,
      title: task.title,
      description: task.description,
      category: task.category,
      points: task.basePoints,
      scope: task.scope
    });
  } catch (err) {
    next(err);
  }
});

router.post("/tasks/:taskId/start", authMiddleware, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task || !task.isActive) {
      return res.status(404).json({ message: "Task not found" });
    }

    const existingVerified = await TaskSubmission.findOne({
      taskId: task._id,
      status: "verified"
    });
    if (existingVerified) {
      return res.status(400).json({
        message: "Task already completed by another user",
        submissionId: existingVerified._id,
        status: existingVerified.status
      });
    }

    const existing = await TaskSubmission.findOne({
      taskId: task._id,
      userId: req.user._id
    });

    if (existing) {
      return res.status(400).json({
        message: "Task already started or completed",
        submissionId: existing._id,
        status: existing.status
      });
    }

    const submission = await TaskSubmission.create({
      taskId: task._id,
      userId: req.user._id,
      status: "pending"
    });

    res.json({ submissionId: submission._id, status: submission.status });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/tasks/submissions/:submissionId/submit",
  authMiddleware,
  upload.array("images", 3),
  async (req, res, next) => {
    try {
      const submission = await TaskSubmission.findById(req.params.submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      if (String(submission.userId) !== String(req.user._id)) {
        return res.status(403).json({ message: "Not allowed" });
      }

      if (submission.status === "verified") {
        return res.status(400).json({ message: "Submission already verified" });
      }

      const { description, latitude, longitude, locationText } = req.body || {};

      const parsedLatitude =
        typeof latitude === "number"
          ? latitude
          : typeof latitude === "string"
            ? Number.parseFloat(latitude)
            : undefined;

      const parsedLongitude =
        typeof longitude === "number"
          ? longitude
          : typeof longitude === "string"
            ? Number.parseFloat(longitude)
            : undefined;

      const files = Array.isArray(req.files) ? req.files : [];
      const imageUrls = files
        .filter((f) => f && typeof f.filename === "string")
        .map((f) => `${req.protocol}://${req.get("host")}/uploads/${f.filename}`);

      submission.evidence = {
        imageUrls,
        description: typeof description === "string" ? description : "",
        latitude: Number.isFinite(parsedLatitude) ? parsedLatitude : undefined,
        longitude: Number.isFinite(parsedLongitude) ? parsedLongitude : undefined,
        locationText: typeof locationText === "string" ? locationText : "",
        submittedAt: new Date()
      };

      // Step 1: mark as pending_verification
      submission.status = "pending_verification";
      await submission.save();

      const task = await Task.findById(submission.taskId);
      const expectedMinConfidence = task?.verificationHints?.minConfidence;

      // Simulated AI output (replace with real AI service call later)
      const aiConfidence = imageUrls.length > 0 ? 0.8 : 0.3;
      const fraudScore = 0.1;
      const flags = imageUrls.length > 0 ? ["image_received"] : ["missing_image"];

      const finalStatus = decideVerification({ aiConfidence, fraudScore, minConfidence: expectedMinConfidence });

      await VerificationResult.create({
        submissionId: submission._id,
        aiConfidence,
        fraudScore,
        flags,
        finalStatus
      });

      submission.status =
        finalStatus === "approved"
          ? "verified"
          : finalStatus === "rejected"
            ? "rejected"
            : "manual_review";
      submission.verification = {
        aiConfidence,
        fraudScore,
        flags,
        finalDecision: finalStatus,
        reviewedAt: new Date()
      };
      await submission.save();

      if (submission.status === "verified") {
        await TaskEvent.create({
          submissionId: submission._id,
          eventType: "TASK_VERIFIED",
          payload: { finalStatus }
        });
      }

      const awarded = await awardPointsIfNeeded(submission);

      res.json({
        status: submission.status,
        submissionId: submission._id,
        ...awarded
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/submissions", authMiddleware, async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { userId: req.user._id };
    if (status) {
      const raw = String(status);
      const parts = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      query.status = parts.length > 1 ? { $in: parts } : raw;
    }

    const items = await TaskSubmission.find(query)
      .sort({ updatedAt: -1 })
      .limit(200)
      .populate("taskId");

    res.json({
      submissions: items.map((s) => ({
        id: s._id,
        taskId: s.taskId?._id,
        taskTitle: s.taskId?.title,
        status: s.status,
        evidence: s.evidence,
        verification: s.verification,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

router.get("/me/dashboard", authMiddleware, async (req, res, next) => {
  try {
    await ensureSeededTasks();

    const score = await UserScore.findOneAndUpdate(
      { userId: req.user._id },
      { $setOnInsert: { userId: req.user._id } },
      { upsert: true, new: true }
    );

    const pendingReview = await TaskSubmission.countDocuments({
      userId: req.user._id,
      status: { $in: ["pending", "pending_verification"] }
    });

    const taskTotals = await Task.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", total: { $sum: 1 } } }
    ]);

    const completedByCategory = await TaskSubmission.aggregate([
      { $match: { userId: req.user._id, status: "verified" } },
      {
        $lookup: {
          from: "tasks",
          localField: "taskId",
          foreignField: "_id",
          as: "task"
        }
      },
      { $unwind: "$task" },
      { $group: { _id: "$task.category", completed: { $sum: 1 } } }
    ]);

    const totalsMap = taskTotals.reduce((acc, row) => {
      acc[String(row._id)] = row.total;
      return acc;
    }, {});

    const completedMap = completedByCategory.reduce((acc, row) => {
      acc[String(row._id)] = row.completed;
      return acc;
    }, {});

    const categories = Array.from(
      new Set([...Object.keys(totalsMap), ...Object.keys(completedMap)])
    ).sort();

    const categoryProgress = categories.map((c) => ({
      category: c,
      completed: completedMap[c] || 0,
      total: totalsMap[c] || 0
    }));

    res.json({
      totalPoints: score.totalPoints,
      tasksCompleted: score.tasksCompleted,
      pendingReview,
      streakDays: score.streakDays || 0,
      categoryProgress
    });
  } catch (err) {
    next(err);
  }
});

router.get("/leaderboard", async (req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit, 10) || 20));

    const rows = await UserScore.aggregate([
      { $sort: { totalPoints: -1, createdAt: 1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          userId: 1,
          totalPoints: 1,
          tasksCompleted: 1,
          name: { $ifNull: ["$user.name", "Anonymous"] },
          email: "$user.email"
        }
      }
    ]);

    const leaderboard = rows.map((row, idx) => ({
      rank: idx + 1,
      userId: row.userId,
      name: row.name,
      email: row.email,
      totalPoints: row.totalPoints,
      tasksCompleted: row.tasksCompleted
    }));

    res.json({ leaderboard });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
