const dotenv = require("dotenv");

dotenv.config();

const Discussion = require("../models/discussionSchema");

function createDiscussion(request, response) {
  const discussionData = {
    ...request.body,
    scheme: request.body.scheme,
  };
  Discussion.create(discussionData)
    .then((discussion) => {
      return response.status(201).send({
        success: true,
        message: "New discussion created",
        data: discussion,
      });
    })
    .catch((error) => {
      if (error.name === "ValidationError") {
        return response.status(400).send({
          success: false,
          message: "Validation error",
          error: error.message,
        });
      }
      return response.status(500).send({
        success: false,
        message: "New discussion could not be created",
        error: error.message || error,
      });
    });
}

function getAllDiscussions(request, response) {
  const skip = parseInt(request.query.skip) || 0;
  const limit = parseInt(request.query.limit) || 6;
  const schemeId = request.query.schemeId;
  const filter = schemeId ? { scheme: schemeId } : {};
  Discussion.find(filter)
    .skip(skip)
    .limit(limit)
    .populate("scheme", "schemeTitle schemeDescription")
    .populate("state", "name")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .then((discussions) => {
      return response.status(200).send({
        success: true,
        length: discussions.length,
        message: schemeId
          ? `Discussions for scheme ${schemeId} fetched successfully`
          : "All discussions fetched successfully",
        data: discussions,
      });
    })
    .catch((error) => {
      return response.status(500).send({
        success: false,
        message: "Failed to fetch discussions",
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
