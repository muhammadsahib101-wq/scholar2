const Reply = require("../models/replySchema");

function createReply(request, response) {
  const replyData = request.body;
  Reply.create(replyData)
    .then((reply) => {
      return response.status(201).send({
        success: true,
        message: "Reply created successfully",
        data: reply,
      });
    })
    .catch((error) => {
      return response.status(400).send({
        success: false,
        message: "Failed to create reply",
        error: error.message || error,
      });
    });
}

function getAllReplies(request, response) {
  Reply.find({})
    .populate("discussion", "discussionTitle")
    .then((replies) => {
      return response.status(200).send({
        success: true,
        message: "Replies fetched successfully",
        count: replies.length,
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
    .populate("discussion", "discussionTitle")
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
