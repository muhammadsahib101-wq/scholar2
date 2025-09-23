const express = require("express");
const router = express.Router();

const {
  createReply,
  getAllReplies,
  getReplyById,
  updateReply,
  deleteReply,
} = require("../controllers/replyController");

const createSlug = require("../middlewares/createSlugMiddleware");

// route to create a new reply
router.post("/user/registerReply", createSlug, createReply);

// route to get all replies
router.get("/user/allReply", getAllReplies);

// route to get reply by id
router.get("/user/getReplyById/:id", getReplyById);

// route to update reply
router.put("/user/updateReplyById/:id", createSlug, updateReply);

// route to delete reply
router.delete("/user/deleteReply/:id", deleteReply);

module.exports = router;
