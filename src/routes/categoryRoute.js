const express = require("express");
const router = express.Router();

const {
  createNewCategory,
  getAllCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
} = require("../controllers/categoryController");

const authMiddleware = require("../middlewares/authMiddleware");
const createSlug = require("../middlewares/createSlugMiddleware");
const { singleCategoryUpload } = require("../middlewares/upload");

// Route to create a new category
router.post(
  "/admin/registerCategory",
  authMiddleware,
  singleCategoryUpload,
  createSlug,
  createNewCategory
);

// Route to get all categories
router.get("/user/allCategories", getAllCategories);

// Route to get a category by ID
router.get("/user/getCategoryById/:id", getCategoryById);

// Route to update a category by ID
router.put(
  "/admin/updateCategoryById/:id",
  authMiddleware,
  singleCategoryUpload,
  createSlug,
  updateCategoryById
);

// Route to delete a category by ID
router.delete(
  "/admin/deleteCategoryById/:id",
  authMiddleware,
  deleteCategoryById
);

module.exports = router;
