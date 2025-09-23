const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema({
  image: { type: String },
  name: {
    type: String,
    required: [true, "State Name is Required..."],
    minLength: [3, "State name must be 3 letter or more than 3 letter"],
  },
  slug: { type: String, unique: true, lowercase: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
});

module.exports = mongoose.model("States", stateSchema);
