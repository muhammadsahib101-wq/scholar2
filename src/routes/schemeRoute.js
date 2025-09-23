const express = require("express");
const router = express.Router();

const {
  createNewScheme,
  getAllSchemes,
  getSchemeBySlug,
  updateSchemeById,
  deleteSchemeById,
  getSchemesByState,
  getSchemesByCategory,
  searchScheme,
} = require("../controllers/schemeController");

const { multiUpload } = require("../middlewares/upload");
const authMiddleware = require("../middlewares/authMiddleware");

// Route for creating a new scheme
router.post(
  "/admin/registerScheme",
  multiUpload,
  authMiddleware,
  createNewScheme
);

// Route for getting all schemes
router.get("/user/getAllSchemes", getAllSchemes);

// Route for getting schemes by state
router.get("/user/getSchemesByState", getSchemesByState);

// Route for getting schemes by category
router.get("/user/getSchemesByCategory", getSchemesByCategory);

// Route for getting a scheme by ID
router.get("/user/getSchemeBySlug/:slug", getSchemeBySlug);

// Route for updating a scheme by ID
router.put(
  "/admin/updateSchemeById/:id",
  multiUpload,
  authMiddleware,
  updateSchemeById
);

// Route for deleting a scheme by ID
router.delete("/admin/deleteSchemeById/:id", authMiddleware, deleteSchemeById);

// Route for searching the scheme
router.get("/user/searchScheme", searchScheme);

module.exports = router;
