const mongoose = require("mongoose");

const taskSubmissionSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    evidence: {
      imageUrls: {
        type: [String],
        default: []
      },
      description: {
        type: String,
        default: "",
        trim: true
      },
      latitude: {
        type: Number
      },
      longitude: {
        type: Number
      },
      locationText: {
        type: String,
        default: "",
        trim: true
      },
      submittedAt: {
        type: Date
      }
    },
    status: {
      type: String,
      default: "pending",
      trim: true,
      enum: ["pending", "pending_verification", "manual_review", "verified", "rejected"]
    },
    verification: {
      aiConfidence: {
        type: Number
      },
      fraudScore: {
        type: Number
      },
      flags: {
        type: [String],
        default: []
      },
      finalDecision: {
        type: String,
        trim: true
      },
      reviewedAt: {
        type: Date
      }
    },
    pointsAwardedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaskSubmission", taskSubmissionSchema);
