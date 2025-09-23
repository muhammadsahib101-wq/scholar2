const express = require("express");
const router = express.Router();

const {
  createDiscussion,
  getAllDiscussions,
  getDiscussionById,
} = require("../controllers/discussionController");

const createSlug = require("../middlewares/createSlugMiddleware");

// Route to create a new discussion
router.post("/user/registerDiscussion", createSlug, createDiscussion);

// Route to get all discussions
router.get("/user/allDiscussions", getAllDiscussions);

// Route to get a category by ID
router.get("/user/getDiscussionById/:id", getDiscussionById);

module.exports = router;
