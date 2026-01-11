const mongoose = require("mongoose");

const knowledgeAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    topic: {
      type: String,
      default: ""
    },
    score: {
      type: Number,
      default: 0
    },
    maxScore: {
      type: Number,
      default: 0
    }
  },
  { timestamps: { createdAt: "attemptedAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("KnowledgeAttempt", knowledgeAttemptSchema);
