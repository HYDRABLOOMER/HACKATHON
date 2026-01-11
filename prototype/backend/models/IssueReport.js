const mongoose = require("mongoose");

const issueReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      default: ""
    },
    category: {
      type: String,
      default: ""
    },
    description: {
      type: String,
      default: ""
    },
    imageUrl: {
      type: String,
      default: ""
    },
    locationText: {
      type: String,
      default: ""
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("IssueReport", issueReportSchema);
