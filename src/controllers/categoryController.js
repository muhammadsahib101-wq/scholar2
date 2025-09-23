const dotenv = require("dotenv");

dotenv.config();

const imagekit = require("../utils/imageKit");
const Category = require("../models/categorySchema");

function createNewCategory(request, response) {
  const { name, description, slug } = request.body;
  const userId = request.user.id;
  if (!request.file) {
    return response.status(400).json({
      success: false,
      message: "Image file is required",
    });
  }
  const imageFile = request.file;
  imagekit
    .upload({
      file: imageFile.buffer,
      fileName: imageFile.originalname,
    })
    .then((uploadResponse) => {
      const newCategory = new Category({
        name,
        description,
        slug,
        image: uploadResponse.url,
        createdBy: userId,
        updatedBy: userId,
      });
      return newCategory.save();
    })
    .then((createdCategory) => {
      return Category.findById(createdCategory._id)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");
    })
    .then((populatedCategory) => {
      return response.status(201).json({
        success: true,
        message: "New Category created successfully",
        data: populatedCategory,
      });
    })
    .catch((error) => {
      return response.status(500).json({
        success: false,
        message: "New Category could not be created",
        error: error.message || error,
      });
    });
}

function getAllCategories(request, response) {
  const skip = parseInt(request.query.skip) || 0;
  const limit = parseInt(request.query.limit) || 11;
  Category.find({})
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit)
    .then((allCategories) => {
      if (allCategories.length === 0) {
        return response
          .status(400)
          .send({ message: "There is no category to fetch!" });
      }
      return response.status(200).send({
        length: allCategories.length,
        success: true,
        message: "Categories fetched successfully",
        data: allCategories,
      });
    })
    .catch((error) => {
      return response.status(500).send({
        success: true,
        message: "Categories fetched successfully",
        error: error.message || error,
      });
    });
}

function getCategoryById(request, response) {
  const categoryId = request.params.id;
  Category.findById(categoryId)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .then((category) => {
      if (!category) {
        return response.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      return response.status(200).json({
        success: true,
        message: "Category retrieved successfully",
        data: category,
      });
    })
    .catch((error) => {
      return response.status(500).json({
        success: false,
        message: "Could not retrieve category",
        error: error.message || error,
      });
    });
}

function updateCategoryById(request, response) {
  const categoryId = request.params.id;
  const { name, description, slug } = request.body;
  const userId = request.user.id;
  const updateData = {
    name,
    slug,
    description,
    updatedBy: userId,
  };
  const imageFile = request.file;
  if (imageFile) {
    imagekit
      .upload({
        file: imageFile.buffer,
        fileName: imageFile.originalname,
      })
      .then((uploadResponse) => {
        updateData.image = uploadResponse.url;

        return Category.findByIdAndUpdate(categoryId, updateData, {
          new: true,
        })
          .populate("createdBy", "name email")
          .populate("updatedBy", "name email");
      })
      .then((updatedCategory) => {
        if (!updatedCategory) {
          return response.status(404).json({
            success: false,
            message: "Category not found",
          });
        }
        return response.status(200).json({
          success: true,
          message: "Category updated successfully",
          data: updatedCategory,
        });
      })
      .catch((error) => {
        return response.status(500).json({
          success: false,
          message: "Could not update category",
          error: error.message || error,
        });
      });
  } else {
    Category.findByIdAndUpdate(categoryId, updateData, {
      new: true,
    })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .then((updatedCategory) => {
        if (!updatedCategory) {
          return response.status(404).json({
            success: false,
            message: "Category not found",
          });
        }
        return response.status(200).json({
          success: true,
          message: "Category updated successfully",
          data: updatedCategory,
        });
      })
      .catch((error) => {
        return response.status(500).json({
          success: false,
          message: "Could not update category",
          error: error.message || error,
        });
      });
  }
}

function deleteCategoryById(request, response) {
  const categoryId = request.params.id;
  Category.findByIdAndDelete(categoryId)
    .then((deletedCategory) => {
      if (!deletedCategory) {
        return response.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      return response.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    })
    .catch((error) => {
      return response.status(500).json({
        success: false,
        message: "Could not delete category",
        error: error.message || error,
      });
    });
}

module.exports = {
  createNewCategory,
  getAllCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
};
