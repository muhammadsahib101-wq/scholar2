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
      required: [true, "Phone Number is required"],
      trim: true,
      match: [/^\d{10}$/, "Mobile number must be 10 digits"], // Optional validation
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Transgender"],
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
      required: [true, "Cast is required"],
    },
    religion: {
      type: String,
      enum: [
        "Buddhist",
        "Christian",
        "Hindu",
        "Jain",
        "Sikh",
        "Other..."
      ],
      required: [true, "Religion is required"]
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
      required: true
    },
    pinCode: { type: String, required: [true, "Pincode is required"] },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users"
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users"
    }
  },
  { timestamps: true }
);

discussionSchema.index({ scheme: 1, createdAt: -1 });

module.exports = mongoose.model("Discussion", discussionSchema);