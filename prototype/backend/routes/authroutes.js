const express=require("express");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const User =require("../models/User.js");
const UserScore = require("../models/UserScore.js");
const authMiddleware = require("../middleware/auth.js");

const router = express.Router();
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check user
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Current user
router.get("/me", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const score = await UserScore.findOne({ userId: req.user._id });

  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    bio: req.user.bio || "",
    totalPoints: score?.totalPoints ?? 0,
    tasksCompleted: score?.tasksCompleted ?? 0
  });
});

// Update profile (bio only for now)
router.put("/me", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const bio = typeof req.body?.bio === "string" ? req.body.bio.trim() : undefined;

  if (bio !== undefined) {
    req.user.bio = bio.slice(0, 500);
  }

  await req.user.save();

  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    bio: req.user.bio
  });
});

module.exports = router;
