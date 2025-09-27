const redisClient = require("../utils/redis");
const dotenv = require("dotenv");

dotenv.config();

const imagekit = require("../utils/imageKit");
const States = require("../models/stateSchema");

function createNewState(request, response) {
  const { name, slug } = request.body;
  const userId = request.user.id;
  if (!request.file) {
    return response.status(400).json({
      success: false,
      message: "Image file is required",
    });
  }
  const image = request.file;
  imagekit
    .upload({
      file: image.buffer,
      fileName: image.originalname,
    })
    .then((uploadResponse) => {
      const newState = new States({
        name,
        slug,
        image: uploadResponse.url,
        createdBy: userId,
        updatedBy: userId,
      });
      return newState.save();
    })
    .then((createdState) => {
      return States.findById(createdState._id)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");
    })
    .then((populatedState) => {
      return response.status(201).json({
        success: true,
        message: "New State created successfully",
        data: populatedState,
      });
    })
    .catch((error) => {
      return response.status(500).json({
        success: false,
        message: "New State could not be created",
        error: error.message || error,
      });
    });
}

// const getAllStates = async (req, res) => {
//   try {
//     const cacheKey = "states:all";
//     const cachedData = await redisClient.get(cacheKey);
//     if (cachedData) {
//       return res.status(200).json({
//         success: true,
//         message: "All states fetched from cache.",
//         data: JSON.parse(cachedData),
//       });
//     }
//     const states = await States.find({}, { _id: 1, name: 1, slug: 1 }).lean();
//     if (!states || states.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No states found.",
//       });
//     }
//     await redisClient.set(cacheKey, JSON.stringify(states), { EX: 60 * 60 });
//     return res.status(200).json({
//       success: true,
//       message: "All states fetched successfully.",
//       data: states,
//     });
//   } catch (error) {
//     console.error("❌ Get States Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "An error occurred while fetching states.",
//       error: error.message || error,
//     });
//   }
// };

// In-memory states cache (declared outside the API)
let inMemoryStates = null;

// Initialize states on app startup
const initializeStates = async () => {
  inMemoryStates = await States.find({}, { _id: 1, name: 1, slug: 1 }).lean();
  await redisClient.set("states:all", JSON.stringify(inMemoryStates), { EX: 60 * 60 * 24 * 7 });
};

// Call during app startup (e.g., in your main server file)
initializeStates();

// Cache invalidation with MongoDB Change Streams
const changeStream = States.watch();
changeStream.on("change", async () => {
  await redisClient.del("states:all");
  await initializeStates(); // Reload cache
});

const getAllStates = async (req, res) => {
  try {
    // Use in-memory data if available
    if (inMemoryStates) {
      return res.status(200).json({
        success: true,
        message: "States fetched from memory.",
        data: inMemoryStates,
      });
    }

    const cacheKey = "states:all";
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "All states fetched from cache.",
        data: JSON.parse(cachedData),
      });
    }

    const states = await States.find({}, { _id: 1, name: 1, slug: 1 }).lean();
    if (!states || states.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No states found.",
      });
    }

    await redisClient.set(cacheKey, JSON.stringify(states), { EX: 60 * 60 * 24 * 7 });

    return res.status(200).json({
      success: true,
      message: "All states fetched successfully.",
      data: states,
    });
  } catch (error) {
    console.error("❌ Get States Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching states.",
      error: error.message || error,
    });
  }
};

function getStateById(request, response) {
  const { stateId } = request.params;
  States.findById(stateId)
    .then((fetchState) => {
      if (!fetchState) {
        return response.status(404).json({
          success: false,
          message: "State not found with this ID",
        });
      }
      return response.status(200).json({
        success: true,
        message: "State fetched successfully",
        data: fetchState,
      });
    })
    .catch((error) => {
      return response.status(500).json({
        success: false,
        message: error.message || error,
      });
    });
}

function updateStateById(request, response) {
  const updateData = {};
  const { name } = request.body;
  const userId = request.user.id;
  const { stateId } = request.params;
  if (name) updateData.name = name;
  if (userId) updateData.updatedBy = userId;
  let imageUploadPromise = Promise.resolve(null);
  if (request.file) {
    imageUploadPromise = imagekit.upload({
      file: request.file.buffer,
      fileName: request.file.originalname,
    });
  }
  imageUploadPromise
    .then((uploadResponse) => {
      if (uploadResponse && uploadResponse.url) {
        updateData.image = uploadResponse.url;
      }
      return States.findByIdAndUpdate(stateId, updateData, {
        new: true,
        runValidators: true,
      })
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");
    })
    .then((updatedState) => {
      if (!updatedState) {
        return response.status(404).json({
          success: false,
          message: "State not found with this ID",
        });
      }
      response.status(200).json({
        success: true,
        message: "State updated successfully",
        data: updatedState,
      });
    })
    .catch((error) => {
      response.status(500).json({
        success: false,
        message: error.message || "State could not be updated",
      });
    });
}

function deleteStateById(request, response) {
  const { stateId } = request.params;
  States.findByIdAndDelete(stateId)
    .then((deletedState) => {
      if (!deletedState) {
        return response.status(404).json({
          success: false,
          message: "State not found with this ID",
        });
      }
      return response.status(200).json({
        success: true,
        message: "State deleted successfully",
        data: deletedState,
      });
    })
    .catch((error) => {
      return response.status(500).json({
        success: false,
        message: error.message || error,
      });
    });
}

module.exports = {
  createNewState,
  getAllStates,
  getStateById,
  updateStateById,
  deleteStateById,
};
