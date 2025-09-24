const dotenv = require("dotenv");
dotenv.config();

const imagekit = require("../utils/imageKit");
const State = require("../models/stateSchema");
const Scheme = require("../models/schemeSchema");
const Category = require("../models/categorySchema");

function createNewScheme(request, response) {
  const {
    schemeTitle,
    publishedOn,
    about,
    objectives,
    textWithHTMLParsing,
    salientFeatures,
    helplineNumber,
    frequentlyAskedQuestions,
    sourcesAndReferences,
    disclaimer,
    category,
    state,
    isFeatured,
    slug,
    excerpt,
    seoTitle,
    seoMetaDescription,
    link1,
    link2,
    link3,
  } = request.body;

  const userId = request.user.id;
  const bannerImageFile = request.files?.bannerImage?.[0];
  const cardImageFile = request.files?.cardImage?.[0];
  if (!schemeTitle || !about || !textWithHTMLParsing) {
    return response.status(400).json({
      success: false,
      message:
        "Required fields missing: schemeTitle, about, or textWithHTMLParsing.",
    });
  }
  if (!bannerImageFile || !cardImageFile) {
    return response.status(400).json({
      success: false,
      message: "Both bannerImage and cardImage are required.",
    });
  }
  Scheme.findOne({ schemeTitle })
    .then((existingScheme) => {
      if (existingScheme) {
        return Promise.reject({
          status: 400,
          message: "Scheme with the same schemeTitle already exists.",
        });
      }
      const uploadBanner = imagekit.upload({
        file: bannerImageFile.buffer,
        fileName: bannerImageFile.originalname,
      });
      const uploadCard = imagekit.upload({
        file: cardImageFile.buffer,
        fileName: cardImageFile.originalname,
      });
      return Promise.all([uploadBanner, uploadCard]);
    })
    .then(([bannerResult, cardResult]) => {
      const newScheme = new Scheme({
        bannerImage: {
          url: bannerResult.url,
          fileId: bannerResult.fileId,
        },
        cardImage: {
          url: cardResult.url,
          fileId: cardResult.fileId,
        },
        schemeTitle,
        author: userId,
        publishedOn,
        about: about.trim(),
        objectives,
        textWithHTMLParsing: {
          htmlDescription: textWithHTMLParsing,
        },
        category: JSON.parse(category || "{}"),
        salientFeatures: JSON.parse(salientFeatures || "[]"),
        helplineNumber: JSON.parse(helplineNumber || "{}"),
        frequentlyAskedQuestions: JSON.parse(frequentlyAskedQuestions || "[]"),
        sourcesAndReferences: JSON.parse(sourcesAndReferences || "[]"),
        disclaimer: JSON.parse(disclaimer || "{}"),
        isFeatured: JSON.parse(isFeatured || "false"),
        createdBy: userId,
        updatedBy: userId,
        state: JSON.parse(state || "[]"),
        slug,
        excerpt,
        seoTitle,
        seoMetaDescription,
        link1: JSON.parse(link1 || "{}"),
        link2: JSON.parse(link2 || "{}"),
        link3: JSON.parse(link3 || "{}"),
      });
      return newScheme.save();
    })
    .then((savedScheme) => {
      return Scheme.findById(savedScheme._id)
        .populate("author", "name email")
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .populate("category", "name")
        .populate("state", "name");
    })
    .then((populatedScheme) => {
      return response.status(201).json({
        success: true,
        message: "New scheme created successfully.",
        data: populatedScheme,
      });
    })
    .catch((error) => {
      if (error.status) {
        return response.status(error.status).json({
          success: false,
          message: error.message,
        });
      }
      return response.status(500).json({
        success: false,
        message: "An error occurred while creating the scheme.",
        error: error.message || error,
      });
    });
}

