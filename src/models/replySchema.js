const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    discussionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discussion",
      required: true,
    },
    yourName: {
      type: String,
      default: "Anonymous",
      trim: true, // Remove leading/trailing whitespace
    },
    yourEmail: {
      type: String,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"], // Basic email validation
    },
    subject: {
      type: String,
      trim: true,
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Define index on discussionId and createdAt for efficient sorting/querying
replySchema.index({ discussionId: 1, createdAt: -1 });
const Reply = mongoose.model("Reply", replySchema);
module.exports = Reply;
