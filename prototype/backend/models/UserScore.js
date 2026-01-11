const mongoose = require("mongoose");

const userScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    tasksCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    streakDays: {
      type: Number,
      default: 0,
      min: 0
    },
    streakLastDate: {
      type: Date
    },
    streakBestDays: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserScore", userScoreSchema);