const getAllSchemes = async (req, res) => {
  try {
    const { stateId, categoryId, stateSlug, categorySlug } = req.query;
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 4;
    const filter = {};
    if (stateId) filter.state = stateId;
    if (categoryId) filter.category = categoryId;
    const [state, category] = await Promise.all([
      stateSlug ? State.findOne({ slug: stateSlug }).lean() : null,
      categorySlug ? Category.findOne({ slug: categorySlug }).lean() : null,
    ]);
    if (stateSlug && !state)
      return res
        .status(404)
        .json({ success: false, message: "State not found with this slug" });
    if (categorySlug && !category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found with this slug" });
    if (state) filter.state = state._id;
    if (category) filter.category = category._id;
    const [total, schemes] = await Promise.all([
      Scheme.countDocuments(filter),
      Scheme.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("author", "name email")
        // .populate("createdBy", "name email")
        // .populate("updatedBy", "name email")
        .populate("state", "name slug")
        .populate("category", "name slug")
        .lean(),
    ]);
    return res.status(200).json({
      success: true,
      total,
      length: schemes.length,
      message: "Schemes fetched successfully",
      data: schemes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching schemes.",
      error: error.message || error,
    });
  }
};

const getSchemeBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const scheme = await Scheme.findOne({ slug })
      .populate("author", "name email")
      // .populate("createdBy", "name email")
      // .populate("updatedBy", "name email")
      .populate("category", "name")
      .populate("state", "name")
      .lean();
    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: "Scheme not found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Scheme fetched successfully.",
      data: scheme,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the scheme.",
      error: error.message || error,
    });
  }
};

function updateSchemeById(request, response) {
  const schemeId = request.params.id;
  const userId = request.user.id;
  const {
    schemeTitle,
    about,
    objectives,
    textWithHTMLParsing,
    salientFeatures,
    helplineNumber,
    frequentlyAskedQuestions,
    sourcesAndReferences,
    disclaimer,
    publishedOn,
    category,
    state,
    isFeatured,
    slug,
    excerpt,
    seoTitle,
    seoMetaDescription,
    link1,
    link2,
    link3,
  } = request.body;
  const updateData = {
    ...(schemeTitle && { schemeTitle }),
    ...(about && { about: about.trim() }),
    ...(objectives && { objectives }),
    ...(textWithHTMLParsing && {
      textWithHTMLParsing: { htmlDescription: textWithHTMLParsing },
    }),
    ...(salientFeatures && { salientFeatures: JSON.parse(salientFeatures) }),
    ...(helplineNumber && { helplineNumber: JSON.parse(helplineNumber) }),
    ...(frequentlyAskedQuestions && {
      frequentlyAskedQuestions: JSON.parse(frequentlyAskedQuestions),
    }),
    ...(sourcesAndReferences && {
      sourcesAndReferences: JSON.parse(sourcesAndReferences),
    }),
    ...(disclaimer && { disclaimer: JSON.parse(disclaimer) }),
    ...(publishedOn && { publishedOn }),
    updatedBy: userId,
    ...(category && { category: JSON.parse(category) }),
    ...(state && { state: JSON.parse(state) }),
    ...(isFeatured && { isFeatured: JSON.parse(isFeatured) }),
    ...(slug && { slug }),
    ...(excerpt && { excerpt }),
    ...(seoTitle && { seoTitle }),
    ...(seoMetaDescription && { seoMetaDescription }),
    ...(link1 && { link1 }),
    ...(link2 && { link2 }),
    ...(link3 && { link3 }),
  };
  const files = request.files;
  const uploadPromises = [];
  if (files?.bannerImage?.[0]) {
    const bannerImage = files.bannerImage[0];
    const uploadPromise = imagekit
      .upload({
        file: bannerImage.buffer,
        fileName: bannerImage.originalname,
      })
      .then((uploadResponse) => {
        updateData.bannerImage = {
          url: uploadResponse.url,
          fileId: uploadResponse.fileId,
        };
      });
    uploadPromises.push(uploadPromise);
  }
  if (files?.cardImage?.[0]) {
    const cardImage = files.cardImage[0];
    const uploadPromise = imagekit
      .upload({
        file: cardImage.buffer,
        fileName: cardImage.originalname,
      })
      .then((uploadResponse) => {
        updateData.cardImage = {
          url: uploadResponse.url,
          fileId: uploadResponse.fileId,
        };
      });
    uploadPromises.push(uploadPromise);
  }
  Promise.all(uploadPromises)
    .then(() => {
      return Scheme.findByIdAndUpdate(schemeId, updateData, { new: true })
        .populate("author", "name email")
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .populate("category", "name")
        .populate("state", "name");
    })
    .then((updatedScheme) => {
      if (!updatedScheme) {
        return response.status(404).json({
          success: false,
          message: "Scheme not found",
        });
      }
      return response.status(200).json({
        success: true,
        message: "Scheme updated successfully",
        data: updatedScheme,
      });
    })
    .catch((error) => {
      console.error("Update Scheme Error:", error);
      return response.status(500).json({
        success: false,
        message: "Could not update scheme",
        error: error.message || error,
      });
    });
}

