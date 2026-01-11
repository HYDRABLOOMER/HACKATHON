const mongoose = require("mongoose");

const taskEventSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskSubmission",
      required: true
    },
    eventType: {
      type: String,
      default: ""
    },
    payload: {
      type: Object,
      default: {}
    }
  },
  { timestamps: { createdAt: "emittedAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("TaskEvent", taskEventSchema);
