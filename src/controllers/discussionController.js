const dotenv = require("dotenv");

dotenv.config();

const Discussion = require("../models/discussionSchema");

function createDiscussion(request, response) {
  const userId = request.user.id;
  const schemeId = request.body.schemeId;
  const discussionData = {
    ...request.body,
    scheme: schemeId,
    createdBy: userId,
    updatedBy: userId,
  };
  Discussion.create(discussionData)
    .then((discussion) => {
      return response.status(201).send({
        success: true,
        message: "new discussion is created",
        data: discussion,
      });
    })
    .catch((error) => {
      return response.status(500).send({
        success: false,
        message: "new discussion is not created",
        error: error.message || error,
      });
    });
}

function getAllDiscussions(request, response) {
  const skip = parseInt(request.query.skip) || 0;
  const limit = parseInt(request.query.limit) || 6;
  Discussion.find({})
    .skip(skip)
    .limit(limit)
    .populate("scheme", "schemeTitle")
    .populate("state", "name")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .then((allDiscussion) => {
      return response.status(200).send({
        success: true,
        length: allDiscussion.length,
        message: "discussions are fetched successfully",
        data: allDiscussion,
      });
    })
    .catch((error) => {
      return response.status(201).send({
        success: false,
        message: "discussions are not fetched successfully",
        error: error.message || error,
      });
    });
}

function getDiscussionById(request, response) {
  const discussionId = request.params.id;
  Discussion.findById(discussionId)
    .populate("scheme", "schemeTitle")
    .populate("state", "name")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .then((discussion) => {
      if (!discussion) {
        return response.status(404).send({
          success: false,
          message: "Discussion not found",
        });
      }
      return response.status(200).send({
        success: true,
        message: "Discussion fetched successfully",
        data: discussion,
      });
    })
    .catch((error) => {
      return response.status(500).send({
        success: false,
        message: "Failed to fetch discussion",
        error: error.message || error,
      });
    });
}

module.exports = { createDiscussion, getAllDiscussions, getDiscussionById };