function deleteSchemeById(request, response) {
  const schemeId = request.params.id;
  Scheme.findByIdAndDelete(schemeId)
    .then((deletedScheme) => {
      if (!deletedScheme) {
        return response.status(404).json({
          success: false,
          message: "Scheme not found",
        });
      }
      return response.status(200).json({
        success: true,
        message: "Scheme deleted successfully",
      });
    })
    .catch((error) => {
      console.error("Delete Scheme Error:", error);
      return response.status(500).json({
        success: false,
        message: "Could not delete scheme",
        error: error.message || error,
      });
    });
}

const getSchemesByState = async (req, res) => {
  try {
    const results = await State.aggregate([
      { $sort: { name: 1 } },
      {
        $lookup: {
          from: "schemes",
          let: { stateId: "$_id" },
          pipeline: [
            { $match: { $expr: { $in: ["$$stateId", "$state"] } } },
            { $count: "count" },
          ],
          as: "schemeStats",
        },
      },
      {
        $lookup: {
          from: "discussions",
          let: { stateId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$state", "$$stateId"] } } },
            { $count: "count" },
          ],
          as: "discussionStats",
        },
      },
      {
        $project: {
          _id: 0,
          stateId: "$_id",
          name: 1,
          image: 1,
          slug: 1,
          totalSchemes: {
            $ifNull: [{ $arrayElemAt: ["$schemeStats.count", 0] }, 0],
          },
          totalDiscussions: {
            $ifNull: [{ $arrayElemAt: ["$discussionStats.count", 0] }, 0],
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong…",
    });
  }
};

const getSchemesByCategory = async (req, res) => {
  try {
    const results = await Category.aggregate([
      { $sort: { name: 1 } },
      {
        $lookup: {
          from: "schemes",
          let: { categoryId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$category", "$$categoryId"] } } },
            { $count: "count" },
          ],
          as: "schemeStats",
        },
      },
      {
        $project: {
          _id: 0,
          categoryId: "$_id",
          name: 1,
          image: 1,
          slug: 1,
          totalSchemes: {
            $ifNull: [{ $arrayElemAt: ["$schemeStats.count", 0] }, 0],
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong…",
    });
  }
};

function searchScheme(request, response) {
  const { query } = request.query;
  if (!query) {
    return response.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }
  Scheme.find({ schemeTitle: { $regex: query, $options: "i" } })
    .populate("author", "name email")
    // .populate("createdBy", "name email")
    // .populate("updatedBy", "name email")
    .populate("category", "name")
    .populate("state", "name")
    .then((schemes) => {
      if (!schemes || schemes.length === 0) {
        return response.status(404).json({
          success: false,
          message: "No Schemes are found",
        });
      }
      return response.status(200).json({
        success: true,
        message: "Scheme fetched successfully",
        data: schemes,
      });
    })
    .catch((error) => {
      return response.status(500).json({
        success: false,
        message: "An error occurred while fetching the scheme.",
        error: error.message || error,
      });
    });
}

module.exports = {
  createNewScheme,
  getAllSchemes,
  getSchemeBySlug,
  updateSchemeById,
  deleteSchemeById,
  getSchemesByState,
  getSchemesByCategory,
  searchScheme,
};
