const mongoose = require("mongoose");

const schemeSchema = new mongoose.Schema(
  {
    bannerImage: {
      url: { type: String, required: true },
      fileId: { type: String, required: true },
    },
    cardImage: {
      url: { type: String, required: true },
      fileId: { type: String, required: true },
    },
    schemeTitle: { type: String, required: true, unique: true, trim: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    isFeatured: { type: Boolean },
    slug: { type: String, unique: true, lowercase: true },
    link1: {
      url: { type: String },
      name: { type: String },
    },
    link2: {
      url: { type: String },
      name: { type: String },
    },
    link3: {
      url: { type: String },
      name: { type: String },
    },
    excerpt: { type: String, lowercase: true },
    seoTitle: { type: String, lowercase: true },
    seoMetaDescription: { type: String, lowercase: true },
    state: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "States",
        required: true,
      },
    ],
    publishedOn: { type: Date, default: Date.now },
    about: { type: String, required: true },
    objectives: { type: String },
    textWithHTMLParsing: {
      htmlDescription: { type: String, required: true },
    },
    salientFeatures: [
      {
        subTitle: { type: String },
        subDescription: { type: String },
      },
    ],
    helplineNumber: {
      tollFreeNumber: { type: String },
      emailSupport: { type: String },
      availability: { type: String },
    },
    frequentlyAskedQuestions: [
      {
        question: { type: String },
        answer: { type: String },
      },
    ],
    sourcesAndReferences: [
      {
        sourceName: { type: String },
        sourceLink: { type: String },
      },
    ],
    disclaimer: {
      description: { type: String },
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Scheme", schemeSchema);
