const express = require("express");
const router = express.Router();

const {
  createNewState,
  getAllStates,
  getStateById,
  updateStateById,
  deleteStateById,
} = require("../controllers/stateController");

const authMiddleware = require("../middlewares/authMiddleware");
const createSlug = require("../middlewares/createSlugMiddleware");
const { singleCategoryUpload } = require("../middlewares/upload");

// Route to create a new state
router.post(
  "/admin/createState",
  singleCategoryUpload,
  authMiddleware,
  createSlug,
  createNewState
);

// Route to get all states
router.get("/user/getAllStates", getAllStates);

// Route to get a state by ID
router.get("/user/getStateById/:stateId", getStateById);

// Route to update a state by ID
router.put(
  "/admin/updateStateById/:stateId",
  singleCategoryUpload,
  authMiddleware,
  updateStateById
);

// Route to delete a state by ID
router.delete(
  "/admin/deleteStateById/:stateId",
  authMiddleware,
  deleteStateById
);

module.exports = router;
