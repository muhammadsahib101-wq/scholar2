const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({ storage });

// For schemes – multiple named fields
const multiUpload = upload.fields([
  { name: "bannerImage", maxCount: 1 },
  { name: "cardImage", maxCount: 1 },
]);

// For category – single image field
const singleCategoryUpload = upload.single("image");
module.exports = { multiUpload, singleCategoryUpload };
