const mongoose = require("mongoose");

const discussionSchema = new mongoose.Schema(
  {
    scheme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scheme",
      required: true,
    },
    discussionTitle: {
      type: String,
      required: [true, "Discussion title is required"],
      trim: true,
    },
    discussionInBrief: {
      type: String,
      required: [true, "Brief Discussion title is required"],
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    mobileNo: {
      type: String,
      trim: true,
      match: [/^\d{10}$/, "Mobile number must be 10 digits"],
    },
    gender: {
      type: String,
      // enum: ["Male", "Female", "Transgender"],
    },
    dateOfBirth: {
      type: Date,
    },
    cast: {
      type: String,
      // enum: [
      //   "General",
      //   "Economically Weaker Section",
      //   "Other Backward Class",
      //   "Schedule Caste",
      //   "Schedule Tribe",
      //   "Other...",
      // ],
    },
    religion: {
      type: String,
    },
    houseNumber: { type: String },
    locality: { type: String },
    city: { type: String },
    wardNumber: { type: String },
    tehsil: { type: String },
    district: { type: String },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "States",
    },
    category: {
      type: [String],
      // enum: [
      //   "Agriculture",
      //   "Business",
      //   "Education",
      //   "Fund Support",
      //   "Housing",
      //   "Loan",
      //   "Politics",
      //   "Social Welfare",
      // ],
      // required: [true, "category is required"],
    },
    pinCode: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  },
  { timestamps: true }
);

discussionSchema.index({ scheme: 1, createdAt: -1 });

module.exports = mongoose.model("Discussion", discussionSchema);
