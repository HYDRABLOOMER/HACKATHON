const mongoose =require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    
  ecoPoints: {
    type: Number,
    default: 0
  },

  isAdmin: {
    type: Boolean,
    default: false
  },

  streak: {
    type: Number,
    default: 0
  },

  rank: {
    type: Number,
    default: null
  },

  completedTasks: {
    type: Number,
    default: 0
  },

  completedQuizzes: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
  },
  { timestamps: true }
);

module.exports =mongoose.model("User", userSchema);
