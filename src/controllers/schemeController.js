const redisClient = require("../utils/redis");
const dotenv = require("dotenv");
const zlib = require("zlib");

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
        link1: link1?.trim() || null,
        link2: link2?.trim() || null,
        link3: link3?.trim() || null,
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
    const cacheKey = `schemes:${stateId || ""}:${categoryId || ""}:${
      stateSlug || ""
    }:${categorySlug || ""}:skip${skip}:limit${limit}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "Schemes fetched from cache.",
        ...JSON.parse(cachedData),
      });
    }
    const filter = {};
    let state, category;
    if (stateSlug || categorySlug) {
      [state, category] = await Promise.all([
        stateSlug
          ? State.findOne({ slug: stateSlug }).select("_id").lean()
          : null,
        categorySlug
          ? Category.findOne({ slug: categorySlug }).select("_id").lean()
          : null,
      ]);
    }
    if (stateSlug && !state) {
      return res
        .status(404)
        .json({ success: false, message: "State not found with this slug" });
    }
    if (categorySlug && !category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found with this slug" });
    }
    if (stateId) filter.state = new mongoose.Types.ObjectId(stateId);
    if (categoryId) filter.category = new mongoose.Types.ObjectId(categoryId);
    if (state) filter.state = state._id;
    if (category) filter.category = category._id;
    const schemesQuery = Scheme.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $lookup: {
          from: "states",
          localField: "state",
          foreignField: "_id",
          as: "state",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $project: {
          schemeTitle: 1,
          slug: 1,
          createdAt: 1,
          excerpt: 1,
          bannerImage: 1,
          cardImage: 1,
          "author._id": 1,
          "author.name": 1,
          "state._id": 1,
          "state.name": 1,
          "state.slug": 1,
          "category._id": 1,
          "category.name": 1,
          "category.slug": 1,
        },
      },
    ]);
    const countQuery = Scheme.countDocuments(filter);
    const [schemes, total] = await Promise.all([schemesQuery, countQuery]);
    const responseData = {
      total,
      length: schemes.length,
      message: "Schemes fetched successfully",
      data: schemes,
    };
    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      EX: 60 * 30,
    });
    return res.status(200).json({ success: true, ...responseData });
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
    const cacheKey = `scheme:${slug}`;

    // 🔹 Check cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      try {
        // decompress buffer → string → JSON
        const decompressed = zlib.gunzipSync(Buffer.from(cachedData, "base64")).toString();
        const parsed = JSON.parse(decompressed);

        return res.status(200).json({
          success: true,
          message: "Scheme fetched from cache.",
          data: parsed,
        });
      } catch (err) {
        console.error("❌ Redis Decompression Error:", err);
        // if cache corrupt, ignore it and fetch fresh
      }
    }

    // 🔹 Fetch fresh data
    const scheme = await Scheme.aggregate([
      { $match: { slug, isActive: true, isDeleted: false } },
      { $limit: 1 },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
          pipeline: [{ $project: { _id: 0, name: 1, email: 1 } }],
        },
      },
      { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
          pipeline: [{ $project: { _id: 0, name: 1, slug: 1 } }],
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "states",
          localField: "state",
          foreignField: "_id",
          as: "state",
          pipeline: [{ $project: { _id: 0, name: 1, slug: 1 } }],
        },
      },
      { $unwind: { path: "$state", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          schemeTitle: 1,
          slug: 1,
          link1: 1,
          link2: 1,
          link3: 1,
          bannerImage: 1,
          cardImage: 1,
          excerpt: 1,
          seoTitle: 1,
          seoMetaDescription: 1,
          about: 1,
          objectives: 1,
          textWithHTMLParsing: 1,
          author: 1,
          category: 1,
          state: 1,
          createdAt: 1,
        },
      },
    ]);

    if (!scheme || scheme.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Scheme not found.",
      });
    }

    const schemeData = scheme[0];

    // 🔹 compress before saving to Redis
    const compressed = zlib.gzipSync(JSON.stringify(schemeData)).toString("base64");
    await redisClient.set(cacheKey, compressed, { EX: 60 * 60 * 24 });

    return res.status(200).json({
      success: true,
      message: "Scheme fetched successfully.",
      data: schemeData,
    });
  } catch (error) {
    console.error("❌ Get Scheme Error:", error);
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

// const getSchemesByState = async (req, res) => {
//   try {
//     const cacheKey = "schemesByState";
//     const cachedData = await redisClient.get(cacheKey);
//     if (cachedData) {
//       return res.status(200).json({
//         success: true,
//         message: "Data fetched from cache.",
//         data: JSON.parse(cachedData),
//       });
//     }
//     const results = await State.aggregate([
//       { $sort: { name: 1 } },
//       {
//         $lookup: {
//           from: "schemes",
//           let: { stateId: "$_id" },
//           pipeline: [
//             { $match: { $expr: { $in: ["$$stateId", "$state"] } } },
//             { $count: "count" },
//           ],
//           as: "schemeStats",
//         },
//       },
//       {
//         $lookup: {
//           from: "discussions",
//           let: { stateId: "$_id" },
//           pipeline: [
//             { $match: { $expr: { $eq: ["$state", "$$stateId"] } } },
//             { $count: "count" },
//           ],
//           as: "discussionStats",
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           stateId: "$_id",
//           name: 1,
//           slug: 1,
//           image: 1,
//           totalSchemes: {
//             $ifNull: [{ $arrayElemAt: ["$schemeStats.count", 0] }, 0],
//           },
//           totalDiscussions: {
//             $ifNull: [{ $arrayElemAt: ["$discussionStats.count", 0] }, 0],
//           },
//         },
//       },
//     ]);
//     await redisClient.set(cacheKey, JSON.stringify(results), { EX: 60 * 10 });
//     return res.status(200).json({
//       success: true,
//       message: "Schemes by state fetched successfully.",
//       data: results,
//     });
//   } catch (error) {
//     console.error("❌ getSchemesByState Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "An error occurred while fetching schemes by state.",
//       error: error.message || error,
//     });
//   }
// };
let inMemorySchemesByState = null;

/**
 * Initialize schemes-by-state cache (Mongo → Redis → Memory)
 */
const initializeSchemesByState = async () => {
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
          slug: 1,
          image: 1,
          totalSchemes: { $ifNull: [{ $arrayElemAt: ["$schemeStats.count", 0] }, 0] },
          totalDiscussions: { $ifNull: [{ $arrayElemAt: ["$discussionStats.count", 0] }, 0] },
        },
      },
    ]);

    // Update memory + Redis
    inMemorySchemesByState = results;
    await redisClient.set("schemesByState", JSON.stringify(results), { EX: 60 * 60 * 24 });

    console.log("✅ SchemesByState cache initialized with", results.length, "states");
  } catch (error) {
    console.error("❌ Initialize SchemesByState Error:", error);
  }
};

// Run on startup
initializeSchemesByState();

/**
 * Auto-refresh on changes (optional)
 * You should watch schemes + discussions collections also
 */
State.watch().on("change", initializeSchemesByState);
Schemes.watch().on("change", initializeSchemesByState);
Discussions.watch().on("change", initializeSchemesByState);

/**
 * API: Get Schemes by State
 */
const getSchemesByState = async (req, res) => {
  try {
    // 🚀 Serve from memory if available (fastest ~1ms)
    if (inMemorySchemesByState) {
      return res.status(200).json({
        success: true,
        message: "Schemes by state fetched from memory.",
        data: inMemorySchemesByState,
      });
    }

    // Redis fallback
    const cachedData = await redisClient.get("schemesByState");
    if (cachedData) {
      inMemorySchemesByState = JSON.parse(cachedData); // warm memory
      return res.status(200).json({
        success: true,
        message: "Schemes by state fetched from Redis cache.",
        data: inMemorySchemesByState,
      });
    }

    // Last resort (Mongo aggregation, only on cold start)
    await initializeSchemesByState();
    return res.status(200).json({
      success: true,
      message: "Schemes by state fetched after initialization.",
      data: inMemorySchemesByState,
    });
  } catch (error) {
    console.error("❌ getSchemesByState Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching schemes by state.",
      error: error.message || error,
    });
  }
};

const getSchemesByCategory = async (req, res) => {
  try {
    const cacheKey = "schemesByCategory";
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "Data fetched from cache.",
        data: JSON.parse(cachedData),
      });
    }
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
          slug: 1,
          image: 1,
          totalSchemes: {
            $ifNull: [{ $arrayElemAt: ["$schemeStats.count", 0] }, 0],
          },
        },
      },
    ]);
    await redisClient.set(cacheKey, JSON.stringify(results), { EX: 60 * 10 });
    return res.status(200).json({
      success: true,
      message: "Schemes by category fetched successfully.",
      data: results,
    });
  } catch (error) {
    console.error("❌ getSchemesByCategory Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching schemes by category.",
      error: error.message || error,
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
