const Reply = require("../models/replySchema");
const Discussion = require("../models/discussionSchema");

async function createReply(req, res) {
  try {
    const { discussionId, yourName, yourEmail, subject, comment } = req.body;
    if (!discussionId || !comment) {
      return res.status(400).json({
        success: false,
        message: "Discussion ID and comment are required",
      });
    }
    const discussionExists = await Discussion.findById(discussionId);
    if (!discussionExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid discussion ID",
      });
    }
    const newReply = await Reply.create({
      discussionId,
      yourName,
      yourEmail,
      subject,
      comment,
    });
    return res.status(201).json({
      success: true,
      message: "Reply created successfully",
      data: newReply,
    });
  } catch (error) {
    console.error("Create Reply Error:", error.stack);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate key error",
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create reply",
      error: error.message,
    });
  }
}

function getAllReplies(request, response) {
  const discussionId = request.query.discussionId;
  if (!discussionId) {
    return response.status(400).send({
      success: false,
      message: "discussionId is required to fetch replies",
    });
  }
  Reply.find({ discussionId })
    .sort({ createdAt: -1 })
    .populate("discussionId", "discussionTitle")
    .then((replies) => {
      return response.status(200).send({
        success: true,
        count: replies.length,
        message:
          replies.length > 0
            ? `Replies for discussion ${discussionId} fetched successfully`
            : "No replies found for this discussion",
        data: replies,
      });
    })
    .catch((error) => {
      return response.status(500).send({
        success: false,
        message: "Failed to fetch replies",
        error: error.message || error,
      });
    });
}

function getReplyById(request, response) {
  const replyId = request.params.id;
  Reply.findById(replyId)
    .populate("discussionId", "discussionTitle")
    .then((reply) => {
      if (!reply) {
        return response.status(404).send({
          success: false,
          message: "Reply not found",
        });
      }
      return response.status(200).send({
        success: true,
        message: "Reply fetched successfully",
        data: reply,
      });
    })
    .catch((error) => {
      return response.status(500).send({
        success: false,
        message: "Failed to fetch reply",
        error: error.message || error,
      });
    });
}

function updateReply(request, response) {
  const replyId = request.params.id;
  const updateData = request.body;
  Reply.findByIdAndUpdate(replyId, updateData, {
    new: true,
    runValidators: true,
  })
    .then((reply) => {
      if (!reply) {
        return response.status(404).send({
          success: false,
          message: "Reply not found",
        });
      }
      return Reply.findById(reply._id)
        .populate("discussion", "discussionTitle")
        .then((populatedReply) => {
          return response.status(200).send({
            success: true,
            message: "Reply updated successfully",
            data: populatedReply,
          });
        });
    })
    .catch((error) => {
      return response.status(400).send({
        success: false,
        message: "Failed to update reply",
        error: error.message || error,
      });
    });
}

function deleteReply(request, response) {
  const replyId = request.params.id;
  Reply.findByIdAndDelete(replyId)
    .then((reply) => {
      if (!reply) {
        return response.status(404).send({
          success: false,
          message: "Reply not found",
        });
      }
      return response.status(200).send({
        success: true,
        message: "Reply deleted successfully",
        data: reply,
      });
    })
    .catch((error) => {
      return response.status(500).send({
        success: false,
        message: "Failed to delete reply",
        error: error.message || error,
      });
    });
}

module.exports = {
  createReply,
  getAllReplies,
  getReplyById,
  updateReply,
  deleteReply,
};
