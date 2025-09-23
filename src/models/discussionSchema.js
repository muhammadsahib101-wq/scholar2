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
    slug: { type: String, unique: true, lowercase: true },
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
      required: [true, "Phone Number is required"],
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Transgender"],
      default: "",
      required: [true, "Gender is required"],
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    cast: {
      type: String,
      enum: [
        "General",
        "Economically Weaker Section",
        "Other Backward Class",
        "Schedule Caste",
        "Schedule Tribe",
        "Other...",
      ],
      default: "",
      required: [true, "Cast is required"],
    },
    religion: {
      type: String,
      enum: [
        "Buddhist",
        "Christian",
        "Hindu",
        "Muslim",
        "Jain",
        "Sikh",
        "Other...",
      ],
      default: "",
      required: [true, "Cast is required"],
    },
    houseNumber: { type: String },
    locality: { type: String },
    city: { type: String },
    wardNumber: { type: String },
    tehsil: { type: String },
    district: { type: String, required: [true, "District is required"] },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "States",
      required: true,
    },
    pinCode: { type: String, required: [true, "Pincode is required"] },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Discussion", discussionSchema);
