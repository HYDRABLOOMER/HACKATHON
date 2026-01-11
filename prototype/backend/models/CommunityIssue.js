const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const communityIssueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    priority: { type: String, enum: ['low','medium','high'], default: 'low' },
    locationLat: { type: Number },
    locationLng: { type: Number },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open"
    },
    votes: { type: Number, default: 0 },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

// Text index for basic search
communityIssueSchema.index({ title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model("CommunityIssue", communityIssueSchema);
