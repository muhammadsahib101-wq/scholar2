const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  discussion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Discussion",
    required: true,
  },
  yourName: { type: String },
  slug: { type: String, unique: true, lowercase: true },
  yourEmail: { type: String },
  subject: { type: String },
  comment: { type: String, required: [true, "Comment is required"] },
});

module.exports = mongoose.model("Reply", replySchema);
