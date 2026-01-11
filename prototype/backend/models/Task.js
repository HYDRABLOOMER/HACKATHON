const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    basePoints: {
      type: Number,
      required: true,
      min: 0
    },

    expectedEvidence: {
      imageRequired: {
        type: Boolean,
        default: true
      },
      locationRequired: {
        type: Boolean,
        default: false
      },
      timeWindowMinutes: {
        type: Number
      }
    },

    verificationHints: {
      expectedObjects: {
        type: [String],
        default: []
      },
      minConfidence: {
        type: Number
      }
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    scope: {
      type: String,
      default: "local",
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
